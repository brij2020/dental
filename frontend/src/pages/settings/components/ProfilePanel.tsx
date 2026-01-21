import { useState, type FormEvent } from 'react';
import { changePassword } from '../../../lib/apiClient';
import { IconChevronLeft, IconLock, IconAlertCircle } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

export const ProfilePanel = () => {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get('current_password') as string;
    const newPassword = formData.get('new_password') as string;
    const confirmPassword = formData.get('confirm_password') as string;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'All password fields are required.' });
      setLoading(false);
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long.' });
      setLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New password and confirm password do not match.' });
      setLoading(false);
      return;
    }
    try {
      await changePassword(currentPassword, newPassword);
      setMessage({ type: 'success', text: 'Your password has been updated successfully.' });
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || 'Failed to change password.';
      setMessage({ type: 'error', text: msg });
    }
    setLoading(false);
  };

  return (
    <div>
      <Link to="/settings" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-4">
        <IconChevronLeft className="h-5 w-5" />
        Back to Settings
      </Link>
      <div className="p-6 bg-white border rounded-2xl">
        <h2 className="text-lg font-semibold text-slate-800">Change Your Password</h2>
        <form onSubmit={handleChangePassword} className="max-w-sm mt-4 space-y-4">
          <div>
            <label htmlFor="current_password" className="block mb-1 text-sm font-medium text-slate-700">Current Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <IconLock className="w-5 h-5 text-slate-400" />
              </span>
              <input
                id="current_password"
                name="current_password"
                type="password"
                required
                className="w-full py-2.5 pl-10 pr-3 text-slate-900 bg-white border border-slate-300 rounded-xl outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
                placeholder="Enter your current password"
              />
            </div>
          </div>
          <div>
            <label htmlFor="new_password" className="block mb-1 text-sm font-medium text-slate-700">New Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <IconLock className="w-5 h-5 text-slate-400" />
              </span>
              <input
                id="new_password"
                name="new_password"
                type="password"
                required
                className="w-full py-2.5 pl-10 pr-3 text-slate-900 bg-white border border-slate-300 rounded-xl outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
                placeholder="Enter a new secure password"
              />
            </div>
          </div>
          <div>
            <label htmlFor="confirm_password" className="block mb-1 text-sm font-medium text-slate-700">Confirm New Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <IconLock className="w-5 h-5 text-slate-400" />
              </span>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                required
                className="w-full py-2.5 pl-10 pr-3 text-slate-900 bg-white border border-slate-300 rounded-xl outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
                placeholder="Re-enter new password"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 font-medium text-white transition bg-gradient-to-r from-indigo-600 to-sky-500 rounded-xl shadow-sm hover:brightness-105 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
          {message && (
            <div className={`flex items-start gap-2 p-3 text-sm rounded-lg ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
            }`}>
              <IconAlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <p>{message.text}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

// Add this line to fix the dynamic import error
export default ProfilePanel;