import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../../api/client";
import type { Job } from "../../types";

export function usePublicJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get("/api/public/jobs");
      setJobs(response.data);
    } catch (fetchError) {
      console.error("Lỗi khi tải công việc:", fetchError);
      setError(
        "Không thể tải danh sách công việc. Vui lòng kiểm tra kết nối và thử lại.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchJobs();
  }, [fetchJobs]);

  return { jobs, loading, error, retry: fetchJobs };
}
