import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import type { UserRole } from "./types/auth";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import EditProfilePage from "./pages/EditProfilePage";
import StudentDashboard from "./pages/StudentDashboard";
import LecturerDashboard from "./pages/LecturerDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";

import "./App.css";

// ─── JWT helper ───────────────────────────────────────────────
interface JwtPayload {
  id: string;
  role: UserRole;
  exp: number;
}

function getTokenPayload(): JwtPayload | null {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

// ─── Protected Route ──────────────────────────────────────────
const roleRedirects: Record<UserRole, string> = {
  superadmin: "/admin-dashboard",
  lecturer: "/lecturer-dashboard",
  student: "/dashboard",
  jobprovider: "/dashboard",
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const location = useLocation();
  const payload = getTokenPayload();

  if (!payload) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(payload.role)) {
    return <Navigate to={roleRedirects[payload.role] ?? "/login"} replace />;
  }

  return <>{children}</>;
};

// ─── App ──────────────────────────────────────────────────────
const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected routes — role-gated */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["student", "jobprovider"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lecturer-dashboard"
          element={
            <ProtectedRoute allowedRoles={["lecturer"]}>
              <LecturerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={["superadmin"]}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-profile/:id"
          element={
            <ProtectedRoute>
              <EditProfilePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;