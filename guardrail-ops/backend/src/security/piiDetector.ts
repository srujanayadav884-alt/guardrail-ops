/**
 * Regex patterns for Indian-banking-context PII, plus masking helpers.
 * These are foundation-level heuristics (regex based), not a full NLP PII
 * detector — false positives/negatives are expected and should be tuned
 * over time with real traffic samples.
 */

export interface PiiMatch {
  type: PiiType;
  raw: string;
  masked: string;
  index: number;
}

export type PiiType =
  | "account_number"
  | "pan"
  | "aadhaar"
  | "phone"
  | "email"
  | "card_number";

// Order matters: more specific patterns first so a PAN isn't mis-caught by
// a looser alphanumeric account-number pattern, etc.
const PATTERNS: { type: PiiType; regex: RegExp }[] = [
  // PAN: 5 letters, 4 digits, 1 letter (India)
  { type: "pan", regex: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g },
  // Aadhaar: 12 digits, optionally grouped in 4s with spaces/hyphens
  { type: "aadhaar", regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g },
  // Card number: 13-19 digits, optionally grouped in 4s
  { type: "card_number", regex: /\b(?:\d[ -]?){13,19}\b/g },
  // GuardBank account numbers, e.g. GB0001000123
  { type: "account_number", regex: /\bGB\d{10}\b/g },
  // Email
  { type: "email", regex: /\b[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}\b/g },
  // Indian phone numbers: optional +91, then 10 digits starting 6-9
  { type: "phone", regex: /\b(?:\+?91[\s-]?)?[6-9]\d{9}\b/g },
];

function maskValue(type: PiiType, raw: string): string {
  const digitsOnly = raw.replace(/\D/g, "");
  switch (type) {
    case "pan":
      return `${raw.slice(0, 2)}XXXXX${raw.slice(-1)}`;
    case "aadhaar":
      return `XXXX-XXXX-${digitsOnly.slice(-4)}`;
    case "card_number":
      return `${"X".repeat(Math.max(digitsOnly.length - 4, 0))}${digitsOnly.slice(-4)}`;
    case "account_number":
      return `${raw.slice(0, 2)}${"X".repeat(Math.max(raw.length - 6, 0))}${raw.slice(-4)}`;
    case "email": {
      const [user, domain] = raw.split("@");
      const visible = user.slice(0, Math.min(2, user.length));
      return `${visible}${"*".repeat(Math.max(user.length - visible.length, 1))}@${domain}`;
    }
    case "phone":
      return `${"X".repeat(Math.max(digitsOnly.length - 4, 0))}${digitsOnly.slice(-4)}`;
    default:
      return "[REDACTED]";
  }
}

/** Scan text for known PII types. Returns matches + the fully masked text. */
export function detectAndMaskPii(text: string): { matches: PiiMatch[]; maskedText: string } {
  const matches: PiiMatch[] = [];
  let maskedText = text;

  for (const { type, regex } of PATTERNS) {
    // Reset lastIndex since regexes are reused with the global flag
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const raw = match[0];
      // card_number is greedy — skip if it's actually inside an already-tagged
      // aadhaar/account match to reduce double-counting overlaps
      const alreadyCovered = matches.some(
        (m) => raw.includes(m.raw) || m.raw.includes(raw)
      );
      if (alreadyCovered) continue;

      matches.push({ type, raw, masked: maskValue(type, raw), index: match.index });
    }
  }

  // Apply masks longest-match-first so shorter overlapping matches don't
  // corrupt already-replaced text
  const sorted = [...matches].sort((a, b) => b.raw.length - a.raw.length);
  for (const m of sorted) {
    maskedText = maskedText.split(m.raw).join(m.masked);
  }

  return { matches, maskedText };
}
