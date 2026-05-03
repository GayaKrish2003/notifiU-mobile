import React, { useState } from "react";
import type { ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import Logo from "../components/Logo";
import { login } from "../services/api";

type UserRole = "superadmin" | "lecturer" | string;

interface LoginResponse {
  role: UserRole;
  accessToken?: string;
  token?: string;
  name?: string;
  email?: string;
  [key: string]: unknown;
}

type ApiError = {
  response?: { data?: { message?: string } };
};

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await login({ email, password });
      const data = response.data as LoginResponse;
      const accessToken = data.accessToken || data.token;
      if (accessToken) {
        localStorage.setItem("token", accessToken);
      }
      localStorage.setItem(
        "user",
        JSON.stringify({
          accessToken: accessToken,
          name: data.name,
          email: data.email,
        }),
      );

      if (data.role === "superadmin") {
        navigate("/admin-dashboard");
      } else if (data.role === "lecturer") {
        navigate("/lecturer-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err: unknown) {
      setError(
        (err as ApiError).response?.data?.message ||
          "Login failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-12 max-w-md w-full">
        <div className="flex flex-col items-center mb-10">
          <Logo className="mb-2" />
          <h2 className="text-gray-400 font-medium text-lg">
            Login to Your Account
          </h2>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2 pl-1">
              Email/Username
            </label>
            <input
              type="text"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              className="w-full bg-[#F0F2F5] border-none rounded-2xl p-4 focus:ring-2 focus:ring-[#FBB017] outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2 pl-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
                className="w-full bg-[#F0F2F5] border-none rounded-2xl p-4 pr-12 focus:ring-2 focus:ring-[#FBB017] outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 pl-1">
              <input
                type="checkbox"
                id="remember"
                className="w-5 h-5 rounded border-gray-300 text-[#FBB017] focus:ring-[#FBB017]"
              />
              <label htmlFor="remember" className="text-gray-600 text-sm">
                Remember me
              </label>
            </div>
            <Link
              to="/forgot-password"
              className="text-sm font-semibold text-[#FBB017] hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FBB017] hover:bg-[#e9a215] text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          Don't have an account?{" "}
          <Link to="/register" className="text-[#FBB017] font-semibold">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
