import type { Request, Response } from "express";
import {
  createPublicApplication,
  indexPublicApplicationCv,
  listPublicJobs,
} from "./public.service";

export const getPublicJobs = async (_req: Request, res: Response) => {
  try {
    res.json(await listPublicJobs());
  } catch (error) {
    console.error("Lỗi khi lấy danh sách job public:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};

export const applyForPublicJob = async (req: Request, res: Response) => {
  try {
    const { jobId, name, email } = req.body;

    if (!jobId || !name || !email) {
      return res.status(400).json({ error: "Vui lòng điền đầy đủ thông tin" });
    }

    const candidate = await createPublicApplication({
      jobId,
      name,
      email,
      file: req.file,
    });

    if (!candidate) {
      return res
        .status(400)
        .json({ error: "Công việc này không còn nhận ứng viên" });
    }

    res.status(201).json({ message: "Ứng tuyển thành công!", candidate });
    if (req.file) {
      indexPublicApplicationCv(candidate.id, req.file).catch((error) => {
        console.error("Loi khi index CV public apply:", error);
      });
    }
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Lỗi server khi nộp đơn";
    console.error("Lỗi khi ứng tuyển:", error);
    res.status(500).json({ error: msg });
  }
};
