import { Response } from "express";
import { pool } from "../config/db";
import { AuthRequest } from "../middleware/auth";
import { runSecurityPipeline } from "../security";
import { validateResponse } from "../security/responseValidator";
import { writeSecurityLog, writeRiskScore, maybeRaiseAlert } from "../security/securityLogger";
import { generateBankingReply, streamBankingReply, ChatTurn } from "../services/aiGateway";

const REFUSAL_MESSAGE =
  "I am GuardBank AI Assistant and I can help only with banking and financial queries.";

const BANKING_KEYWORDS = [
  "account", "savings", "current account", "loan", "credit card", "debit card",
  "fixed deposit", "fd", "upi", "neft", "rtgs", "imps", "balance", "interest",
  "emi", "kyc", "atm", "ifsc", "transfer", "deposit", "withdraw", "bank",
  "cheque", "statement", "netbanking", "mobile banking", "card", "overdraft",
];

function isBankingRelated(message: string): boolean {
  const lower = message.toLowerCase();
  return BANKING_KEYWORDS.some((kw) => lower.includes(kw));
}

/** Loads the last N turns of a session as AI-gateway context. */
async function loadContext(userId: number, sessionId: string, limit = 12): Promise<ChatTurn[]> {
  const result = await pool.query(
    `SELECT role, message FROM chat_history
     WHERE user_id = $1 AND session_id = $2
     ORDER BY created_at DESC LIMIT $3`,
    [userId, sessionId, limit]
  );
  return result.rows.reverse().map((r) => ({ role: r.role, message: r.message }));
}

/**
 * Runs the full inbound pipeline shared by both the regular and the
 * streaming chat endpoints: persists the user's (masked) message, runs
 * security checks, logs the decision + risk score, and returns everything
 * the caller needs to decide whether to call the AI model.
 */
async function processInboundMessage(userId: number, sessionId: string, message: string, ip: string | null) {
  const pipeline = runSecurityPipeline(message);

  const userMsgResult = await pool.query(
    `INSERT INTO chat_history (user_id, session_id, role, message, was_blocked)
     VALUES ($1, $2, 'user', $3, $4) RETURNING id`,
    [userId, sessionId, pipeline.maskedMessage, !pipeline.allowed]
  );
  const chatHistoryId = userMsgResult.rows[0].id;

  const riskScoreId = await writeRiskScore(userId, chatHistoryId, pipeline.risk);

  const eventType = !pipeline.allowed
    ? "policy_block"
    : pipeline.piiTypesFound.length > 0
    ? "pii_detected"
    : "message_allowed";

  const securityLogId = await writeSecurityLog({
    userId,
    eventType,
    severity: pipeline.risk.band,
    requestSnippet: pipeline.maskedMessage.slice(0, 500),
    details: {
      decision: pipeline.allowed ? "allow" : "block",
      blockReason: pipeline.blockReason,
      policyCategory: pipeline.policy.category,
      riskScore: pipeline.risk.score,
      riskScoreId,
      piiTypesFound: pipeline.piiTypesFound,
    },
    ipAddress: ip,
  });

  const riskBand = pipeline.risk.band;
  if (riskBand === "high" || riskBand === "critical") {
    await maybeRaiseAlert(
      securityLogId,
      !pipeline.allowed ? "Blocked banking assistant request" : "High-risk banking assistant request",
      pipeline.blockReason || "Elevated risk score on an allowed message.",
      riskBand
    );
  }

  // Foundation-level topic gate still applies on top of the security pipeline
  const onTopic = isBankingRelated(pipeline.maskedMessage);

  return { pipeline, chatHistoryId, onTopic };
}

async function storeAssistantReply(userId: number, sessionId: string, text: string, wasBlocked: boolean) {
  await pool.query(
    `INSERT INTO chat_history (user_id, session_id, role, message, was_blocked)
     VALUES ($1, $2, 'assistant', $3, $4)`,
    [userId, sessionId, text, wasBlocked]
  );
}

