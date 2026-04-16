import React, { createContext, useState } from "react";

export const AuthContext = createContext<any>(null);

type AuthContextType = {
  isLoggedIn: boolean;
  login: (token: string) => void;
  logout: () => void;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("token_lay_duoc"),
  );
  const login = (token: string) => {
    localStorage.setItem("token_lay_duoc", token);
    setIsLoggedIn(true);
  };
  const logout = () => {
    localStorage.removeItem("token_lay_duoc");
    setIsLoggedIn(false);
  };
  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
