import { Router } from "express";
import { validateBody, validateParams } from "../middleware/validate";
import {
  candidateIdParamsSchema,
  createInterviewSchema,
  idParamsSchema,
  updateInterviewSchema,
} from "../validation/schemas";
import {
  getInterviews,
  postInterview,
  putInterview,
  removeInterview,
} from "../modules/interviews/interview.controller";

const router = Router();

router.get(
  "/:candidateId",
  validateParams(candidateIdParamsSchema),
  getInterviews,
);
router.post("/", validateBody(createInterviewSchema), postInterview);
router.put(
  "/:id",
  validateParams(idParamsSchema),
  validateBody(updateInterviewSchema),
  putInterview,
);
router.delete("/:id", validateParams(idParamsSchema), removeInterview);

export default router;
