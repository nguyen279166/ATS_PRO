import { z } from "zod";

const requiredText = (fieldName: string, max = 160) =>
  z
    .string()
    .trim()
    .min(1, `${fieldName} la bat buoc`)
    .max(max, `${fieldName} qua dai`);

const nullableText = (max: number) =>
  z.string().trim().max(max, "Noi dung qua dai").nullable().optional();

const isoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngay khong hop le")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, "Ngay khong hop le");

const strictDateTimePattern =
  /^([1-9]\d{3})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})?$/;

const isStrictDateTime = (value: string) => {
  const match = strictDateTimePattern.exec(value);
  if (!match) return false;

  const [, yearText, monthText, dayText, hourText, minuteText, secondText] =
    match;
  const [year, month, day, hour, minute, second] = [
    yearText,
    monthText,
    dayText,
    hourText,
    minuteText,
    secondText || "0",
  ].map(Number);
  const calendarValue = new Date(
    Date.UTC(year, month - 1, day, hour, minute, second),
  );

  return (
    calendarValue.getUTCFullYear() === year &&
    calendarValue.getUTCMonth() === month - 1 &&
    calendarValue.getUTCDate() === day &&
    calendarValue.getUTCHours() === hour &&
    calendarValue.getUTCMinutes() === minute &&
    calendarValue.getUTCSeconds() === second &&
    !Number.isNaN(Date.parse(value))
  );
};

const dateTimeSchema = z
  .string()
  .trim()
  .max(64, "Ngay gio qua dai")
  .refine(isStrictDateTime, "Ngay gio khong hop le");

export const idParamsSchema = z.object({
  id: z.uuid("ID khong hop le"),
});

export const candidateIdParamsSchema = z.object({
  candidateId: z.uuid("Candidate khong hop le"),
});

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

export const candidateListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(1_000_000).optional().default(1),
    limit: z.coerce.number().int().min(1).max(1000).optional().default(10),
    search: z.string().trim().max(120, "Tu khoa qua dai").optional(),
    status: candidateStatusSchema.optional(),
    jobId: z.uuid("Job khong hop le").optional(),
    dateFrom: isoDateSchema.optional(),
    dateTo: isoDateSchema.optional(),
  })
  .refine(
    ({ dateFrom, dateTo }) => !dateFrom || !dateTo || dateFrom <= dateTo,
    {
      path: ["dateTo"],
      message: "Ngay ket thuc phai sau ngay bat dau",
    },
  );

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

export const askCandidateCvSchema = z.object({
  question: requiredText("Cau hoi", 500),
});

export const createNoteSchema = z.object({
  candidateId: z.uuid("Candidate khong hop le"),
  content: requiredText("Noi dung ghi chu", 5000),
});

export const updateNoteSchema = z.object({
  content: requiredText("Noi dung ghi chu", 5000),
});

export const interviewStatusSchema = z.enum([
  "Scheduled",
  "Done",
  "Cancelled",
]);

export const createInterviewSchema = z.object({
  candidateId: z.uuid("Candidate khong hop le"),
  scheduledAt: dateTimeSchema,
  location: nullableText(300),
  notes: nullableText(5000),
});

export const updateInterviewSchema = z
  .object({
    scheduledAt: dateTimeSchema.optional(),
    location: nullableText(300),
    notes: nullableText(5000),
    status: interviewStatusSchema.optional(),
  })
  .refine(
    (input) => Object.values(input).some((value) => value !== undefined),
    "Can cung cap it nhat mot truong de cap nhat",
  );
