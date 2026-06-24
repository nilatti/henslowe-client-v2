import { useState, useEffect, type ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import api from "../api/client";
import type { AuthUser } from "../types/auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem("auth_user");
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return { ...parsed, is_superadmin: parsed.role === 'superadmin' };
    } catch {
      return null;
    }
  });

  // Re-read from localStorage when it changes cross-tab
  useEffect(() => {
    const handleStorage = () => {
      const storedUser = localStorage.getItem("auth_user");
      try {
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setUser({ ...parsed, is_superadmin: parsed.role === 'superadmin' });
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const logout = () => {
    api.delete('/api/v1/sessions').catch(() => {});
    localStorage.removeItem("auth_user");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
