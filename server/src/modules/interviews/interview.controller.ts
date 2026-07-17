import type { Response } from "express";
import type { AuthRequest } from "../../routes/authMiddleware";
import {
  createInterview,
  deleteInterview,
  InterviewNotFoundError,
  listCandidateInterviews,
  updateInterview,
} from "./interview.service";

const sendNotFound = (error: unknown, res: Response) => {
  if (!(error instanceof InterviewNotFoundError)) return false;
  res.status(404).json({ error: "Không tìm thấy lịch phỏng vấn" });
  return true;
};

export const getInterviews = async (req: AuthRequest, res: Response) => {
  try {
    res.json(await listCandidateInterviews(String(req.params.candidateId)));
  } catch {
    res.status(500).json({ error: "Lỗi server khi lấy lịch phỏng vấn" });
  }
};

export const postInterview = async (req: AuthRequest, res: Response) => {
  try {
    const { candidateId, scheduledAt, location, notes } = req.body;
    const createdBy = req.user?.userId;
    if (!createdBy) {
      return res.status(401).json({ error: "Không xác định được người dùng" });
    }
    if (!candidateId || !scheduledAt) {
      return res
        .status(400)
        .json({ error: "candidateId và scheduledAt là bắt buộc" });
    }

    res.status(201).json(
      await createInterview(
        { candidateId, scheduledAt, location, notes },
        createdBy,
      ),
    );
  } catch {
    res.status(500).json({ error: "Lỗi server khi tạo lịch phỏng vấn" });
  }
};

export const putInterview = async (req: AuthRequest, res: Response) => {
  try {
    const { scheduledAt, location, notes, status } = req.body;
    res.json(
      await updateInterview(String(req.params.id), {
        scheduledAt,
        location,
        notes,
        status,
      }),
    );
  } catch (error) {
    if (!sendNotFound(error, res)) {
      res.status(500).json({ error: "Lỗi server khi cập nhật lịch phỏng vấn" });
    }
  }
};

export const removeInterview = async (req: AuthRequest, res: Response) => {
  try {
    await deleteInterview(String(req.params.id));
    res.json({ message: "Xóa lịch phỏng vấn thành công" });
  } catch (error) {
    if (!sendNotFound(error, res)) {
      res.status(500).json({ error: "Lỗi server khi xóa lịch phỏng vấn" });
    }
  }
};
