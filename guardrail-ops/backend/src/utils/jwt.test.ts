import { signToken, verifyToken } from "./jwt";
import jwt from "jsonwebtoken";

describe("jwt utils", () => {
  it("signs and verifies a round trip successfully", () => {
    const token = signToken({ userId: 1, email: "demo@guardbank.com", role: "customer" });
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(1);
    expect(decoded.email).toBe("demo@guardbank.com");
    expect(decoded.role).toBe("customer");
  });

  it("rejects a token signed with a different secret", () => {
    const badToken = jwt.sign({ userId: 1, email: "x@y.com", role: "customer" }, "wrong-secret", {
      algorithm: "HS256",
    });
    expect(() => verifyToken(badToken)).toThrow();
  });

  it("rejects a token with the wrong issuer", () => {
    const badToken = jwt.sign(
      { userId: 1, email: "x@y.com", role: "customer" },
      process.env.JWT_SECRET as string,
      { algorithm: "HS256", issuer: "some-other-issuer", audience: process.env.JWT_AUDIENCE }
    );
    expect(() => verifyToken(badToken)).toThrow();
  });

  it("rejects an expired token", () => {
    const expiredToken = jwt.sign(
      { userId: 1, email: "x@y.com", role: "customer" },
      process.env.JWT_SECRET as string,
      {
        algorithm: "HS256",
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE,
        expiresIn: "-1s",
      }
    );
    expect(() => verifyToken(expiredToken)).toThrow();
  });
});
