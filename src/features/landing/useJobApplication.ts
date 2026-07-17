import {
  useState,
  type ChangeEvent,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import { toast } from "react-toastify";
import { apiClient, isApiError } from "../../api/client";
import type { Job } from "../../types";

type UseJobApplicationOptions = {
  selectedJob: Job | null;
  onSuccess: () => void;
};

export type JobApplicationController = {
  applicantName: string;
  setApplicantName: Dispatch<SetStateAction<string>>;
  applicantEmail: string;
  setApplicantEmail: Dispatch<SetStateAction<string>>;
  cvFile: File | null;
  isApplying: boolean;
  submissionError: string | null;
  clearSubmissionError: () => void;
  clearSelectedFile: () => void;
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "jpg", "jpeg", "png"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function useJobApplication({
  selectedJob,
  onSuccess,
}: UseJobApplicationOptions): JobApplicationController {
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const clearSubmissionError = () => setSubmissionError(null);

  const clearSelectedFile = () => {
    setCvFile(null);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension || "")) {
      toast.error("Chỉ chấp nhận PDF, DOC, DOCX, JPG, PNG");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File quá lớn, tối đa 10MB");
      event.target.value = "";
      return;
    }

    setCvFile(file);
    setSubmissionError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedJob) return;

    setIsApplying(true);
    setSubmissionError(null);
    try {
      const formData = new FormData();
      formData.append("jobId", selectedJob.id);
      formData.append("name", applicantName);
      formData.append("email", applicantEmail);
      if (cvFile) formData.append("cv", cvFile);

      await apiClient.post("/api/public/apply", formData);
      toast.success(
        "Ứng tuyển thành công! Nhà tuyển dụng sẽ sớm liên hệ với bạn.",
      );
      setApplicantName("");
      setApplicantEmail("");
      clearSelectedFile();
      onSuccess();
    } catch (submitError: unknown) {
      const message = isApiError(submitError)
        ? submitError.response?.data?.error || "Lỗi khi ứng tuyển"
        : "Lỗi khi ứng tuyển";
      setSubmissionError(message);
      toast.error(message);
    } finally {
      setIsApplying(false);
    }
  };

  return {
    applicantName,
    setApplicantName,
    applicantEmail,
    setApplicantEmail,
    cvFile,
    isApplying,
    submissionError,
    clearSubmissionError,
    clearSelectedFile,
    handleFileChange,
    handleSubmit,
  };
}
