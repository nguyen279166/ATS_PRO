import { z } from "zod";

const requiredText = (fieldName: string, max = 160) =>
  z
    .string()
    .trim()
    .min(1, `${fieldName} la bat buoc`)
    .max(max, `${fieldName} qua dai`);

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Email khong hop le");

export const registerSchema = z.object({
  fullName: requiredText("Ho ten", 80),
  email: emailSchema,
  password: z.string().min(6, "Mat khau toi thieu 6 ky tu").max(120),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Mat khau la bat buoc").max(120),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: requiredText("Token", 256),
  password: z.string().min(8, "Mat khau phai co it nhat 8 ky tu").max(120),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mat khau cu la bat buoc").max(120),
  newPassword: z.string().min(8, "Mat khau moi phai co it nhat 8 ky tu").max(120),
});

export const jobBodySchema = z.object({
  title: requiredText("Tieu de", 160),
  department: requiredText("Phong ban", 120),
  location: requiredText("Dia diem", 180),
  description: z.string().trim().max(5000, "Mo ta qua dai").optional().default(""),
});

export const candidateStatusSchema = z.enum([
  "Applied",
  "Interviewing",
  "Hired",
  "Rejected",
]);

export const candidateBodySchema = z.object({
  name: requiredText("Ten ung vien", 120),
  email: emailSchema,
  jobId: z.uuid("Job khong hop le"),
  status: candidateStatusSchema.optional().default("Applied"),
});

export const updateCandidateStatusSchema = z.object({
  status: candidateStatusSchema,
});

export const bulkCandidateSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("updateStatus"),
    ids: z.array(z.uuid("Candidate khong hop le")).min(1, "Can chon ung vien"),
    status: candidateStatusSchema,
  }),
  z.object({
    action: z.literal("delete"),
    ids: z.array(z.uuid("Candidate khong hop le")).min(1, "Can chon ung vien"),
  }),
]);

export const publicApplySchema = z.object({
  jobId: z.uuid("Job khong hop le"),
  name: requiredText("Ho ten", 120),
  email: emailSchema,
});
