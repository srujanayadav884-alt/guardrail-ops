import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { listTransactions } from "../controllers/transaction.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/", requireAuth, asyncHandler(listTransactions));

export default router;
