import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiGet } from "../api/client";

type Role = "student" | "employer" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  // Gamification fields (for students)
  gold?: number;
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

  const refreshUser = useCallback(async () => {
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
          // Replace user data completely to ensure all fields are updated
          setUser({
            id: data.data.id || user.id,
            name: data.data.name || user.name,
            email: data.data.email || user.email,
            role: data.data.role || user.role,
            // Gamification fields (for students)
            gold: data.data.gold ?? 0,
            starRating: data.data.starRating ?? 1,
            totalTasksCompleted: data.data.totalTasksCompleted ?? 0,
            averageCompletionTime: data.data.averageCompletionTime ?? 0,
            // Other fields
            institution: data.data.institution,
            skills: data.data.skills,
            bio: data.data.bio,
            profilePicture: data.data.profilePicture,
            completedCourses: data.data.completedCourses,
          } as AuthUser);
        }
      }
    } catch (err) {
      console.error("Failed to refresh user data:", err);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  // Set up global refresh mechanism
  useEffect(() => {
    if (!token || !user) return;

    // Refresh on window focus (when user switches back to tab)
    const handleFocus = () => {
      refreshUser();
    };

    // Refresh on visibility change (when tab becomes visible)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshUser();
      }
    };

    // Listen for custom refresh events
    const handleRefreshEvent = () => {
      refreshUser();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("userDataRefresh", handleRefreshEvent);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("userDataRefresh", handleRefreshEvent);
    };
  }, [token, user, refreshUser]);

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
