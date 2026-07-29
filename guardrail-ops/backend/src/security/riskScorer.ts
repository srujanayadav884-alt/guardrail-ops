import { DetectionResult } from "./promptInjectionDetector";
import { PolicyDecision } from "./policyEngine";
import { PiiMatch } from "./piiDetector";

export type RiskBand = "low" | "medium" | "high" | "critical";

export interface RiskInput {
  injection: DetectionResult;
  jailbreak: DetectionResult;
  piiMatches: PiiMatch[];
  policy: PolicyDecision;
}

export interface RiskResult {
  score: number; // 0-100
  band: RiskBand;
  factors: Record<string, unknown>;
}

const CONFIDENCE_WEIGHT: Record<DetectionResult["confidence"], number> = {
  low: 10,
  medium: 25,
  high: 40,
}; // no "none" — DetectionResult.detected gates whether this applies at all

export function computeRiskScore(input: RiskInput): RiskResult {
  let score = 0;
  const factors: Record<string, unknown> = {};

  if (input.injection.detected) {
    score += CONFIDENCE_WEIGHT[input.injection.confidence];
    factors.promptInjection = { confidence: input.injection.confidence, matches: input.injection.matchedPhrases };
  }

  if (input.jailbreak.detected) {
    score += CONFIDENCE_WEIGHT[input.jailbreak.confidence];
    factors.jailbreak = { confidence: input.jailbreak.confidence, matches: input.jailbreak.matchedPhrases };
  }

  if (input.piiMatches.length > 0) {
    score += Math.min(input.piiMatches.length * 15, 30);
    factors.piiTypes = input.piiMatches.map((m) => m.type);
  }

  if (input.policy.decision === "block") {
  if (
    input.policy.category === "unauthorized_access" ||
    input.policy.category === "credential_request"
  ) {
    score += 60;
  } else {
    score += 40;
  }

  factors.policyBlock = {
    category: input.policy.category,
    reason: input.policy.reason,
  };
}
  score = Math.min(score, 100);

  let band: RiskBand = "low";
  if (score >= 75) band = "critical";
  else if (score >= 50) band = "high";
  else if (score >= 25) band = "medium";

  return { score, band, factors };
}
