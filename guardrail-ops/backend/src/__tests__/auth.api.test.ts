import request from "supertest";
import bcrypt from "bcrypt";

jest.mock("../config/db", () => ({
  pool: { query: jest.fn(), on: jest.fn(), end: jest.fn() },
  testConnection: jest.fn(),
}));

import { pool } from "../config/db";
import { createApp } from "../app";

const app = createApp();
const mockedQuery = pool.query as jest.Mock;

describe("POST /api/auth/register", () => {
  it("rejects a request with a weak password (validation middleware)", async () => {
    const res = await request(app).post("/api/auth/register").send({
      fullName: "Jane Doe",
      email: "jane@example.com",
      password: "weak",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
  });

  it("rejects a request with an invalid email", async () => {
    const res = await request(app).post("/api/auth/register").send({
      fullName: "Jane Doe",
      email: "not-an-email",
      password: "StrongPass1",
    });

    expect(res.status).toBe(400);
  });

  it("registers a new customer successfully", async () => {
    mockedQuery
      .mockResolvedValueOnce({ rows: [] }) // no existing user with that email
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // customer role id
      .mockResolvedValueOnce({
        rows: [{ id: 10, full_name: "Jane Doe", email: "jane@example.com", role_id: 1, created_at: new Date() }],
      });

    const res = await request(app).post("/api/auth/register").send({
      fullName: "Jane Doe",
      email: "jane@example.com",
      password: "StrongPass1",
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe("jane@example.com");
    expect(res.body.user.role).toBe("customer");
  });

  it("rejects registration for a duplicate email with 409", async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [{ id: 5 }] }); // existing user found

    const res = await request(app).post("/api/auth/register").send({
      fullName: "Jane Doe",
      email: "jane@example.com",
      password: "StrongPass1",
    });

    expect(res.status).toBe(409);
  });
});

describe("POST /api/auth/login", () => {
  it("logs in successfully with correct credentials", async () => {
    const passwordHash = await bcrypt.hash("CorrectPass1", 10);

    mockedQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: 7,
            full_name: "Demo Customer",
            email: "demo@guardbank.com",
            password_hash: passwordHash,
            is_active: true,
            role: "customer",
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] }); // UPDATE last_login_at

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "demo@guardbank.com", password: "CorrectPass1" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe("customer");
  });

  it("returns a generic error for a nonexistent email (no user enumeration)", async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [] }); // no user found
    mockedQuery.mockResolvedValueOnce({ rows: [] }); // security log insert

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@guardbank.com", password: "whatever123" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid email or password");
  });

  it("returns the SAME generic error for a wrong password as for a nonexistent email", async () => {
    const passwordHash = await bcrypt.hash("CorrectPass1", 10);
    mockedQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: 7,
            full_name: "Demo Customer",
            email: "demo@guardbank.com",
            password_hash: passwordHash,
            is_active: true,
            role: "customer",
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] }); // security log insert on failure

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "demo@guardbank.com", password: "WrongPassword1" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid email or password");
  });

  it("rejects a customer login attempt against an admin account", async () => {
    const passwordHash = await bcrypt.hash("AdminPass1", 10);
    mockedQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            full_name: "GuardBank Admin",
            email: "admin@guardbank.com",
            password_hash: passwordHash,
            is_active: true,
            role: "admin",
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] }); // security log insert

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@guardbank.com", password: "AdminPass1" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid email or password");
  });
});

describe("GET /api/health", () => {
  it("reports ok when the DB responds", async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [{ "?column?": 1 }] });
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
