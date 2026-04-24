"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
  id: string;
  tpCode?: string;
  username?: string;
  email: string;
  role: "atc" | "admin";
  trainingPartnerName?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setUser(null);
    setToken(null);
    
    // Redirect based on current route
    if (pathname.startsWith("/admin")) {
      router.push("/admin/login");
    } else if (pathname.startsWith("/atc")) {
      router.push("/atc/login");
    }
  }, [pathname, router]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("auth_token", newToken);
    localStorage.setItem("auth_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const refreshUser = useCallback(async () => {
    const savedToken = localStorage.getItem("auth_token");
    if (!savedToken) {
      setLoading(false);
      return;
    }

    try {
      // Determine which endpoint to call based on the saved user role or path
      const savedUser = JSON.parse(localStorage.getItem("auth_user") || "{}");
      const role = savedUser.role || (pathname.startsWith("/admin") ? "admin" : "atc");
      
      const endpoint = role === "admin" ? "/api/admin/me" : "/api/atc/me";
      
      const res = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          const updatedUser = { ...data.user, role };
          setUser(updatedUser);
          setToken(savedToken);
          localStorage.setItem("auth_user", JSON.stringify(updatedUser));
        }
      } else if (res.status === 401) {
        logout();
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
    } finally {
      setLoading(false);
    }
  }, [logout, pathname]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Handle protected routes
  useEffect(() => {
    if (loading) return;

    const isPublicRoute = 
      pathname === "/" || 
      pathname === "/atc/login" || 
      pathname === "/admin/login" || 
      pathname.startsWith("/public");

    if (!user && !isPublicRoute) {
      if (pathname.startsWith("/admin")) {
        router.push("/admin/login");
      } else if (pathname.startsWith("/atc")) {
        router.push("/atc/login");
      }
    }
  }, [user, loading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
