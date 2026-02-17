import React from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { api } from "../lib/apiClient";

type LoginMode = "password" | "otp";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = React.useState<LoginMode>("password");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [identifier, setIdentifier] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [otpSent, setOtpSent] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const persistPatientSession = (sessionData: any) => {
    localStorage.setItem("authToken", sessionData.token);
    localStorage.setItem("patient_id", sessionData.patient_id);
    localStorage.setItem("patient_email", sessionData.email);
    localStorage.setItem("patient_name", sessionData.full_name);
    localStorage.setItem("patient_uhid", sessionData.uhid);
  };

  const handlePasswordLogin = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error("Email and password are required");
      return;
    }

    try {
      setLoading(true);
      const response: any = await api.post("/api/auth/patient-login", {
        email: email.trim(),
        password: password,
      });

      if (!response.success) {
        toast.error(response.error || "Login failed");
        return;
      }

      const backendData = response.data;
      const payload = backendData?.data;
      if (backendData?.success && payload?.token) {
        persistPatientSession(payload);
        toast.success("Login successful!");
        navigate("/");
      } else {
        toast.error("Login failed: token missing");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!identifier.trim()) {
      toast.error("Please enter email or mobile number");
      return;
    }

    try {
      setLoading(true);
      const response: any = await api.post("/api/auth/patient-login/send-otp", {
        identifier: identifier.trim(),
      });

      if (!response.success) {
        toast.error(response.error || "Failed to send OTP");
        return;
      }

      setOtpSent(true);
      toast.success(response.data?.message || "OTP sent successfully");
    } catch {
      toast.error("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpLogin = async () => {
    if (!identifier.trim() || !otp.trim()) {
      toast.error("Identifier and OTP are required");
      return;
    }

    try {
      setLoading(true);
      const response: any = await api.post("/api/auth/patient-login/verify-otp", {
        identifier: identifier.trim(),
        otp: otp.trim(),
      });

      if (!response.success) {
        toast.error(response.error || "Invalid OTP");
        return;
      }

      const backendData = response.data;
      const payload = backendData?.data;
      if (backendData?.success && payload?.token) {
        persistPatientSession(payload);
        toast.success("Login successful!");
        navigate("/");
      } else {
        toast.error("Login failed: token missing");
      }
    } catch {
      toast.error("Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen">
      <div className="w-1/2 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-200 flex items-center justify-center">
        <img
          src="/logo.png"
          alt="Company Logo"
          className="w-48 h-auto object-contain"
        />
      </div>

      <div className="w-1/2 flex items-center justify-center bg-gradient-to-l from-blue-600 via-blue-400 to-blue-200">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm text-sm">
          <h2 className="text-3xl font-bold mb-2 text-blue-900 text-center">Log In</h2>
          <p className="text-gray-600 text-xs mb-6 text-center">
            Access your patient account securely
          </p>

          <div className="mb-5 grid grid-cols-2 rounded-lg bg-blue-50 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("password");
                setOtpSent(false);
                setOtp("");
                setShowPassword(false);
              }}
              className={`py-2 rounded-md text-sm font-semibold transition ${
                mode === "password" ? "bg-white text-blue-800 shadow-sm" : "text-blue-700"
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("otp");
                setShowPassword(false);
              }}
              className={`py-2 rounded-md text-sm font-semibold transition ${
                mode === "otp" ? "bg-white text-blue-800 shadow-sm" : "text-blue-700"
              }`}
            >
              OTP Login
            </button>
          </div>

          {mode === "password" ? (
            <>
              <div className="mb-4">
                <label className="block text-blue-900 font-semibold mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-3 py-2 border rounded border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="mb-6">
                <label className="block text-blue-900 font-semibold mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-3 py-2 border rounded border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-600 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center justify-center rounded-full p-1 text-blue-600 transition hover:text-blue-900 focus-visible:ring-2 focus-visible:ring-blue-500 focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePasswordLogin}
                disabled={loading}
                className={`w-full text-white py-2 rounded-lg transition ${
                  loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-800 hover:bg-blue-900"
                }`}
              >
                {loading ? "Logging In..." : "Log In"}
              </button>
            </>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-blue-900 font-semibold mb-1">Email or Mobile</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter email or mobile number"
                  className="w-full px-3 py-2 border rounded border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {otpSent && (
                <div className="mb-4">
                  <label className="block text-blue-900 font-semibold mb-1">OTP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full px-3 py-2 border rounded border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={otpSent ? handleOtpLogin : handleSendOtp}
                disabled={loading}
                className={`w-full text-white py-2 rounded-lg transition ${
                  loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-800 hover:bg-blue-900"
                }`}
              >
                {loading ? (otpSent ? "Verifying..." : "Sending OTP...") : (otpSent ? "Verify OTP & Log In" : "Send OTP")}
              </button>

              {otpSent && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full mt-2 py-2 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition"
                >
                  Resend OTP
                </button>
              )}
            </>
          )}

          <div className="mt-3 text-right">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-blue-700 hover:underline text-sm font-semibold"
            >
              Forgot Password?
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don’t have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/signup")}
                className="text-blue-700 hover:underline font-semibold"
              >
                Create Account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
