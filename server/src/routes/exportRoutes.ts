import { Router } from "express";
import {
  exportCandidatesExcel,
  exportRecruitmentPdf,
} from "../modules/reports/report.controller";

const router = Router();

router.get("/candidates.xlsx", exportCandidatesExcel);
router.get("/report.pdf", exportRecruitmentPdf);

export default router;
