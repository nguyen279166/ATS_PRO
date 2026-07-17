import { Router } from "express";
import {
  getNotes,
  postNote,
  putNote,
  removeNote,
} from "../modules/notes/note.controller";

const router = Router();

router.get("/:candidateId", getNotes);
router.post("/", postNote);
router.put("/:id", putNote);
router.delete("/:id", removeNote);

export default router;