/** POST /api/chat — non-streaming send */
export async function sendMessage(req: AuthRequest, res: Response) {
  const { message, sessionId } = req.body; // already validated by zod middleware
  const userId = req.user!.userId;
  const ip = req.ip || null;

  const { pipeline, onTopic } = await processInboundMessage(userId, sessionId, message, ip);

  if (!pipeline.allowed) {
    const replyText = pipeline.blockReason
      ? `I can't help with that. ${pipeline.blockReason}`
      : REFUSAL_MESSAGE;
    await storeAssistantReply(userId, sessionId, replyText, true);
    return res.json({ reply: replyText, blocked: true, riskBand: pipeline.risk.band });
  }

  if (!onTopic) {
    await storeAssistantReply(userId, sessionId, REFUSAL_MESSAGE, true);
    return res.json({ reply: REFUSAL_MESSAGE, blocked: true, riskBand: pipeline.risk.band });
  }

  try {
    const context = await loadContext(userId, sessionId);
    const rawReply = await generateBankingReply(context.slice(0, -1), pipeline.maskedMessage);
    const validated = validateResponse(rawReply);

    if (validated.wasModified) {
      await writeSecurityLog({
        userId,
        eventType: "response_pii_masked",
        severity: "medium",
        requestSnippet: pipeline.maskedMessage.slice(0, 500),
        details: { piiTypesFound: validated.piiTypesFound },
        ipAddress: ip,
      });
    }

    await storeAssistantReply(userId, sessionId, validated.text, false);
    return res.json({ reply: validated.text, blocked: false, riskBand: pipeline.risk.band });
  } catch (err) {
    console.error(err);
    const fallback = "GuardBank AI Assistant is temporarily unavailable. Please try again shortly.";
    await storeAssistantReply(userId, sessionId, fallback, false);
    return res.json({ reply: fallback, blocked: false, riskBand: pipeline.risk.band });
  }
}

/** POST /api/chat/stream — token-by-token streaming via Server-Sent Events */
export async function streamMessage(req: AuthRequest, res: Response) {
  const { message, sessionId } = req.body; // already validated by zod middleware
  const userId = req.user!.userId;
  const ip = req.ip || null;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const { pipeline, onTopic } = await processInboundMessage(userId, sessionId, message, ip);

    if (!pipeline.allowed) {
      const replyText = pipeline.blockReason
        ? `I can't help with that. ${pipeline.blockReason}`
        : REFUSAL_MESSAGE;
      await storeAssistantReply(userId, sessionId, replyText, true);
      send("blocked", { reply: replyText, riskBand: pipeline.risk.band });
      return res.end();
    }

    if (!onTopic) {
      await storeAssistantReply(userId, sessionId, REFUSAL_MESSAGE, true);
      send("blocked", { reply: REFUSAL_MESSAGE, riskBand: pipeline.risk.band });
      return res.end();
    }

    let fullText = "";
    const context = await loadContext(userId, sessionId);
    for await (const chunk of streamBankingReply(context.slice(0, -1), pipeline.maskedMessage)) {
      fullText += chunk;
      send("token", { token: chunk });
    }

    const validated = validateResponse(fullText);
    if (validated.wasModified) {
      // The streamed tokens already reached the client as raw text; send a
      // correction event so the UI can swap in the masked final version.
      send("correction", { reply: validated.text });
      await writeSecurityLog({
        userId,
        eventType: "response_pii_masked",
        severity: "medium",
        requestSnippet: pipeline.maskedMessage.slice(0, 500),
        details: { piiTypesFound: validated.piiTypesFound },
        ipAddress: ip,
      });
    }

    await storeAssistantReply(userId, sessionId, validated.text, false);
    send("done", { riskBand: pipeline.risk.band });
  } catch (err) {
    req.log?.error({ err }, "streamMessage failed");
    const fallback = "GuardBank AI Assistant is temporarily unavailable. Please try again shortly.";
    try {
      await storeAssistantReply(userId, sessionId, fallback, false);
    } catch {
      // best-effort — don't let a logging failure crash an already-open stream
    }
    send("error", { reply: fallback });
  }

  res.end();
}

/** GET /api/chat/history?sessionId=... */
export async function getHistory(req: AuthRequest, res: Response) {
  const { sessionId } = req.query;
  const result = await pool.query(
    `SELECT id, session_id, role, message, was_blocked, created_at
     FROM chat_history
     WHERE user_id = $1 ${sessionId ? "AND session_id = $2" : ""}
     ORDER BY created_at ASC`,
    sessionId ? [req.user!.userId, sessionId] : [req.user!.userId]
  );
  return res.json(result.rows);
}
