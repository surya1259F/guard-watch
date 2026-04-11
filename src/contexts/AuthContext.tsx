import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { DEMO_USERS, DEMO_CREDENTIALS, type User } from "@/lib/mock-data";

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("sp_user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setIsLoading(false);
  }, []);

  const login = (username: string, password: string) => {
    const cred = DEMO_CREDENTIALS[username];
    if (!cred || cred.password !== password) {
      return { success: false, error: "Invalid credentials" };
    }
    const foundUser = DEMO_USERS.find(u => u.uid === cred.uid);
    if (!foundUser) return { success: false, error: "User not found" };
    setUser(foundUser);
    localStorage.setItem("sp_user", JSON.stringify(foundUser));
    localStorage.setItem("sp_role", foundUser.role);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("sp_user");
    localStorage.removeItem("sp_role");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
