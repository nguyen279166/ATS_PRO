import { Router } from "express";
import { validateBody } from "../middleware/validate";
import { aiRateLimiter } from "../middleware/rateLimit";
import candidateController from "../modules/candidates/candidate.controller";
import { cvUpload } from "../utils/cvStorage";
import {
  askCandidateCvSchema,
  bulkCandidateSchema,
  candidateBodySchema,
  updateCandidateStatusSchema,
} from "../validation/schemas";

const router = Router();

router.get("/", candidateController.list);
router.post(
  "/",
  validateBody(candidateBodySchema),
  candidateController.create,
);
router.put(
  "/:id",
  validateBody(updateCandidateStatusSchema),
  candidateController.updateStatus,
);
router.delete("/:id", candidateController.delete);
router.patch(
  "/bulk",
  validateBody(bulkCandidateSchema),
  candidateController.bulk,
);
router.post(
  "/:id/cv",
  aiRateLimiter,
  cvUpload.single("cv"),
  candidateController.uploadCv,
);
router.post("/:id/cv/reindex", aiRateLimiter, candidateController.reindexCv);
router.delete("/:id/cv", candidateController.deleteCv);
router.post(
  "/:id/ask",
  aiRateLimiter,
  validateBody(askCandidateCvSchema),
  candidateController.askCv,
);

export default router;
