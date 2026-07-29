import { detectPromptInjection } from "./promptInjectionDetector";
import { detectJailbreak } from "./jailbreakDetector";
import { detectAndMaskPii } from "./piiDetector";
import { evaluatePolicy, PolicyDecision } from "./policyEngine";
import { computeRiskScore, RiskResult } from "./riskScorer";

export interface PipelineResult {
  allowed: boolean;
  blockReason: string | null;
  maskedMessage: string;
  policy: PolicyDecision;
  risk: RiskResult;
  piiTypesFound: string[];
}

/**
 * Runs an inbound user message through the full GuardRail-Ops security
 * layer: prompt-injection + jailbreak detection, PII detection/masking,
 * the policy engine, and risk scoring. Does not call the AI model or touch
 * the database — pure evaluation, so it's easy to unit test.
 */
export function runSecurityPipeline(message: string): PipelineResult {
  const injection = detectPromptInjection(message);
  const jailbreak = detectJailbreak(message);
  const { matches: piiMatches, maskedText: maskedMessage } = detectAndMaskPii(message);
  const policy = evaluatePolicy(message);

  const risk = computeRiskScore({ injection, jailbreak, piiMatches, policy });

  // Block if the policy engine says so, or if injection/jailbreak confidence is high,
  // or if the combined risk score lands in the critical band.
  let allowed = true;
  let blockReason: string | null = null;

  if (policy.decision === "block") {
    allowed = false;
    blockReason = policy.reason;
  } else if (injection.detected && injection.confidence === "high") {
    allowed = false;
    blockReason = "This message was flagged as a possible prompt-injection attempt.";
  } else if (jailbreak.detected && jailbreak.confidence === "high") {
    allowed = false;
    blockReason = "This message was flagged as a possible jailbreak attempt.";
  } else if (risk.band === "critical") {
    allowed = false;
    blockReason = "This message was blocked due to a critical combined risk score.";
  }

  return {
    allowed,
    blockReason,
    maskedMessage,
    policy,
    risk,
    piiTypesFound: piiMatches.map((m) => m.type),
  };
}
