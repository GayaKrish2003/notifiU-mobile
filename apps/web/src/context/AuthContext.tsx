import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { jwtDecode } from "jwt-decode";
import type { User } from "../types/auth";

interface JwtPayload {
  id: string;
  role: "superadmin" | "student" | "lecturer" | "jobprovider";
  exp: number;
}

interface AuthContextType {
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function decodeUser(token: string): User | null {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    if (decoded.exp * 1000 < Date.now()) return null;
    return { id: decoded.id, username: decoded.id, role: decoded.role };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const t = localStorage.getItem("token");
    return t ? decodeUser(t) : null;
  });

  const login = useCallback((token: string) => {
    localStorage.setItem("token", token);
    setUser(decodeUser(token));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  // Auto-logout when token expires
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const { exp } = jwtDecode<JwtPayload>(token);
      const ms = exp * 1000 - Date.now();
      if (ms <= 0) {
        logout();
        return;
      }
      const t = setTimeout(logout, ms);
      return () => clearTimeout(t);
    } catch {
      logout();
    }
  }, [user, logout]);

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}