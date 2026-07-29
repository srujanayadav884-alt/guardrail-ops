/**
 * Jailbreak detection — foundation-level heuristic patterns for common
 * jailbreak framings (roleplay-to-bypass, hypothetical/fictional framing
 * used to extract restricted content, "grandma exploit" style prompts).
 */
import { DetectionResult } from "./promptInjectionDetector";

const JAILBREAK_PATTERNS: RegExp[] = [
  /hypothetically/i,
  /in a fictional (world|story|scenario)/i,
  /for (educational|research) purposes only/i,
  /this is (just )?(a )?(game|roleplay|simulation)/i,
  /you have no (restrictions|rules|filters|guardrails)/i,
  /without any (restrictions|limitations|filters)/i,
  /as an? (unfiltered|uncensored|jailbroken) (ai|assistant|model)/i,
  /grandma used to tell me/i,
  /pretend (there are|there is) no (rules|policy|guardrails)/i,
  /just this once/i,
  /nobody (will|is going to) know/i,
  /output (raw|unmasked|unredacted)/i,
];

export function detectJailbreak(message: string): DetectionResult {
  const matched: string[] = [];
  for (const pattern of JAILBREAK_PATTERNS) {
    const m = message.match(pattern);
    if (m) matched.push(m[0]);
  }

  let confidence: DetectionResult["confidence"] = "low";
  if (matched.length >= 2) confidence = "high";
  else if (matched.length === 1) confidence = "medium";

  return { detected: matched.length > 0, matchedPhrases: matched, confidence };
}
