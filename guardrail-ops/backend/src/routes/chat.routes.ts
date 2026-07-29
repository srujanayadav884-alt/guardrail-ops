import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { sendMessage, streamMessage, getHistory } from "../controllers/chat.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { validateBody } from "../middleware/validate";
import { sendMessageSchema } from "../validation/schemas";

const router = Router();

router.post("/", requireAuth, validateBody(sendMessageSchema), asyncHandler(sendMessage));
router.post("/stream", requireAuth, validateBody(sendMessageSchema), asyncHandler(streamMessage));
router.get("/history", requireAuth, asyncHandler(getHistory));

export default router;
