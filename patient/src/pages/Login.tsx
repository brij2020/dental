import React from "react";
import Input from "../Components/input";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/apiClient";

type LoginFormInputs = {
  email: string;
  password: string;
};

const Login: React.FC = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>({
    mode: "onTouched",
  });

  const onSubmit = async (data: LoginFormInputs) => {
    if(isSubmitting) return;
    try {
      console.log("🚀 Logging in patient:", data.email);
      
      const response: any = await api.post("/api/auth/patient-login", {
        email: data.email,
        password: data.password,
      });

      console.log("📋 API Response:", response);

      if (!response.success) {
        console.error("❌ Login failed:", response.error);
        toast.error(response.error || "Login failed");
        return;
      }

      // response.data contains the backend response with patient data
      const backendData = response.data;
      
      if(backendData?.success && backendData?.data) {
        console.log("✅ Login successful:", backendData.data);
        
        // // Store token and patient info
        // localStorage.setItem("authToken", backendData.data.token);
        // localStorage.setItem("patient_id", backendData.data.patient_id);
        // localStorage.setItem("patient_email", backendData.data.email);
        // localStorage.setItem("patient_name", backendData.data.full_name);
        // localStorage.setItem("patient_uhid", backendData.data.uhid);
        
        toast.success("Login successful!");
        navigate("/");
      }
    } catch (err) {
      console.error("❌ Unexpected error:", err);
      toast.error("An unexpected error occurred");
    }
  };

  return (
    <div className="flex h-screen w-screen">
      {/* Left side - Logo */}
      <div className="w-1/2 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-200 flex items-center justify-center">
        <img
          src="/logo.png"
          alt="Company Logo"
          className="w-48 h-auto object-contain"
        />
      </div>

      {/* Right side - Login Form */}
      <div className="w-1/2 flex items-center justify-center bg-gradient-to-l from-blue-600 via-blue-400 to-blue-200">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm text-sm"
        >
          <h2 className="text-3xl font-bold mb-8 text-blue-900 text-center">
            Log In
          </h2>

          {/* Email */}
          <div className="mb-4 w-full">
            <Input
              as="input"
              id="email"
              label={<span className="block text-blue-900">Email</span>}
              type="email"
              placeholder="Enter your Email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email address",
                },
              })}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600 hover:ring-2 hover:ring-blue-400 bg-white text-blue-900 border-blue-300 ${
                errors.email ? "border-red-500" : ""
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="mb-6 w-full">
            <Input
              as="input"
              id="password"
              label={<span className="text-blue-900">Password</span>}
              type="password"
              placeholder="Enter Password"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
              })}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600 hover:ring-2 hover:ring-blue-400 bg-white text-blue-900 border-blue-300 ${
                errors.password ? "border-red-500" : ""
              }`}
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-800 hover:bg-blue-900 cursor-pointer"} w-full text-white py-2 rounded-lg transition`}
          >
            {isSubmitting ? "Logging In..." : "Log In"}
          </button>

          {/* Create Account */}
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
        </form>
      </div>
    </div>
  );
};

export default Login;
