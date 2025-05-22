"use client";

import { createContext, useState, useEffect, ReactNode } from "react";
import axios from "@/lib/api";
import { useRouter } from "next/navigation";

interface AuthTokens {
  access: string;
  refresh: string;
}

interface AuthContextType {
  authTokens: AuthTokens | null;
  loginUser: (username: string, password: string) => Promise<void>;
  logoutUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authTokens, setAuthTokens] = useState<AuthTokens | null>(() => {
    if (typeof window !== "undefined") {
      return JSON.parse(localStorage.getItem("authTokens") || "null");
    }
    return null;
  });
  const router = useRouter();

  useEffect(() => {
    if (authTokens) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${authTokens.access}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [authTokens]);

  const loginUser = async (username: string, password: string) => {
    try {
      const response = await axios.post<AuthTokens>("/api/token/", { username, password });
      setAuthTokens(response.data);
      localStorage.setItem("authTokens", JSON.stringify(response.data));
      router.push("/dashboard"); // Redirection après connexion
    } catch (error) {
      console.error("Échec de la connexion", error);
    }
  };

  const logoutUser = () => {
    setAuthTokens(null);
    localStorage.removeItem("authTokens");
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ authTokens, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
