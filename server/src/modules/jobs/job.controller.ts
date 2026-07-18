import type { NextFunction, Response } from "express";
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

export const getJobs = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(await listJobs());
  } catch (error) {
    next(error);
  }
};

export const postJob = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Không xác định được người dùng" });
      return;
    }

    res.status(201).json(await createJob(getJobInput(req.body), userId));
  } catch (error) {
    next(error);
  }
};

export const putJob = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(await updateJob(String(req.params.id), getJobInput(req.body)));
  } catch (error) {
    next(error);
  }
};

export const removeJob = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    await deleteJob(String(req.params.id));
    res.json({ message: "Xóa Job thành công" });
  } catch (error) {
    next(error);
  }
};
