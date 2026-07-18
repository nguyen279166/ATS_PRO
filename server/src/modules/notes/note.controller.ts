import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../../routes/authMiddleware";
import {
  createNote,
  deleteNote,
  listCandidateNotes,
  NoteForbiddenError,
  NoteNotFoundError,
  updateNote,
} from "./note.service";

const sendOwnershipError = (
  error: unknown,
  res: Response,
  action: "sửa" | "xóa",
) => {
  if (error instanceof NoteNotFoundError) {
    res.status(404).json({ error: "Không tìm thấy ghi chú" });
    return true;
  }
  if (error instanceof NoteForbiddenError) {
    res.status(403).json({ error: `Bạn không có quyền ${action} ghi chú này` });
    return true;
  }
  return false;
};

export const getNotes = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(await listCandidateNotes(String(req.params.candidateId)));
  } catch (error) {
    next(error);
  }
};

export const postNote = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { candidateId, content } = req.body ?? {};
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Không xác định được người dùng" });
    }
    if (typeof candidateId !== "string" || !candidateId.trim()) {
      return res.status(400).json({ error: "Ứng viên không hợp lệ" });
    }
    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ error: "Nội dung ghi chú không được trống" });
    }

    res.status(201).json(await createNote(candidateId, content, userId));
  } catch (error) {
    next(error);
  }
};

export const putNote = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const content = req.body?.content;
  if (typeof content !== "string" || !content.trim()) {
    return res.status(400).json({ error: "Nội dung ghi chú không được trống" });
  }

  try {
    res.json(
      await updateNote(
        String(req.params.id),
        content,
        req.user?.userId as string,
      ),
    );
  } catch (error) {
    if (!sendOwnershipError(error, res, "sửa")) {
      next(error);
    }
  }
};

export const removeNote = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    await deleteNote(String(req.params.id), req.user?.userId as string);
    res.json({ message: "Xóa ghi chú thành công" });
  } catch (error) {
    if (!sendOwnershipError(error, res, "xóa")) {
      next(error);
    }
  }
};
