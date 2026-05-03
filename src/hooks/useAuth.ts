import { useContext } from "react";
import { AuthContext } from "./AuthProvider";

export const useAuth = (): AuthContextType => {
  return useContext(AuthContext);
};
