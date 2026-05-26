/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { useAuth } from "./useAuth";
import type { Job, Candidate } from "../types";

export const DataContext = createContext<{
  jobs: Job[];
  candidates: Candidate[];
  loading: boolean;
  refreshData: (showLoader?: boolean) => Promise<void>;
} | null>(null);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);

  const { isLoggedIn } = useAuth();

  const refreshData = async (showLoader = true) => {
    if (!isLoggedIn) return; // Không tải data nếu chưa đăng nhập
    if (showLoader) setLoading(true);
    try {
      const token = localStorage.getItem("token_lay_duoc");
      const baseUrl = import.meta.env.VITE_BASE_URL;
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [jobsRes, candidatesRes] = await Promise.all([
        axios.get(`${baseUrl}/api/jobs`, config),
        axios.get(`${baseUrl}/api/candidates?page=1&limit=1000`, config),
      ]);

      setJobs(jobsRes.data);
      // API candidates giờ trả { data: [...], pagination: {...} }
      setCandidates(candidatesRes.data.data);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu toàn cục:", error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      refreshData();
    } else {
      // Clear data when logged out
      setJobs([]);
      setCandidates([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // Tự động fetch lại khi người dùng quay lại tab (sau khi server restart)
  useEffect(() => {
    const handleFocus = () => {
      if (isLoggedIn) refreshData(false); // Refresh nhẹ không hiện spinner
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  return (
    <DataContext.Provider value={{ jobs, candidates, loading, refreshData }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within DataProvider");
  }
  return context;
};
