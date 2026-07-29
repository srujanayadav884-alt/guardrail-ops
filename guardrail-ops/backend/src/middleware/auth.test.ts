import { requireAuth, requireRole, AuthRequest } from "./auth";
import { signToken } from "../utils/jwt";
import { Response } from "express";

function mockRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

describe("requireAuth", () => {
  it("rejects a request with no Authorization header", () => {
    const req = { headers: {} } as AuthRequest;
    const res = mockRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a malformed Authorization header", () => {
    const req = { headers: { authorization: "Basic abc123" } } as AuthRequest;
    const res = mockRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("rejects an invalid token", () => {
    const req = { headers: { authorization: "Bearer not-a-real-token" } } as AuthRequest;
    const res = mockRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("attaches decoded user and calls next() for a valid token", () => {
    const token = signToken({ userId: 42, email: "demo@guardbank.com", role: "customer" });
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest;
    const res = mockRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user?.userId).toBe(42);
    expect(req.user?.role).toBe("customer");
  });
});

describe("requireRole", () => {
  it("rejects when req.user is missing", () => {
    const req = {} as AuthRequest;
    const res = mockRes();
    const next = jest.fn();

    requireRole("admin")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("rejects a role that isn't in the allowed list", () => {
    const req = { user: { userId: 1, email: "x@y.com", role: "customer" } } as AuthRequest;
    const res = mockRes();
    const next = jest.fn();

    requireRole("admin", "security_admin")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("allows a role that is in the allowed list", () => {
    const req = { user: { userId: 1, email: "x@y.com", role: "security_admin" } } as AuthRequest;
    const res = mockRes();
    const next = jest.fn();

    requireRole("admin", "security_admin")(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
