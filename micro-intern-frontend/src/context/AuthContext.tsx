import React, { createContext, useContext, useState, useEffect } from "react";
import { apiGet } from "../api/client";

type Role = "student" | "employer" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  // Gamification fields (for students)
  gold?: number;
  xp?: number;
  starRating?: number;
  totalTasksCompleted?: number;
  averageCompletionTime?: number;
  // Other fields
  institution?: string;
  skills?: string[];
  bio?: string;
  profilePicture?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // hydrate from localStorage on first render
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem("mi_user");
    return stored ? (JSON.parse(stored) as AuthUser) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("mi_token");
  });

  const [loading, setLoading] = useState(false);

  // keep localStorage in sync if state changes
  useEffect(() => {
    if (user) localStorage.setItem("mi_user", JSON.stringify(user));
    else localStorage.removeItem("mi_user");
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem("mi_token", token);
    else localStorage.removeItem("mi_token");
  }, [token]);

  const login = (newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("mi_token");
    localStorage.removeItem("mi_user");
  };

  const refreshUser = async () => {
    if (!token || !user) return;
    
    try {
      setLoading(true);
      // Fetch updated user data based on role
      const role = user.role;
      let endpoint = "";
      
      if (role === "student") {
        endpoint = "/student/me";
      } else if (role === "employer") {
        endpoint = "/employer/me";
      } else if (role === "admin") {
        // Admin might not have a /me endpoint, skip for now
        return;
      }
      
      if (endpoint) {
        const data = await apiGet<{ success: boolean; data: any }>(endpoint);
        if (data.success && data.data) {
          // Merge with existing user data, preserving id and role
          setUser((prev) => ({
            ...prev,
            ...data.data,
            id: prev?.id || data.data.id,
            role: prev?.role || data.data.role,
          } as AuthUser));
        }
      }
    } catch (err) {
      console.error("Failed to refresh user data:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
