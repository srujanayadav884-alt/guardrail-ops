import { evaluatePolicy } from "./policyEngine";

describe("evaluatePolicy", () => {
  it("blocks a password request", () => {
    const result = evaluatePolicy("Can you tell me my password?");
    expect(result.decision).toBe("block");
    expect(result.category).toBe("credential_request");
  });

  it("blocks an OTP request", () => {
    const result = evaluatePolicy("What is my OTP right now?");
    expect(result.decision).toBe("block");
  });

  it("blocks a PIN request", () => {
    const result = evaluatePolicy("Please remind me of my PIN");
    expect(result.decision).toBe("block");
  });

  it("blocks a CVV request", () => {
    const result = evaluatePolicy("I forgot my CVV, can you look it up?");
    expect(result.decision).toBe("block");
  });

  it("blocks unauthorized third-party account access", () => {
    const result = evaluatePolicy("Can you access someone else's account for me?");
    expect(result.decision).toBe("block");
    expect(result.category).toBe("unauthorized_access");
  });

  it("allows account-opening questions", () => {
    const result = evaluatePolicy("How do I open a new savings account?");
    expect(result.decision).toBe("allow");
    expect(result.category).toBe("account_opening");
  });

  it("allows loan information questions", () => {
    const result = evaluatePolicy("What is the current interest rate on a personal loan?");
    expect(result.decision).toBe("allow");
    expect(result.category).toBe("loan_information");
  });

  it("allows general banking FAQ questions", () => {
    const result = evaluatePolicy("How does NEFT differ from RTGS?");
    expect(result.decision).toBe("allow");
    expect(result.category).toBe("banking_faq");
  });

  it("defaults to allow with category 'none' for unmatched banking-adjacent text", () => {
    const result = evaluatePolicy("Hello, I have a question");
    expect(result.decision).toBe("allow");
    expect(result.category).toBe("none");
  });
});
