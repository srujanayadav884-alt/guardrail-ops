/**
 * Prompt-injection detection — foundation-level heuristic (keyword/pattern
 * matching), not a trained classifier. Flags attempts to override the
 * assistant's instructions, extract its system prompt, or make it act
 * outside its defined role.
 */

export interface DetectionResult {
  detected: boolean;
  matchedPhrases: string[];
  confidence: "low" | "medium" | "high";
}

const INJECTION_PATTERNS: RegExp[] = [
  /ignore (all )?(previous|prior|above) instructions/i,
  /disregard (all )?(previous|prior|above) (instructions|rules|prompt)/i,
  /forget (everything|all) (you were told|above)/i,
  /you are now/i,
  /new instructions?:/i,
  /system prompt/i,
  /reveal (your|the) (system prompt|instructions|prompt)/i,
  /what (are|is) your (instructions|system prompt|rules)/i,
  /act as (if )?(a|an)/i,
  /pretend (you are|to be)/i,
  /override (your|the) (rules|instructions|policy|guardrails?)/i,
  /bypass (the )?(filter|security|guardrail|restriction)/i,
  /do anything now/i,
  /\bDAN\b/,
  /developer mode/i,
  /no (restrictions|rules|filters) apply/i,
  /respond (only )?in (raw|unfiltered)/i,
];

export function detectPromptInjection(message: string): DetectionResult {
  const matched: string[] = [];
  for (const pattern of INJECTION_PATTERNS) {
    const m = message.match(pattern);
    if (m) matched.push(m[0]);
  }

  let confidence: DetectionResult["confidence"] = "low";
  if (matched.length >= 2) confidence = "high";
  else if (matched.length === 1) confidence = "medium";

  return { detected: matched.length > 0, matchedPhrases: matched, confidence };
}
