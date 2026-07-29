import { asyncHandler } from "./asyncHandler";
import { Request, Response } from "express";

describe("asyncHandler", () => {
  it("calls through to the wrapped handler on success", async () => {
    const handler = jest.fn(async (_req: Request, res: Response) => {
      res.json({ ok: true });
    });
    const wrapped = asyncHandler(handler);

    const res = { json: jest.fn() } as unknown as Response;
    const next = jest.fn();

    await wrapped({} as Request, res, next);

    expect(handler).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ ok: true });
    expect(next).not.toHaveBeenCalled();
  });

  it("forwards a rejected promise to next() instead of throwing", async () => {
    const error = new Error("boom");
    const handler = jest.fn(async () => {
      throw error;
    });
    const wrapped = asyncHandler(handler);

    const next = jest.fn();
    await wrapped({} as Request, {} as Response, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
