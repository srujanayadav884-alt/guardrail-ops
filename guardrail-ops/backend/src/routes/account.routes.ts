import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { listAccounts, getAccount } from "../controllers/account.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/", requireAuth, asyncHandler(listAccounts));
router.get("/:id", requireAuth, asyncHandler(getAccount));

export default router;
