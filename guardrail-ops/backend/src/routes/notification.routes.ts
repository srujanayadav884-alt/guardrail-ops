import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { listNotifications, markRead } from "../controllers/notification.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/", requireAuth, asyncHandler(listNotifications));
router.patch("/:id/read", requireAuth, asyncHandler(markRead));

export default router;
