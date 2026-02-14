import type { FormEvent } from "react";
import { useState } from "react";
import { useAuth } from "../../state/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  IconMail,
  IconLock,
  IconDeviceMobile,
  IconKey,
  IconEye,
  IconEyeOff,
  IconLoader2,
} from "@tabler/icons-react";
import logo from "../../assets/spai.jpeg";

export default function Login() {
  const { login, sendMobileOtp, loginWithMobileOtp } = useAuth();
  const navigate = useNavigate();

  const [loginMode, setLoginMode] = useState<"password" | "otp">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);


  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (loginMode === "password") {
        await login(email, password);
      } else {
        await loginWithMobileOtp(mobileNumber, otp);
      }
      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Login failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const onSendOtp = async () => {
    const digits = mobileNumber.replace(/\D/g, "");
    if (digits.length !== 10) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }

    setSubmitting(true);
    try {
      await sendMobileOtp(digits);
      setOtpSent(true);
      toast.success("OTP sent successfully");
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Failed to send OTP";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
      {/* Brand panel */}
      <aside className="relative hidden lg:flex items-center justify-center bg-gradient-to-b from-indigo-700 to-sky-600">
        {/* subtle glow/pattern */}
        <div className="absolute inset-0 opacity-25 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] bg-[radial-gradient(45rem_30rem_at_20%_20%,white_10%,transparent_60%)]" />
        <div className="relative z-10 max-w-md px-10 text-white">
          <img src={logo} alt="DentalPro logo" className="h-40 w-auto mb-6 drop-shadow" />
          <h2 className="text-3xl font-semibold leading-tight">
            SPAI LABS
          </h2>
          <p className="mt-3 text-white/80">
            Manage patients, appointments, billing, and analytics from one
            modern dashboard.
          </p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile header */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img src={logo} alt="DentalPro logo" className="h-8 w-auto" />
            <span className="text-lg font-semibold text-slate-900">
              DentalPro
            </span>
          </div>

          <div className="rounded-2xl bg-white shadow ring-1 ring-slate-200">
            <div className="p-6 sm:p-8">
              <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
              <div className="mt-4 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode("password");
                    setOtpSent(false);
                    setOtp("");
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                    loginMode === "password" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Email & Password
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMode("otp")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                    loginMode === "otp" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Mobile OTP
                </button>
              </div>
              <form onSubmit={onSubmit} className="mt-6 space-y-5">
                {loginMode === "password" ? (
                  <>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                        Email
                      </label>
                      <div className="mt-2 relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <IconMail className="h-5 w-5 text-slate-400" />
                        </span>
                        <input
                          id="email"
                          required
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
                          placeholder="you@clinic.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                        Password
                      </label>
                      <div className="mt-2 relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <IconLock className="h-5 w-5 text-slate-400" />
                        </span>
                        <input
                          id="password"
                          required
                          type={showPwd ? "text" : "password"}
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-10 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd((v) => !v)}
                          aria-label={showPwd ? "Hide password" : "Show password"}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                        >
                          {showPwd ? <IconEyeOff className="h-5 w-5" /> : <IconEye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label htmlFor="mobile_number" className="block text-sm font-medium text-slate-700">
                        Mobile Number
                      </label>
                      <div className="mt-2 relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <IconDeviceMobile className="h-5 w-5 text-slate-400" />
                        </span>
                        <input
                          id="mobile_number"
                          required
                          type="tel"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
                          placeholder="9876543210"
                        />
                      </div>
                    </div>

                    {otpSent && (
                      <div>
                        <label htmlFor="otp" className="block text-sm font-medium text-slate-700">
                          OTP
                        </label>
                        <div className="mt-2 relative">
                          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <IconKey className="h-5 w-5 text-slate-400" />
                          </span>
                          <input
                            id="otp"
                            required
                            type="text"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
                            placeholder="Enter 6-digit OTP"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    Remember me
                  </label>
                  <a className="text-sm font-medium text-indigo-700 hover:text-indigo-600" href="/forgot-password">
                    Forgot password?
                  </a>
                </div>

                <button
                  type={loginMode === "otp" && !otpSent ? "button" : "submit"}
                  onClick={loginMode === "otp" && !otpSent ? onSendOtp : undefined}
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500
                             px-4 py-2.5 text-white font-medium shadow-sm hover:brightness-105 active:brightness-95
                             disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {submitting && <IconLoader2 className="h-5 w-5 animate-spin" />}
                  {submitting
                    ? (loginMode === "otp" && !otpSent ? "Sending OTP…" : "Signing in…")
                    : (loginMode === "otp" && !otpSent ? "Send OTP" : "Sign in")}
                </button>
                {loginMode === "otp" && otpSent && (
                  <button
                    type="button"
                    onClick={onSendOtp}
                    disabled={submitting}
                    className="w-full text-sm font-medium text-indigo-700 hover:text-indigo-600"
                  >
                    Resend OTP
                  </button>
                )}
              </form>

              <p className="mt-6 text-center text-sm text-slate-500">
                By signing in you agree to our{" "}
                <a className="font-medium text-slate-700 hover:text-slate-900" href="#">
                  Terms
                </a>{" "}
                and{" "}
                <a className="font-medium text-slate-700 hover:text-slate-900" href="#">
                  Privacy Policy
                </a>.
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} SPAILABS
          </p>
        </div>
      </main>
    </div>
  );
}
