import { useState } from 'react';
import { forgotPassword } from '../../lib/apiClient';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function ForgotPassword() {
  const [emailOrMobile, setEmailOrMobile] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrMobile.trim()) {
      toast.error('Please enter your registered email or mobile number.');
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(emailOrMobile.trim());
      toast.success('If your account exists, a reset link or code has been sent.');
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || 'Failed to send reset instructions.';
      toast.error(msg);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow">
        <h2 className="text-2xl font-bold mb-6 text-slate-800">Forgot Password</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="emailOrMobile" className="block mb-1 text-sm font-medium text-slate-700">Registered Email or Mobile</label>
            <input
              id="emailOrMobile"
              name="emailOrMobile"
              type="text"
              value={emailOrMobile}
              onChange={e => setEmailOrMobile(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
              placeholder="Enter your email or mobile number"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-2.5 text-white font-medium shadow-sm hover:brightness-105 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link to="/login" className="text-sky-600 hover:underline">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
