import request from "supertest";

jest.mock("../config/db", () => ({
  pool: { query: jest.fn(), on: jest.fn(), end: jest.fn() },
  testConnection: jest.fn(),
}));

import { pool } from "../config/db";
import { createApp } from "../app";
import { signToken } from "../utils/jwt";

const app = createApp();
const mockedQuery = pool.query as jest.Mock;

describe("Admin route RBAC", () => {
  it("rejects an unauthenticated request to the security events page", async () => {
    const res = await request(app).get("/api/admin/security-events");
    expect(res.status).toBe(401);
  });

  it("rejects a customer trying to access the admin security dashboard", async () => {
    const token = signToken({ userId: 1, email: "demo@guardbank.com", role: "customer" });
    const res = await request(app)
      .get("/api/admin/security-events")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("allows an admin to access the security events list", async () => {
    mockedQuery
      .mockResolvedValueOnce({ rows: [{ total: 0 }] }) // count query
      .mockResolvedValueOnce({ rows: [] }); // data query

    const token = signToken({ userId: 2, email: "admin@guardbank.com", role: "admin" });
    const res = await request(app)
      .get("/api/admin/security-events")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.events).toEqual([]);
    expect(res.body.pagination.total).toBe(0);
  });

  it("allows a security_admin to access the security events list", async () => {
    mockedQuery
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })
      .mockResolvedValueOnce({ rows: [] });

    const token = signToken({ userId: 3, email: "security@guardbank.com", role: "security_admin" });
    const res = await request(app)
      .get("/api/admin/security-events")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("rejects invalid query parameters with a 400", async () => {
    const token = signToken({ userId: 2, email: "admin@guardbank.com", role: "admin" });
    const res = await request(app)
      .get("/api/admin/security-events?riskLevel=not-a-real-level")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});
