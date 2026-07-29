import { computeRiskScore } from "./riskScorer";
import { DetectionResult } from "./promptInjectionDetector";
import { PolicyDecision } from "./policyEngine";

const noDetection: DetectionResult = { detected: false, matchedPhrases: [], confidence: "low" };

describe("computeRiskScore", () => {
  it("returns a low band when nothing is flagged", () => {
    const result = computeRiskScore({
      injection: noDetection,
      jailbreak: noDetection,
      piiMatches: [],
      policy: { decision: "allow", category: "none", reason: "no match" } as PolicyDecision,
    });
    expect(result.band).toBe("low");
    expect(result.score).toBe(0);
  });

  it("returns a critical band when the policy engine blocks", () => {
    const result = computeRiskScore({
      injection: noDetection,
      jailbreak: noDetection,
      piiMatches: [],
      policy: { decision: "block", category: "credential_request", reason: "password request" },
    });
    expect(result.score).toBeGreaterThanOrEqual(40);
    expect(["high", "critical"]).toContain(result.band);
  });

  it("escalates the band when injection, jailbreak, and PII all stack together", () => {
    const result = computeRiskScore({
      injection: { detected: true, matchedPhrases: ["ignore all previous instructions"], confidence: "high" },
      jailbreak: { detected: true, matchedPhrases: ["hypothetically"], confidence: "high" },
      piiMatches: [
        { type: "pan", raw: "ABCDE1234F", masked: "ABXXXXXF", index: 0 },
        { type: "email", raw: "a@b.com", masked: "a***@b.com", index: 10 },
      ],
      policy: { decision: "allow", category: "none", reason: "no match" },
    });
    expect(result.band).toBe("critical");
    expect(result.score).toBe(100);
  });

  it("caps the score at 100", () => {
    const result = computeRiskScore({
      injection: { detected: true, matchedPhrases: ["a", "b", "c"], confidence: "high" },
      jailbreak: { detected: true, matchedPhrases: ["d", "e"], confidence: "high" },
      piiMatches: new Array(10).fill({ type: "email", raw: "a@b.com", masked: "***", index: 0 }),
      policy: { decision: "block", category: "credential_request", reason: "blocked" },
    });
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
