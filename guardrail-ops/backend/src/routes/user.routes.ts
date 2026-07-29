import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getProfile, updateProfile } from "../controllers/user.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { validateBody } from "../middleware/validate";
import { updateProfileSchema } from "../validation/schemas";

const router = Router();

router.get("/me", requireAuth, asyncHandler(getProfile));
router.patch("/me", requireAuth, validateBody(updateProfileSchema), asyncHandler(updateProfile));

export default router;
