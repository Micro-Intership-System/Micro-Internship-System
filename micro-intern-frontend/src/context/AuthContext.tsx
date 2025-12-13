import React, { createContext, useContext, useState, useEffect } from "react";

type Role = "student" | "employer" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
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

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
