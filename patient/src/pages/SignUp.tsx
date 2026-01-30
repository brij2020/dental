import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/apiClient";
import { states, stateCities } from "../services/locations";

type SignUpFormInputs = {
  full_name: string;
  gender: string;
  contact_number: string;
  age: number;
  date_of_birth: string;
  address: string;
  state: string;
  city: string;
  pincode: string;
  email: string;
  password: string;
};

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const [selectedState, setSelectedState] = React.useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SignUpFormInputs>({ mode: "onTouched" });

  const onSubmit = async (data: SignUpFormInputs) => {
    if(isSubmitting) return;
    
    try {
     
      const response: any = await api.post("/api/auth/patient-register", {
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        contact_number: data.contact_number,
        gender: data.gender,
        date_of_birth: data.date_of_birth,
        address: data.address,
        state: data.state,
        city: data.city,
        pincode: data.pincode,
        registration_type:'global'

      });

      console.log("📋 API Response:", response);

      if (!response.success) {
        console.error("Registration failed:", response.error);
        toast.error(response.error || "Registration failed");
        return;
      }

      // response.data contains the backend response (standardized by api client)
      const backendData = response.data;

      if (!backendData?.success) {
        toast.error(backendData?.message || response.error || "Registration failed");
        return;
      }

      // Support both shapes: { success: true, data: {...} } and legacy { success: true, token: ..., patient: {...} }
      const payload = backendData.data || {
        token: backendData.token,
        patient_id: backendData.patient?.id || backendData.patient?._id,
        email: backendData.patient?.email,
        full_name: backendData.patient?.full_name,
        uhid: backendData.patient?.uhid
      };

      console.log("✅ Registration successful:", payload);

      if (payload?.token) localStorage.setItem("authToken", payload.token);
      if (payload?.patient_id) localStorage.setItem("patient_id", payload.patient_id);
      if (payload?.email) localStorage.setItem("patient_email", payload.email);
      if (payload?.full_name) localStorage.setItem("patient_name", payload.full_name);
      if (payload?.uhid) localStorage.setItem("patient_uhid", payload.uhid);

      toast.success("Account created successfully!");
      reset();
      navigate("/");
    } catch (error: unknown) {
      console.error("Unexpected error:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
      }
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="flex h-screen">
      {/* Logo */}
      <div className="flex-1 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-200 flex items-center justify-center">
        <img src="/logo.png" alt="Logo" className="w-48 h-auto object-contain" />
      </div>

      {/* SignUp Form */}
      <div className="flex-1 bg-gradient-to-l from-blue-600 via-blue-400 to-blue-200 flex items-center justify-center">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white p-6 rounded-2xl shadow-2xl w-[85%] max-w-lg text-sm"
        >
          <h2 className="text-3xl font-bold mb-4 text-blue-900 text-center">
            Create Account
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="">
              <label className="block text-blue-900 font-semibold mb-1">
                Full Name
              </label>
              <input
                {...register("full_name", { required: "Name is required" })}
                placeholder="Enter name"
                className="w-full px-3 py-2 border rounded border-blue-300 focus:ring-2 focus:ring-blue-600"
              />
              {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
            </div>

            <div>
              <label className="block text-blue-900 font-semibold mb-1">
                Gender
              </label>
              <select
                {...register("gender", { required: "Select gender" })}
                className="w-full px-3 py-2 border rounded border-blue-300 focus:ring-2 focus:ring-blue-600"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
              {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>}
            </div>

            {/* <div>
              <label className="block text-blue-900 font-semibold mb-1">Age</label>
              <input
                type="number"
                {...register("age", { required: "Age required" })}
                placeholder="Age"
                className="w-full px-3 py-2 border rounded border-blue-300 focus:ring-2 focus:ring-blue-600"
              />
              {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age.message}</p>}
            </div> */}

            <div>
              <label className="block text-blue-900 font-semibold mb-1">
                Mobile
              </label>
              <input

                {...register("contact_number", { required: "Mobile number is required", minLength: 10, maxLength: 10 })}
                placeholder="Enter mobile"
                className="w-full px-3 py-2 border rounded border-blue-300 focus:ring-2 focus:ring-blue-600"
                minLength={10}
                maxLength={10}
              

              />
              {errors.contact_number && <p className="text-red-500 text-xs mt-1">{errors.contact_number.message}</p>}
            </div>

            <div>
              <label className="block text-blue-900 font-semibold mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                {...register("date_of_birth", { required: "DOB required" })}
                className="w-full px-3 py-2 border rounded border-blue-300 focus:ring-2 focus:ring-blue-600"
              />
              {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth.message}</p>}
            </div>

            <div>
              <label className="block text-blue-900 font-semibold mb-1">
                Address
              </label>
              <input
                type="text"
                {...register("address", { required: "Address required" })}
                placeholder="Full address"
                className="w-full px-3 py-2 border rounded border-blue-300 focus:ring-2 focus:ring-blue-600"
              />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
            </div>

            <div>
              <label className="block text-blue-900 font-semibold mb-1">State</label>
              <select
              {...register("state", { required: "State required" })}
               value={selectedState}
               onChange={(e) => setSelectedState(e.target.value)}
               className="w-full px-3 py-2 border rounded border-blue-300 focus:ring-2 focus:ring-blue-600"
               >
                <option value="">Select State</option>
                 {states.map((state) => (
                 <option key={state} value={state}>
                 {state}
                </option>
                ))}
             </select>

              {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
            </div>

            <div>
              <label className="block text-blue-900 font-semibold mb-1">City</label>
              <select
               {...register("city", { required: "City required" })}
               disabled={!selectedState}
              className="w-full px-3 py-2 border rounded border-blue-300 focus:ring-2 focus:ring-blue-600"
               >
              <option value="">Select City</option>
                {selectedState &&
                stateCities[selectedState]?.map((city) => (
              <option key={city} value={city}>
                  {city}
              </option>
               ))}
            </select>

              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
            </div>

            <div>
              <label className="block text-blue-900 font-semibold mb-1">
                Pincode
              </label>
              <input
                {...register("pincode", { required: "Pincode required", minLength: 6, maxLength: 6 })}
                placeholder="Pincode"
                className="w-full px-3 py-2 border rounded border-blue-300 focus:ring-2 focus:ring-blue-600"
                minLength={6}
                maxLength={6}
              />
              {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode.message}</p>}
            </div>

            <div>
              <label className="block text-blue-900 font-semibold mb-1">Email</label>
              <input
                type="email"
                {...register("email", { required: "Email required" })}
                placeholder="Enter email"
                className="w-full px-3 py-2 border rounded border-blue-300 focus:ring-2 focus:ring-blue-600"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-blue-900 font-semibold mb-1">
                Password
              </label>
              <input
                type="password"
                {...register("password", {
                  required: "Password required",
                  minLength: { value: 8, message: "Minimum 8 characters" },
                })}
                placeholder="Create password"
                className="w-full px-3 py-2 border rounded border-blue-300 focus:ring-2 focus:ring-blue-600"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-800 hover:bg-blue-900 cursor-pointer"} w-full mt-5 text-white py-2 rounded-lg transition`}
          >
            {isSubmitting ? "Please wait.." : "Sign Up"}
          </button>

          <p className="mt-5 text-center text-gray-700 text-sm">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-blue-700 hover:underline font-semibold"
            >
              Log In
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUp;