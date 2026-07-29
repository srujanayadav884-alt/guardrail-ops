import { Router } from "express";
import { register, login, adminLogin } from "../controllers/auth.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { validateBody } from "../middleware/validate";
import { registerSchema, loginSchema, adminLoginSchema } from "../validation/schemas";

const router = Router();

router.post("/register", validateBody(registerSchema), asyncHandler(register));
router.post("/login", validateBody(loginSchema), asyncHandler(login));
router.post("/admin-login", validateBody(adminLoginSchema), asyncHandler(adminLogin));

export default router;
