import { Router } from "express";
import {
  getInterviews,
  postInterview,
  putInterview,
  removeInterview,
} from "../modules/interviews/interview.controller";

const router = Router();

router.get("/:candidateId", getInterviews);
router.post("/", postInterview);
router.put("/:id", putInterview);
router.delete("/:id", removeInterview);

export default router;
