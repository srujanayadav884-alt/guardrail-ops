/**
 * Policy Engine — evaluates a user message against banking security rules.
 * Foundation-level: keyword/pattern based, not backed by the `policies`
 * table's rule_config yet (that remains admin-manageable metadata for now;
 * wiring rule_config into live evaluation is a follow-up phase).
 */

export type PolicyCategory =
  | "credential_request"
  | "unauthorized_access"
  | "banking_education"
  | "account_opening"
  | "loan_information"
  | "banking_faq"
  | "off_topic"
  | "none";

export interface PolicyDecision {
  decision: "allow" | "block";
  category: PolicyCategory;
  reason: string;
}

// ---- BLOCK rules ----
const BLOCK_RULES: { category: PolicyCategory; regex: RegExp; reason: string }[] = [
  {
    category: "credential_request",
    regex: /\b(my |your |the )?(password|passcode)\b/i,
    reason: "Message references a password — GuardBank never requests or reveals passwords via chat.",
  },
  {
    category: "credential_request",
    regex: /\botp\b|one[- ]time password/i,
    reason: "Message references an OTP — OTPs are never shared or requested via chat.",
  },
  {
    category: "credential_request",
    regex: /\bpin\b/i,
    reason: "Message references a PIN — PINs are never shared or requested via chat.",
  },
  {
    category: "credential_request",
    regex: /\bcvv\b/i,
    reason: "Message references a CVV — CVVs are never shared or requested via chat.",
  },
  {
  category: "unauthorized_access",
  regex: /(check|look up|find out|get)\s+(someone|somebody|another user|another customer)'?s?\s+(account(\s+balance)?|balance|details|transactions?|transaction history)/i,
  reason: "Accessing another user's banking information is not allowed.",
},
  {
  category: "unauthorized_access",
  regex: /(check|look up|find out)\s+(someone|somebody)'?s\s+(balance|account|details|transactions?|transaction history)/i,
  reason: "Message requests private banking information belonging to a third party.",
},
{
  category: "unauthorized_access",
  regex: /another user'?s.*transaction|another customer'?s.*transaction|transaction history.*another user/i,
  reason: "Accessing another user's transaction history is not allowed.",
},
];

// ---- ALLOW rules (banking-relevant topics that should always pass through) ----
const ALLOW_RULES: { category: PolicyCategory; regex: RegExp }[] = [
  { category: "account_opening", regex: /open (a|an|new)?\s*(savings|current)?\s*account/i },
  { category: "loan_information", regex: /\bloan\b|\bemi\b|interest rate/i },
  { category: "banking_faq", regex: /\b(upi|neft|rtgs|imps|fixed deposit|debit card|credit card)\b/i },
  { category: "banking_education", regex: /how does .* work|what is .* (account|loan|deposit|banking)/i },
];

export function evaluatePolicy(message: string): PolicyDecision {
  console.log("Message:", message);

  for (const rule of BLOCK_RULES) {
    console.log("Testing BLOCK:", rule.regex);

    if (rule.regex.test(message)) {
      console.log("Matched BLOCK:", rule.category);

      return {
        decision: "block",
        category: rule.category,
        reason: rule.reason,
      };
    }
  }

  for (const rule of ALLOW_RULES) {
    console.log("Testing ALLOW:", rule.regex);

    if (rule.regex.test(message)) {
      console.log("Matched ALLOW:", rule.category);

      return {
        decision: "allow",
        category: rule.category,
        reason: "Matched an approved banking topic.",
      };
    }
  }

  console.log("No policy matched.");

  return {
    decision: "allow",
    category: "none",
    reason: "No policy match — defers to topic gate.",
  };
}