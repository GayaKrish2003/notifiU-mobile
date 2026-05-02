import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import Logo from '../components/Logo';
import { resetPassword } from '../services/api';

type ApiError = {
  response?: { data?: { message?: string } };
};

const ResetPasswordPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword({ token, password: newPassword });
      setSuccess(res.data.message || 'Password reset successfully!');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: unknown) {
      setError((err as ApiError).response?.data?.message || 'Password reset failed. The link might be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-12 max-w-md w-full">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <Logo className="mb-2" />
          <h2 className="text-gray-400 font-medium text-lg">Set New Password</h2>
        </div>

        {/* Message Indicator */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-[#FBB017] text-white rounded-full flex items-center justify-center shadow-lg">
            <Lock size={24} />
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm mb-4 text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-4 text-center">
            {success} <br /> Redirecting to login...
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-6">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2 pl-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? 'Resetting...' : 'Save New Password'}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-8 text-center">
          <Link to="/login" className="text-sm text-gray-500 hover:text-[#FBB017] inline-flex items-center gap-1 transition-colors">
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
