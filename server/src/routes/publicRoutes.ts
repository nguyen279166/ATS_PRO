import { Router } from "express";
import { cvUpload } from "../utils/cvStorage";
import { validateBody } from "../middleware/validate";
import {
  publicApplyRateLimiter,
  publicJobsRateLimiter,
} from "../middleware/rateLimit";
import { publicApplySchema } from "../validation/schemas";
import {
  applyForPublicJob,
  getPublicJobs,
} from "../modules/public/public.controller";

const router = Router();

router.get("/jobs", publicJobsRateLimiter, getPublicJobs);
router.post(
  "/apply",
  publicApplyRateLimiter,
  cvUpload.single("cv"),
  validateBody(publicApplySchema),
  applyForPublicJob,
);

export default router;
