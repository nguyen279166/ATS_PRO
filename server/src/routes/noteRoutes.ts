import { Router } from "express";
import { validateBody, validateParams } from "../middleware/validate";
import {
  candidateIdParamsSchema,
  createNoteSchema,
  idParamsSchema,
  updateNoteSchema,
} from "../validation/schemas";
import {
  getNotes,
  postNote,
  putNote,
  removeNote,
} from "../modules/notes/note.controller";

const router = Router();

router.get(
  "/:candidateId",
  validateParams(candidateIdParamsSchema),
  getNotes,
);
router.post("/", validateBody(createNoteSchema), postNote);
router.put(
  "/:id",
  validateParams(idParamsSchema),
  validateBody(updateNoteSchema),
  putNote,
);
router.delete("/:id", validateParams(idParamsSchema), removeNote);

export default router;
