import { Router } from "express";
import { requireAdmin } from "./authMiddleware";
import { validateBody } from "../middleware/validate";
import { jobBodySchema } from "../validation/schemas";
import {
  getJobs,
  postJob,
  putJob,
  removeJob,
} from "../modules/jobs/job.controller";

const router = Router();

router.get("/", getJobs);
router.post("/", validateBody(jobBodySchema), postJob);
router.put("/:id", validateBody(jobBodySchema), putJob);
router.delete("/:id", requireAdmin, removeJob);

export default router;
