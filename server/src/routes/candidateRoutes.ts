import { Router } from "express";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validate";
import { aiRateLimiter } from "../middleware/rateLimit";
import candidateController from "../modules/candidates/candidate.controller";
import { cvUpload } from "../utils/cvStorage";
import {
  askCandidateCvSchema,
  bulkCandidateSchema,
  candidateBodySchema,
  candidateListQuerySchema,
  idParamsSchema,
  updateCandidateStatusSchema,
} from "../validation/schemas";

const router = Router();

router.get("/", validateQuery(candidateListQuerySchema), candidateController.list);
router.post(
  "/",
  validateBody(candidateBodySchema),
  candidateController.create,
);
router.put(
  "/:id",
  validateParams(idParamsSchema),
  validateBody(updateCandidateStatusSchema),
  candidateController.updateStatus,
);
router.delete("/:id", validateParams(idParamsSchema), candidateController.delete);
router.patch(
  "/bulk",
  validateBody(bulkCandidateSchema),
  candidateController.bulk,
);
router.post(
  "/:id/cv",
  validateParams(idParamsSchema),
  aiRateLimiter,
  cvUpload.single("cv"),
  candidateController.uploadCv,
);
router.post(
  "/:id/cv/reindex",
  validateParams(idParamsSchema),
  aiRateLimiter,
  candidateController.reindexCv,
);
router.delete(
  "/:id/cv",
  validateParams(idParamsSchema),
  candidateController.deleteCv,
);
router.post(
  "/:id/ask",
  validateParams(idParamsSchema),
  aiRateLimiter,
  validateBody(askCandidateCvSchema),
  candidateController.askCv,
);

export default router;
