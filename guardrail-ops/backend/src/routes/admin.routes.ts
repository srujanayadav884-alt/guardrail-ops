import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  securityAnalytics,
  riskScores,
  auditLogs,
  blockedRequests,
  listPolicies,
  createPolicy,
  togglePolicy,
  listUsers,
  setUserStatus,
} from "../controllers/admin.controller";
import { listSecurityEvents, getSecurityEventDetail } from "../controllers/securityEvents.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { validateBody, validateQuery } from "../middleware/validate";
import { createPolicySchema, setUserStatusSchema, securityEventsQuerySchema } from "../validation/schemas";

const router = Router();

// Every admin route requires an authenticated admin or security_admin — RBAC enforced here.
router.use(requireAuth, requireRole("admin", "security_admin"));

router.get("/analytics", asyncHandler(securityAnalytics));
router.get("/risk-scores", asyncHandler(riskScores));
router.get("/audit-logs", asyncHandler(auditLogs));
router.get("/blocked-requests", asyncHandler(blockedRequests));

router.get(
  "/security-events",
  validateQuery(securityEventsQuerySchema),
  asyncHandler(listSecurityEvents)
);
router.get("/security-events/:id", asyncHandler(getSecurityEventDetail));

router.get("/policies", asyncHandler(listPolicies));
router.post("/policies", validateBody(createPolicySchema), asyncHandler(createPolicy));
router.patch("/policies/:id/toggle", asyncHandler(togglePolicy));

router.get("/users", asyncHandler(listUsers));
router.patch("/users/:id/status", validateBody(setUserStatusSchema), asyncHandler(setUserStatus));

export default router;
