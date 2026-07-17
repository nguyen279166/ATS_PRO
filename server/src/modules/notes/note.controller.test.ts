import type { Response } from "express";
import { describe, expect, it, vi } from "vitest";
import type { AuthRequest } from "../../routes/authMiddleware";

vi.mock("./note.service", () => ({
  createNote: vi.fn(),
  deleteNote: vi.fn(),
  listCandidateNotes: vi.fn(),
  updateNote: vi.fn(),
  NoteForbiddenError: class NoteForbiddenError extends Error {},
  NoteNotFoundError: class NoteNotFoundError extends Error {},
}));

import { postNote, putNote } from "./note.controller";

const createResponse = () => {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  };
  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);
  return response;
};

describe("note controller validation", () => {
  it("returns JSON 400 when an updated note has a non-string body", async () => {
    const response = createResponse();

    await putNote(
      { body: { content: 123 } } as AuthRequest,
      response as unknown as Response,
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      error: "Nội dung ghi chú không được trống",
    });
  });

  it("returns JSON 400 when a new note has no candidate", async () => {
    const response = createResponse();

    await postNote(
      {
        body: { content: "Ghi chú hợp lệ" },
        user: { userId: "user-1", role: "hr" },
      } as AuthRequest,
      response as unknown as Response,
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      error: "Ứng viên không hợp lệ",
    });
  });

  it("returns JSON 400 when new-note content is not a string", async () => {
    const response = createResponse();

    await postNote(
      {
        body: { candidateId: "candidate-1", content: ["invalid"] },
        user: { userId: "user-1", role: "hr" },
      } as AuthRequest,
      response as unknown as Response,
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      error: "Nội dung ghi chú không được trống",
    });
  });
});
