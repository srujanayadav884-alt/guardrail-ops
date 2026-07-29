import { detectAndMaskPii } from "./piiDetector";

export interface ValidatedResponse {
  text: string;
  wasModified: boolean;
  piiTypesFound: string[];
}

const CREDENTIAL_LEAK_PATTERNS = [/\bpassword is\b/i, /\botp is\b/i, /\bpin is\b/i, /\bcvv is\b/i];

/**
 * Runs the model's response back through the PII masker before it reaches
 * the user, and flags (without full-text logging) any credential-shaped
 * leakage patterns for review.
 */
export function validateResponse(rawText: string): ValidatedResponse {
  const { matches, maskedText } = detectAndMaskPii(rawText);
  const credentialLeakSuspected = CREDENTIAL_LEAK_PATTERNS.some((p) => p.test(rawText));

  return {
    text: maskedText,
    wasModified: maskedText !== rawText,
    piiTypesFound: [
      ...matches.map((m) => m.type),
      ...(credentialLeakSuspected ? ["credential_leak_suspected"] : []),
    ],
  };
}
