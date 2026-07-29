import request from "supertest";

jest.mock("../config/db", () => ({
  pool: { query: jest.fn(), on: jest.fn(), end: jest.fn() },
  testConnection: jest.fn(),
}));

jest.mock("../services/aiGateway", () => ({
  generateBankingReply: jest.fn().mockResolvedValue("You can open a fixed deposit online or at any branch."),
  streamBankingReply: jest.fn(),
}));

import { pool } from "../config/db";
import { createApp } from "../app";
import { signToken } from "../utils/jwt";

const app = createApp();
const mockedQuery = pool.query as jest.Mock;

function authHeader() {
  const token = signToken({ userId: 99, email: "demo@guardbank.com", role: "customer" });
  return `Bearer ${token}`;
}

describe("POST /api/chat — GuardRail-Ops security pipeline integration", () => {
  it("rejects requests with no auth token", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send({ message: "How do I open an account?", sessionId: "11111111-1111-1111-1111-111111111111" });
    expect(res.status).toBe(401);
  });

  it("rejects an invalid request body (missing sessionId)", async () => {
    const res = await request(app)
      .post("/api/chat")
      .set("Authorization", authHeader())
      .send({ message: "How do I open an account?" });
    expect(res.status).toBe(400);
  });

  it("blocks a password request via the Policy Engine before ever calling Gemini", async () => {
    mockedQuery
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // insert user chat_history
      .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // risk_scores insert
      .mockResolvedValueOnce({ rows: [{ id: 3 }] }) // security_logs insert
      .mockResolvedValueOnce({ rows: [] }) // alerts insert (high/critical band expected)
      .mockResolvedValueOnce({ rows: [] }); // assistant reply insert

    const res = await request(app)
      .post("/api/chat")
      .set("Authorization", authHeader())
      .send({ message: "What is my password?", sessionId: "11111111-1111-1111-1111-111111111111" });

    expect(res.status).toBe(200);
    expect(res.body.blocked).toBe(true);
    expect(res.body.reply).toMatch(/password/i);

    const { generateBankingReply } = require("../services/aiGateway");
    expect(generateBankingReply).not.toHaveBeenCalled();
  });

  it("refuses an off-topic (non-banking) message via the topic gate", async () => {
    mockedQuery
      .mockResolvedValueOnce({ rows: [{ id: 4 }] }) // insert user chat_history
      .mockResolvedValueOnce({ rows: [{ id: 5 }] }) // risk_scores insert
      .mockResolvedValueOnce({ rows: [{ id: 6 }] }) // security_logs insert
      .mockResolvedValueOnce({ rows: [] }); // assistant reply insert

    const res = await request(app)
      .post("/api/chat")
      .set("Authorization", authHeader())
      .send({ message: "What is the capital of France?", sessionId: "22222222-2222-2222-2222-222222222222" });

    expect(res.status).toBe(200);
    expect(res.body.blocked).toBe(true);
    expect(res.body.reply).toMatch(/GuardBank AI Assistant/);
  });

  it("allows a legitimate banking question through to Gemini", async () => {
    mockedQuery
      .mockResolvedValueOnce({ rows: [{ id: 7 }] }) // insert user chat_history
      .mockResolvedValueOnce({ rows: [{ id: 8 }] }) // risk_scores insert
      .mockResolvedValueOnce({ rows: [{ id: 9 }] }) // security_logs insert
      .mockResolvedValueOnce({ rows: [] }) // loadContext select
      .mockResolvedValueOnce({ rows: [] }); // assistant reply insert

    const res = await request(app)
      .post("/api/chat")
      .set("Authorization", authHeader())
      .send({ message: "How do I open a fixed deposit account?", sessionId: "33333333-3333-3333-3333-333333333333" });

    expect(res.status).toBe(200);
    expect(res.body.blocked).toBe(false);
    expect(res.body.reply).toMatch(/fixed deposit/i);
  });
});
