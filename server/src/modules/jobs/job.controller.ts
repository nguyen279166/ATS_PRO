import type { Response } from "express";
import type { AuthRequest } from "../../routes/authMiddleware";
import {
  createJob,
  deleteJob,
  listJobs,
  updateJob,
  type JobInput,
} from "./job.service";

const getJobInput = (body: AuthRequest["body"]): JobInput => ({
  title: body.title,
  department: body.department,
  location: body.location,
  description: body.description,
});

export const getJobs = async (_req: AuthRequest, res: Response) => {
  try {
    res.json(await listJobs());
  } catch {
    res.status(500).json({ error: "Lỗi server khi lấy danh sách Job" });
  }
};

export const postJob = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Không xác định được người dùng" });
      return;
    }

    res.status(201).json(await createJob(getJobInput(req.body), userId));
  } catch (error) {
    console.error("Lỗi khi tạo Job:", error);
    res.status(500).json({ error: "Lỗi server khi tạo Job" });
  }
};

export const putJob = async (req: AuthRequest, res: Response) => {
  try {
    res.json(await updateJob(String(req.params.id), getJobInput(req.body)));
  } catch (error) {
    console.error("Lỗi khi cập nhật Job:", error);
    res.status(500).json({ error: "Lỗi server khi cập nhật Job" });
  }
};

export const removeJob = async (req: AuthRequest, res: Response) => {
  try {
    await deleteJob(String(req.params.id));
    res.json({ message: "Xóa Job thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa Job:", error);
    res.status(500).json({ error: "Lỗi server khi xóa Job" });
  }
};
