import type { Request, Response } from "express";
import {
  candidateService,
  type BulkCandidateInput,
  type CandidateService,
  type CreateCandidateInput,
} from "./candidate.service";

export const createCandidateController = (service: CandidateService) => ({
  list: async (req: Request, res: Response) => {
    try {
      res.json(await service.listCandidates(req.query));
    } catch {
      res
        .status(500)
        .json({ error: "Lỗi server khi lấy danh sách ứng viên" });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const candidate = await service.createCandidate(
        req.body as CreateCandidateInput,
      );
      res.status(201).json(candidate);
    } catch {
      res.status(500).json({ error: "Lỗi server khi tạo ứng viên" });
    }
  },

  updateStatus: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const { status } = req.body as { status: string };
      res.json(await service.updateCandidateStatus(id, status));
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái ứng viên:", error);
      res.status(500).json({ error: "Lỗi server khi cập nhật ứng viên" });
    }
  },

  delete: async (req: Request, res: Response) => {
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
      console.error("Lỗi khi xóa ứng viên:", error);
      res.status(500).json({ error: "Lỗi server khi xóa ứng viên" });
    }
  },

  bulk: async (req: Request, res: Response) => {
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
      console.error("Lỗi bulk action:", error);
      res.status(500).json({ error: "Lỗi server khi thực hiện bulk action" });
    }
  },

  uploadCv: async (req: Request, res: Response) => {
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
      const message = error instanceof Error ? error.message : "Lỗi server";
      res.status(500).json({ error: message });
    }
  },

  reindexCv: async (req: Request, res: Response) => {
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
      const message = error instanceof Error ? error.message : "Lỗi server";
      res.status(500).json({ error: message });
    }
  },

  deleteCv: async (req: Request, res: Response) => {
    try {
      const candidate = await service.deleteCandidateCv(String(req.params.id));
      if (!candidate) {
        res.status(404).json({ error: "Không có CV" });
        return;
      }

      res.json(candidate);
    } catch {
      res.status(500).json({ error: "Lỗi khi xóa CV" });
    }
  },

  askCv: async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const result = await service.askCandidateCv(id, req.body.question);
      if (!result.found) {
        res.status(404).json({ error: "Không tìm thấy ứng viên" });
        return;
      }

      res.json(result.result);
    } catch (error: unknown) {
      res.status(400).json({ error: service.formatRagError(error) });
    }
  },
});

const candidateController = createCandidateController(candidateService);

export default candidateController;
