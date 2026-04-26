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
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    }
    setUser(null);
    setToken(null);
    
    const target = pathname.startsWith("/admin") ? "/admin/login" : "/atc/login";
    router.push(target);
  }, [pathname, router]);

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem("auth_token", newToken);
    localStorage.setItem("auth_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const refreshUser = useCallback(async (forcedToken?: string, forcedRole?: string) => {
    const activeToken = forcedToken || localStorage.getItem("auth_token") || token;
    if (!activeToken) return;

    try {
      const activeRole = forcedRole || user?.role || (pathname.startsWith("/admin") ? "admin" : "atc");
      const endpoint = activeRole === "admin" ? "/api/admin/me" : "/api/atc/me";
      
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${activeToken.trim()}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          const updatedUser = { ...data.user, role: activeRole };
          setUser(updatedUser);
          localStorage.setItem("auth_user", JSON.stringify(updatedUser));
        }
      } else if (res.status === 401) {
         // Only logout if we are absolutely sure this token is dead
         const st = localStorage.getItem("auth_token");
         if (st === activeToken) {
           console.warn("Session invalid, logging out.");
           logout();
         }
      }
    } catch (error) {
      console.error("Background verification failed:", error);
    }
  }, [token, user?.role, pathname, logout]);

  // Sync state with localStorage ONCE on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    const savedUserStr = localStorage.getItem("auth_user");
    
    if (savedToken && savedUserStr) {
      try {
        const parsed = JSON.parse(savedUserStr);
        setToken(savedToken);
        setUser(parsed);
        // Verify in background
        refreshUser(savedToken, parsed.role);
      } catch (e) {
        console.error("Hydration error", e);
      }
    }
    
    setLoading(false);
    setIsInitialized(true);
  }, []); 

  // Protection logic
  useEffect(() => {
    if (!isInitialized || loading) return;

    const isPublic = 
      pathname === "/" || 
      pathname === "/atc/login" || 
      pathname === "/admin/login" || 
      pathname.startsWith("/public");

    if (!user && !isPublic) {
      const target = pathname.startsWith("/admin") ? "/admin/login" : "/atc/login";
      router.push(target);
    }
  }, [user, loading, isInitialized, pathname, router]);

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
