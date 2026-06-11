/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState } from "react";

export type UserRole = "admin" | "hr";

export type AuthContextType = {
  isLoggedIn: boolean;
  role: UserRole;
  isAdmin: boolean;
  login: (token: string, role: UserRole) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("token_lay_duoc"),
  );
  const [role, setRole] = useState<UserRole>(
    (localStorage.getItem("user_role") as UserRole) || "hr",
  );

  const login = (token: string, userRole: UserRole) => {
    localStorage.setItem("token_lay_duoc", token);
    localStorage.setItem("user_role", userRole);
    setIsLoggedIn(true);
    setRole(userRole);
  };

  const logout = () => {
    localStorage.removeItem("token_lay_duoc");
    localStorage.removeItem("user_role");
    setIsLoggedIn(false);
    setRole("hr");
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, role, isAdmin: role === "admin", login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
