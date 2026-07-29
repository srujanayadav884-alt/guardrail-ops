import { detectAndMaskPii } from "./piiDetector";

describe("detectAndMaskPii", () => {
  it("detects and masks a PAN number", () => {
    const { matches, maskedText } = detectAndMaskPii("My PAN is ABCDE1234F, please verify it");
    expect(matches.some((m) => m.type === "pan")).toBe(true);
    expect(maskedText).not.toContain("ABCDE1234F");
    expect(maskedText).toContain("AB");
  });

  it("detects and masks an Aadhaar number", () => {
    const { matches, maskedText } = detectAndMaskPii("My Aadhaar number is 1234 5678 9012");
    expect(matches.some((m) => m.type === "aadhaar")).toBe(true);
    expect(maskedText).not.toContain("1234 5678 9012");
    expect(maskedText).toContain("9012");
  });

  it("detects and masks a GuardBank account number", () => {
    const { matches, maskedText } = detectAndMaskPii("Please check balance for GB0001000123");
    expect(matches.some((m) => m.type === "account_number")).toBe(true);
    expect(maskedText).not.toContain("GB0001000123");
  });

  it("detects and masks an email address", () => {
    const { matches, maskedText } = detectAndMaskPii("Send the statement to jane.doe@example.com");
    expect(matches.some((m) => m.type === "email")).toBe(true);
    expect(maskedText).toContain("@example.com");
    expect(maskedText).not.toContain("jane.doe@example.com");
  });

  it("detects and masks an Indian phone number", () => {
    const { matches, maskedText } = detectAndMaskPii("Call me on 9876543210 about my loan");
    expect(matches.some((m) => m.type === "phone")).toBe(true);
    expect(maskedText).not.toContain("9876543210");
    expect(maskedText).toContain("3210");
  });

  it("returns no matches and unchanged text for a message with no PII", () => {
    const { matches, maskedText } = detectAndMaskPii("How do I open a fixed deposit account?");
    expect(matches).toHaveLength(0);
    expect(maskedText).toBe("How do I open a fixed deposit account?");
  });

  it("masks multiple PII types in the same message", () => {
    const { matches, maskedText } = detectAndMaskPii(
      "My email is jane@example.com and my phone is 9876543210"
    );
    expect(matches.length).toBeGreaterThanOrEqual(2);
    expect(maskedText).not.toContain("jane@example.com");
    expect(maskedText).not.toContain("9876543210");
  });
});
