/**
 * AI Gateway — the only module in the codebase that talks to Groq.
 * The API key lives in process.env.GROQ_API_KEY (backend .env only) and
 * is never sent to, or readable by, the frontend.
 */

export interface ChatTurn {
  role: "user" | "assistant";
  message: string;
}

const SYSTEM_INSTRUCTION =
  "You are GuardBank AI Assistant, a banking assistant for the fictional bank GuardBank. " +
  "Only answer banking and personal-finance questions (accounts, loans, cards, deposits, " +
  "UPI/NEFT/RTGS/IMPS, banking FAQs). Never ask for or restate a password, OTP, PIN, or CVV. " +
  "If asked about anything outside banking/finance, reply exactly: " +
  '"I am GuardBank AI Assistant and I can help only with banking and financial queries."';
function getConfig() {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

  console.log("Groq key loaded:", !!apiKey);
  console.log("Groq model:", model);

  return { apiKey, model };
}

function buildContents(history: ChatTurn[], newMessage: string) {
  const contents = history.map((turn) => ({
    role: turn.role === "assistant" ? "model" : "user",
    parts: [{ text: turn.message }],
  }));
  contents.push({ role: "user", parts: [{ text: newMessage }] });
  return contents;
}

/** Non-streaming call — used by any caller that just wants the full text. */
export async function generateBankingReply(history: ChatTurn[], newMessage: string): Promise<string> {
  const { apiKey, model } = getConfig();
  if (!apiKey) {
    return "GuardBank AI Assistant is not fully configured yet — GROQ_API_KEY is missing on the server.";
  }

  const url = "https://api.groq.com/openai/v1/chat/completions";
  const response = await fetch(url, {
    method: "POST",
    headers: {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${apiKey}`
},
    body: JSON.stringify({
  model,
  messages: [
    {
      role: "system",
      content: SYSTEM_INSTRUCTION
    },
    ...history.map((turn) => ({
      role: turn.role,
      content: turn.message
    })),
    {
      role: "user",
      content: newMessage
    }
  ]
  })
});

  if (!response.ok) {
    const errText = await response.text();
throw new Error(`Groq API error (${response.status}): ${errText}`);
  }

const data: any = await response.json();

 return(
  data?.choices?.[0]?.message?.content ||
  "I couldn't generate a response just now — please try again."
);
 }

/**
 * Streaming call — yields text chunks as they arrive from Gemini's
 * streamGenerateContent endpoint (server-sent JSON array chunks).
 * The caller is responsible for forwarding chunks to the client
 * (see chat.controller.ts streamMessage) and for buffering the full
 * text for response validation/logging once the stream ends.
 */
export async function* streamBankingReply(
  history: ChatTurn[],
  newMessage: string
): AsyncGenerator<string, void, unknown> {

  const reply = await generateBankingReply(history, newMessage);
  yield reply;
}