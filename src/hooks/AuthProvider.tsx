/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState } from "react";
import { AUTH_TOKEN_KEY, USER_ROLE_KEY } from "../api/client";

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
    !!localStorage.getItem(AUTH_TOKEN_KEY),
  );
  const [role, setRole] = useState<UserRole>(
    (localStorage.getItem(USER_ROLE_KEY) as UserRole) || "hr",
  );

  const login = (token: string, userRole: UserRole) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(USER_ROLE_KEY, userRole);
    setIsLoggedIn(true);
    setRole(userRole);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_ROLE_KEY);
    setIsLoggedIn(false);
    setRole("hr");
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, role, isAdmin: role === "admin", login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
