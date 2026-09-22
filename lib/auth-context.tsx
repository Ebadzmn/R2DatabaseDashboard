"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { IAdminUser } from "./types";
import { api } from "./api-client";

interface AuthContextType {
  user: IAdminUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<IAdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Hydrate token and user from localStorage
    const storedToken = localStorage.getItem("admin_token");
    const storedUser = localStorage.getItem("admin_user");

    if (storedToken) {
      setToken(storedToken);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          // ignore corrupted user JSON
        }
      }

      // Verify token with backend
      api.auth
        .me()
        .then((res) => {
          setUser(res.data);
          localStorage.setItem("admin_user", JSON.stringify(res.data));
        })
        .catch(() => {
          // If token expired or invalid, reset
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_user");
          setUser(null);
          setToken(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }

    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener("auth_unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("auth_unauthorized", handleUnauthorized);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login(email, password);
    setToken(res.data.token);
    setUser(res.data.user as IAdminUser);
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // ignore
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
    }
  };

  const refreshProfile = async () => {
    try {
      const res = await api.auth.me();
      setUser(res.data);
      localStorage.setItem("admin_user", JSON.stringify(res.data));
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
