import { useContext } from "react";
import { AuthContext, type AuthContextType } from "./AuthProvider";

export const useAuth = (): AuthContextType => {
  return useContext(AuthContext);
};
