import { useState, useEffect, type ReactNode } from "react";
import { AuthContext } from "./AuthContext";
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
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("auth_token"),
  );

  // Re-read from localStorage when it changes
  // (e.g. after OAuth callback stores the token)
  useEffect(() => {
    const handleStorage = () => {
      const storedToken = localStorage.getItem("auth_token");
      const storedUser = localStorage.getItem("auth_user");
      setToken(storedToken);
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
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setUser(null);
    setToken(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
