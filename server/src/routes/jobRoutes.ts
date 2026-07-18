import { Router } from "express";
import { requireAdmin } from "./authMiddleware";
import { validateBody, validateParams } from "../middleware/validate";
import { idParamsSchema, jobBodySchema } from "../validation/schemas";
import {
  getJobs,
  postJob,
  putJob,
  removeJob,
} from "../modules/jobs/job.controller";

const router = Router();

router.get("/", getJobs);
router.post("/", validateBody(jobBodySchema), postJob);
router.put(
  "/:id",
  validateParams(idParamsSchema),
  validateBody(jobBodySchema),
  putJob,
);
router.delete(
  "/:id",
  requireAdmin,
  validateParams(idParamsSchema),
  removeJob,
);

export default router;
