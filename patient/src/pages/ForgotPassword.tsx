import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { api } from "../lib/apiClient";

type ForgotPasswordInputs = {
  identifier: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
};

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [otpSent, setOtpSent] = React.useState(false);
  const [sendingOtp, setSendingOtp] = React.useState(false);
  const [resettingPassword, setResettingPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ForgotPasswordInputs>({
    mode: "onTouched",
  });

  const identifierValue = watch("identifier");
  const newPasswordValue = watch("newPassword");

  const handleSendOtp = async () => {
    if (!identifierValue?.trim()) {
      toast.error("Please enter email or mobile number");
      return;
    }

    try {
      setSendingOtp(true);
      const response: any = await api.post("/api/auth/patient-forgot-password/send-otp", {
        identifier: identifierValue.trim(),
      });

      if (!response.success) {
        toast.error(response.error || "Failed to send OTP");
        return;
      }

      setOtpSent(true);
      toast.success(response.data?.message || "OTP sent successfully");
    } catch (error) {
      console.error("Send OTP error:", error);
      toast.error("Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const onSubmit = async (data: ForgotPasswordInputs) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error("Password and confirm password do not match");
      return;
    }

    try {
      setResettingPassword(true);
      const response: any = await api.post("/api/auth/patient-forgot-password/reset-with-otp", {
        identifier: data.identifier.trim(),
        otp: data.otp.trim(),
        newPassword: data.newPassword,
      });

      if (!response.success) {
        toast.error(response.error || "Failed to reset password");
        return;
      }

      toast.success(response.data?.message || "Password reset successful");
      navigate("/login");
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("Failed to reset password");
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <div className="flex h-screen w-screen">
      <div className="w-1/2 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-200 flex items-center justify-center">
        <img src="/logo.png" alt="Company Logo" className="w-48 h-auto object-contain" />
      </div>

      <div className="w-1/2 flex items-center justify-center bg-gradient-to-l from-blue-600 via-blue-400 to-blue-200">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm text-sm"
        >
          <h2 className="text-2xl font-bold mb-2 text-blue-900 text-center">Forgot Password</h2>
          <p className="text-gray-600 text-xs mb-6 text-center">
            Enter your email/mobile, verify OTP, and set a new password.
          </p>

          <div className="mb-4">
            <label className="block text-blue-900 font-semibold mb-1">Email or Mobile</label>
            <input
              type="text"
              placeholder="Enter email or mobile"
              {...register("identifier", { required: "Email or mobile is required" })}
              className="w-full px-3 py-2 border rounded border-blue-300 focus:ring-2 focus:ring-blue-600"
            />
            {errors.identifier && <p className="text-red-500 text-xs mt-1">{errors.identifier.message}</p>}
          </div>

          <button
            type="button"
            onClick={handleSendOtp}
            disabled={sendingOtp}
            className={`w-full mb-4 text-white py-2 rounded-lg transition ${
              sendingOtp ? "bg-gray-400 cursor-not-allowed" : "bg-blue-700 hover:bg-blue-800"
            }`}
          >
            {sendingOtp ? "Sending OTP..." : otpSent ? "Resend OTP" : "Send OTP"}
          </button>

          {otpSent && (
            <>
              <div className="mb-4">
                <label className="block text-blue-900 font-semibold mb-1">OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  {...register("otp", {
                    required: "OTP is required",
                    minLength: { value: 6, message: "OTP must be 6 digits" },
                    maxLength: { value: 6, message: "OTP must be 6 digits" },
                  })}
                  className="w-full px-3 py-2 border rounded border-blue-300 focus:ring-2 focus:ring-blue-600"
                />
                {errors.otp && <p className="text-red-500 text-xs mt-1">{errors.otp.message}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-blue-900 font-semibold mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  {...register("newPassword", {
                    required: "New password is required",
                    minLength: { value: 8, message: "Password must be at least 8 characters" },
                  })}
                  className="w-full px-3 py-2 border rounded border-blue-300 focus:ring-2 focus:ring-blue-600"
                />
                {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>}
              </div>

              <div className="mb-6">
                <label className="block text-blue-900 font-semibold mb-1">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  {...register("confirmPassword", {
                    required: "Please confirm your new password",
                    validate: (value) => value === newPasswordValue || "Passwords do not match",
                  })}
                  className="w-full px-3 py-2 border rounded border-blue-300 focus:ring-2 focus:ring-blue-600"
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={resettingPassword}
                className={`w-full text-white py-2 rounded-lg transition ${
                  resettingPassword ? "bg-gray-400 cursor-not-allowed" : "bg-blue-800 hover:bg-blue-900"
                }`}
              >
                {resettingPassword ? "Resetting..." : "Reset Password"}
              </button>
            </>
          )}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-blue-700 hover:underline font-semibold"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
