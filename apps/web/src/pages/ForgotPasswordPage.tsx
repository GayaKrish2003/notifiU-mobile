import React, { useState } from "react";
import type { ReactNode, ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, ShieldCheck, Lock } from "lucide-react";
import Logo from "../components/Logo";
import { forgotPassword, verifyOTP, resetPassword } from "../services/api";

type Step = 1 | 2 | 3;

interface StepConfig {
  num: Step;
  label: string;
  icon: ReactNode;
}

type ApiError = {
  response?: { data?: { message?: string } };
};

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  // Step: 1 = Enter Email, 2 = Enter OTP, 3 = Set New Password
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Step 1: Send OTP
  const handleSendOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await forgotPassword({ email });
      setSuccess(res.data.message || "OTP sent to your email!");
      setStep(2);
    } catch (err: unknown) {
      setError(
        (err as ApiError).response?.data?.message || "Failed to send OTP",
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await verifyOTP({ email, otp });
      setSuccess(res.data.message || "OTP verified!");
      setStep(3);
    } catch (err: unknown) {
      setError(
        (err as ApiError).response?.data?.message || "OTP verification failed",
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword({ email, password: newPassword });
      setSuccess(res.data.message || "Password reset successfully!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: unknown) {
      setError(
        (err as ApiError).response?.data?.message || "Password reset failed",
      );
    } finally {
      setLoading(false);
    }
  };

  // Step indicator
  const steps: StepConfig[] = [
    { num: 1, label: "Email", icon: <Mail size={18} /> },
    { num: 2, label: "OTP", icon: <ShieldCheck size={18} /> },
    { num: 3, label: "Password", icon: <Lock size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-12 max-w-md w-full">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <Logo className="mb-2" />
          <h2 className="text-gray-400 font-medium text-lg">Reset Password</h2>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {steps.map((s, i) => (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step >= s.num
                      ? "bg-[#FBB017] text-white shadow-lg"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {s.icon}
                </div>
                <span
                  className={`text-xs mt-1 font-medium ${step >= s.num ? "text-[#FBB017]" : "text-gray-400"}`}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`w-10 h-0.5 mb-5 rounded ${step > s.num ? "bg-[#FBB017]" : "bg-gray-200"}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm mb-4 text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-4 text-center">
            {success}
          </div>
        )}

        {/* Step 1: Email */}
        {step === 1 && (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2 pl-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setEmail(e.target.value)
                }
                placeholder="Enter your registered email"
                className="w-full bg-[#F0F2F5] border-none rounded-2xl p-4 focus:ring-2 focus:ring-[#FBB017] outline-none transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FBB017] hover:bg-[#e9a215] text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2 pl-1">
                Enter OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setOtp(e.target.value)
                }
                placeholder="6-digit OTP"
                maxLength={6}
                className="w-full bg-[#F0F2F5] border-none rounded-2xl p-4 text-center text-2xl tracking-[0.5em] font-bold focus:ring-2 focus:ring-[#FBB017] outline-none transition-all"
                required
              />
              <p className="text-xs text-gray-400 mt-2 text-center">
                Check your email for the 6-digit OTP
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FBB017] hover:bg-[#e9a215] text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setError("");
                setSuccess("");
              }}
              className="w-full text-gray-500 text-sm hover:text-[#FBB017] transition-colors"
            >
              Resend OTP
            </button>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2 pl-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setNewPassword(e.target.value)
                }
                placeholder="Min. 8 characters"
                className="w-full bg-[#F0F2F5] border-none rounded-2xl p-4 focus:ring-2 focus:ring-[#FBB017] outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2 pl-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="Re-enter new password"
                className="w-full bg-[#F0F2F5] border-none rounded-2xl p-4 focus:ring-2 focus:ring-[#FBB017] outline-none transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FBB017] hover:bg-[#e9a215] text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm text-gray-500 hover:text-[#FBB017] inline-flex items-center gap-1 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
