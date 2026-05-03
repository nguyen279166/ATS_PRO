import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "./AuthProvider";

export type DataContextType = {
  jobs: any[];
  candidates: any[];
  loading: boolean;
  refreshData: (showSpinner?: boolean) => Promise<void>;
};

export const DataContext = createContext<DataContextType | null>(null);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Lấy thông tin đăng nhập từ AuthContext
  const { isLoggedIn } = useContext(AuthContext);

  const refreshData = async (showSpinner = true) => {
    if (!isLoggedIn) return; // Không tải data nếu chưa đăng nhập
    if (showSpinner) setLoading(true);
    try {
      const token = localStorage.getItem("token_lay_duoc");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [jobsRes, candidatesRes] = await Promise.all([
        axios.get("http://localhost:3001/api/jobs", config),
        axios.get("http://localhost:3001/api/candidates", config),
      ]);

      setJobs(jobsRes.data);
      setCandidates(candidatesRes.data);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu toàn cục:", error);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [isLoggedIn]); // Chạy 1 lần duy nhất khi vừa đăng nhập xong

  return (
    <DataContext.Provider value={{ jobs, candidates, loading, refreshData }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData phải được bọc trong DataProvider");
  }
  return context;
};
