import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../../middleware/errorHandler";
import { getValidatedRequest } from "../../middleware/validate";
import {
  candidateService,
  type BulkCandidateInput,
  type CandidateListQuery,
  type CandidateService,
  type CreateCandidateInput,
} from "./candidate.service";

export const createCandidateController = (service: CandidateService) => ({
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(
        await service.listCandidates(
          getValidatedRequest<CandidateListQuery>(res, "query") ?? req.query,
        ),
      );
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const candidate = await service.createCandidate(
        req.body as CreateCandidateInput,
      );
      res.status(201).json(candidate);
    } catch (error) {
      next(error);
    }
  },

  updateStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const { status } = req.body as { status: string };
      res.json(await service.updateCandidateStatus(id, status));
    } catch (error) {
      next(error);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const deleted = await service.deleteCandidate(id);
      if (!deleted) {
        res
          .status(404)
          .json({ error: "Không tìm thấy ứng viên" });
        return;
      }

      res.json({ message: "Xóa ứng viên thành công" });
    } catch (error) {
      next(error);
    }
  },

  bulk: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await service.bulkCandidates(
        req.body as BulkCandidateInput,
      );
      if (result.kind === "invalid") {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json(result.body);
    } catch (error) {
      next(error);
    }
  },

  uploadCv: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      if (!req.file) {
        res.status(400).json({ error: "Không có file được upload" });
        return;
      }

      const candidate = await service.uploadCandidateCv(id, req.file);
      if (!candidate) {
        res.status(404).json({ error: "Không tìm thấy ứng viên" });
        return;
      }

      res.json(candidate);
    } catch (error: unknown) {
      next(error);
    }
  },

  reindexCv: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const candidate = await service.reindexCandidateCv(
        String(req.params.id),
      );
      if (!candidate) {
        res.status(404).json({ error: "Ứng viên chưa có CV" });
        return;
      }

      res.json(candidate);
    } catch (error: unknown) {
      next(error);
    }
  },

  deleteCv: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const candidate = await service.deleteCandidateCv(String(req.params.id));
      if (!candidate) {
        res.status(404).json({ error: "Không có CV" });
        return;
      }

      res.json(candidate);
    } catch (error) {
      next(error);
    }
  },

  askCv: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const result = await service.askCandidateCv(id, req.body.question);
      if (!result.found) {
        res.status(404).json({ error: "Không tìm thấy ứng viên" });
        return;
      }

      res.json(result.result);
    } catch (error: unknown) {
      const message = service.formatRagError(error);
      if (message) {
        next(new ApiError(503, message));
        return;
      }

      next(error);
    }
  },
});

const candidateController = createCandidateController(candidateService);

export default candidateController;
