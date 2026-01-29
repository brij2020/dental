import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { resetPassword } from '../../lib/apiClient';

export default function ResetPassword() {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-fill token from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlToken = params.get('token');
    if (urlToken) setToken(urlToken);
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newPassword || !confirmPassword) {
      toast.error('All fields are required.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      toast.success('Password reset successful! You can now log in.');
      navigate('/login');
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || 'Failed to reset password.';
      toast.error(msg);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow">
        <h2 className="text-2xl font-bold mb-2 text-slate-800">Reset Password</h2>
        <p className="text-sm text-slate-600 mb-6">Enter your reset token and new password to regain access to your account.</p>
        
        {!token && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Don't have a reset token? <Link to="/forgot-password" className="font-medium text-blue-600 hover:underline">Request one here</Link>
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="token" className="block mb-1 text-sm font-medium text-slate-700">Reset Token</label>
            <input
              id="token"
              name="token"
              type="text"
              value={token}
              onChange={e => setToken(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition font-mono text-sm"
              placeholder="Paste your reset token here"
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block mb-1 text-sm font-medium text-slate-700">New Password</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
              placeholder="Enter new password (min 8 characters)"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block mb-1 text-sm font-medium text-slate-700">Confirm New Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
              placeholder="Re-enter new password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-2.5 text-white font-medium shadow-sm hover:brightness-105 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        <div className="mt-6 space-y-3 text-center text-sm">
          <p className="text-slate-600">
            Remember your password? <Link to="/login" className="text-sky-600 font-medium hover:underline">Back to Login</Link>
          </p>
          <p className="text-slate-600">
            <Link to="/forgot-password" className="text-sky-600 font-medium hover:underline">Request a new reset token</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
