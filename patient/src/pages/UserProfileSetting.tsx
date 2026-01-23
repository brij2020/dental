// import React, { useState, useEffect } from "react";
// import OtpModal from "../Components/OtpModal";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import Input from "../Components/input";
// import CustomModal from "@/Components/CustomModal";
// import { supabase } from "@/lib/supabaseClient";
// import { useProfile } from "@/hooks/useProfile";
// import Loading from "@/Components/Loading";

// function validateEmail(email: string) {
//   return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
// }

// function validateMobile(mobile: string) {
//   // Indian mobile: 10 digits, starts with 6-9
//   return /^[6-9]\d{9}$/.test(mobile);
// }

// const ProfileSettings: React.FC = () => {
//   const { profile, loading } = useProfile();

//   const [profileImage, setProfileImage] = useState<string | null>(null);
//   const [name, setName] = useState("");
//   const [address, setAddress] = useState("");
//   const [city, setCity] = useState("");
//   const [state, setState] = useState("");
//   const [pin, setPin] = useState("");
//   const [mobile, setMobile] = useState("");
//   const [email, setEmail] = useState("");
//   const [otpModalOpen, setOtpModalOpen] = useState(false);
//   const [mobileVerified, setMobileVerified] = useState(true);
//   const [mobileInput, setMobileInput] = useState("");
//   const [errors, setErrors] = useState<{ [key: string]: string }>({});

//   useEffect(() => {
//     if (profile) {
//       setName(profile.full_name || "");
//       setAddress(profile.address || "");
//       setCity(profile.city || "");
//       setState(profile.state || "");
//       setPin(profile.pincode || "");
//       setMobile(profile.contact_number || "");
//       setMobileInput(profile.contact_number || "");
//       setEmail(profile.email || "");
//       setProfileImage(profile.avatar || null);
//       setMobileVerified(true);
//     }
//   }, [profile]);

//   const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       const reader = new FileReader();
//       reader.onload = (ev) => {
//         setProfileImage(ev.target?.result as string);
//       };
//       reader.readAsDataURL(e.target.files[0]);
//     }
//   };

//   const handleRemoveImage = () => {
//     setProfileImage(null);
//   };

//   const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value.replace(/\D/g, "");
//     setMobileInput(value);
//     setMobileVerified(false);
//   };

//   const handleVerifyOtp = () => {
//     const mobileError =
//       !mobileInput.trim() || !validateMobile(mobileInput)
//         ? "Mobile must be a valid 10-digit Indian number starting with 6-9."
//         : "";
//     setErrors((prev) => ({ ...prev, mobile: mobileError }));
//     if (!mobileError) {
//       setOtpModalOpen(true);
//     }
//   };

//   const handleOtpVerified = () => {
//     setMobile(mobileInput);
//     setMobileVerified(true);
//   };

//   const validate = () => {
//     const newErrors: { [key: string]: string } = {};
//     if (!name.trim()) newErrors.name = "Name is required.";
//     if (!address.trim()) newErrors.address = "Address is required.";
//     if (!city.trim()) newErrors.city = "City is required.";
//     if (!state.trim()) newErrors.state = "State is required.";
//     if (!pin.trim() || pin.length < 5 || !/^[0-9]+$/.test(pin))
//       newErrors.pin = "PIN must be at least 5 digits.";
//     if (!mobileInput.trim() || !validateMobile(mobileInput))
//       newErrors.mobile =
//         "Mobile must be a valid 10-digit Indian number starting with 6-9.";
//     if (!email.trim() || !validateEmail(email))
//       newErrors.email = "Invalid email address.";
//     return newErrors;
//   };

//   const handleSave = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const validationErrors = validate();
//     setErrors(validationErrors);

//     if (Object.keys(validationErrors).length === 0) {
//       if (!mobileVerified) {
//         toast.error("Please verify your mobile number before saving.");
//         return;
//       }

//       try {
//         const { error } = await supabase
//           .from("patients")
//           .update({
//             full_name: name,
//             address,
//             city,
//             state,
//             pincode: pin,
//             contact_number: mobile,
//             email,
//             avatar: profileImage,
//             updated_at: new Date().toISOString(),
//           })
//           .eq("id", profile?.id);

//         if (error) throw error;

//         toast.success("Profile updated successfully!");
//       } catch (err) {
//         console.error("Error updating profile:", err);
//         toast.error("Error updating profile. Please try again.");
//       }
//     }
//   };

//   const getInitial = () => {
//     return name.trim() ? name.trim()[0].toUpperCase() : "?";
//   };

//   if (loading) {
//     return (
//       <Loading size={"500px"}/>
//     );
//   }

//   if (!profile) {
//     return (
//       <div className="flex justify-center items-center h-64 text-gray-500 text-lg">
//         No profile found.
//       </div>
//     );
//   }

//   return (
//     <div className="h-full flex flex-col justify-center items-center overflow-hidden">
//       <form
//         onSubmit={handleSave}
//         className="bg-white rounded-sm flex flex-col md:flex-row w-full max-w-4xl p-5 gap-12 border border-gray-300"
//         noValidate
//       >
//         {/* Profile Image Section */}
//         <div className="flex flex-col items-center">
//           <div className="relative w-32 h-32 mb-2 flex items-center justify-center ">
//             {profileImage ? (
//               <img
//                 src={profileImage}
//                 alt="Profile"
//                 className="w-24 h-24 rounded-full object-cover border-4 border-cyan-700 shadow"
//               />
//             ) : (
//               <div className="w-24 h-24 rounded-full bg-blue-100 border-4 border-cyan-700 shadow flex items-center justify-center text-4xl font-bold text-cyan-700">
//                 {getInitial()}
//               </div>
//             )}
//             <label htmlFor="profile-image-upload">
//               <div className="absolute w-8 h-8 bottom-4 right-4 bg-blue-600 rounded-full p-2 cursor-pointer flex items-center justify-center hover:scale-110 transition-all duration-300">
//                 <span className="material-symbols-sharp text-white text-base">
//                   photo_camera
//                 </span>
//               </div>
//               <Input
//                 id="profile-image-upload"
//                 type="file"
//                 accept="image/*"
//                 className="hidden"
//                 onChange={handleProfileImageChange}
//               />
//             </label>
//             {profileImage && (
//               <button
//                 type="button"
//                 className="absolute w-8 h-8 top-4 right-4 bg-white border rounded-full p-2 cursor-pointer flex items-center justify-center hover:scale-110 transition-all duration-300"
//                 onClick={handleRemoveImage}
//                 title="Remove image"
//               >
//                 <span className="material-symbols-sharp font-bold text-red-600 text-base">
//                   close_small
//                 </span>
//               </button>
//             )}
//           </div>
//         </div>

//         {/* Form Section */}
//         <div className="flex-1 flex flex-col gap-4">
//           {/* Name & Address */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//             <div>
//               <Input
//                 id="name"
//                 label={<span className="block text-gray-500 text-sm mb-0.5">Name</span>}
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//                 className={`w-full p-2 border rounded-sm bg-gray-50 text-sm outline-none ${
//                   errors.name ? "border-red-400" : "border-gray-300"
//                 }`}
//               />
//               {errors.name && <div className="text-red-500 text-xs mt-1">{errors.name}</div>}
//             </div>
//             <div>
//               <Input
//                 id="address"
//                 label={<span className="block text-gray-500 text-sm mb-0.5">Address</span>}
//                 value={address}
//                 onChange={(e) => setAddress(e.target.value)}
//                 className={`w-full p-2 border rounded-sm bg-gray-50 text-sm outline-none ${
//                   errors.address ? "border-red-400" : "border-gray-300"
//                 }`}
//               />
//               {errors.address && <div className="text-red-500 text-xs mt-1">{errors.address}</div>}
//             </div>
//           </div>

//           {/* City, State, Pin */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//             <div>
//               <Input
//                 id="city"
//                 label={<span className="block text-gray-500 text-sm mb-0.5">City</span>}
//                 value={city}
//                 onChange={(e) => setCity(e.target.value)}
//                 className={`w-full p-2 border rounded-sm bg-gray-50 text-sm outline-none ${
//                   errors.city ? "border-red-400" : "border-gray-300"
//                 }`}
//               />
//               {errors.city && <div className="text-red-500 text-xs mt-1">{errors.city}</div>}
//             </div>
//             <div>
//               <Input
//                 id="state"
//                 label={<span className="block text-gray-500 text-sm mb-0.5">State</span>}
//                 value={state}
//                 onChange={(e) => setState(e.target.value)}
//                 className={`w-full p-2 border rounded-sm bg-gray-50 text-sm outline-none ${
//                   errors.state ? "border-red-400" : "border-gray-300"
//                 }`}
//               />
//               {errors.state && <div className="text-red-500 text-xs mt-1">{errors.state}</div>}
//             </div>
//             <div>
//               <Input
//                 id="pin"
//                 label={<span className="block text-gray-500 text-sm mb-0.5">PIN</span>}
//                 value={pin}
//                 onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
//                 className={`w-full p-2 border rounded-sm bg-gray-50 text-sm outline-none ${
//                   errors.pin ? "border-red-400" : "border-gray-300"
//                 }`}
//                 maxLength={6}
//               />
//               {errors.pin && <div className="text-red-500 text-xs mt-1">{errors.pin}</div>}
//             </div>
//           </div>

//           {/* Mobile & Email */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
//             <div className="flex flex-col">
//               <label className="block text-gray-500 text-sm mb-0.5">Mobile Number</label>
//               <div className="flex gap-2 items-center">
//                 <div className="w-full">
//                   <Input
//                     id="mobile"
//                     value={mobileInput}
//                     onChange={handleMobileChange}
//                     className={`w-full p-2 border rounded-sm bg-gray-50 text-sm outline-none ${
//                       errors.mobile ? "border-red-400" : "border-gray-300"
//                     }`}
//                     maxLength={10}
//                   />
//                 </div>
//                 <button
//                   type="button"
//                   className={`rounded-sm p-2.5 px-3 text-white text-xs font-medium transition whitespace-nowrap ${
//                     mobileVerified
//                       ? "bg-green-600 cursor-default"
//                       : "bg-blue-900 hover:bg-blue-700"
//                   }`}
//                   onClick={handleVerifyOtp}
//                   disabled={mobileVerified}
//                 >
//                   {mobileVerified ? "Verified" : "Verify OTP"}
//                 </button>
//               </div>
//               {errors.mobile && (
//                 <div className="text-red-500 text-xs mt-1">{errors.mobile}</div>
//               )}
//             </div>

//             <div>
//               <Input
//                 id="email"
//                 type="email"
//                 label={<span className="block text-gray-500 text-sm mb-0.5">Email</span>}
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 className={`w-full p-2 border rounded-sm bg-gray-50 text-sm outline-none ${
//                   errors.email ? "border-red-400" : "border-gray-300"
//                 }`}
//               />
//               {errors.email && (
//                 <div className="text-red-500 text-xs mt-1">{errors.email}</div>
//               )}
//             </div>
//           </div>

//           <div className="flex justify-end mt-4">
//             <button
//               type="submit"
//               className="bg-cyan-800 text-white hover:bg-cyan-700 py-2 px-8 font-medium text-sm rounded-sm"
//             >
//               Save Changes
//             </button>
//           </div>
//         </div>
//       </form>

//       {/* OTP Modal */}
//       <CustomModal openModal={otpModalOpen} setOpenModal={setOtpModalOpen}>
//         <OtpModal
//           isOpen={otpModalOpen}
//           onClose={() => setOtpModalOpen(false)}
//           onVerified={handleOtpVerified}
//         />
//       </CustomModal>

//       <ToastContainer position="top-right" autoClose={3000} />
//     </div>
//   );
// };

// export default ProfileSettings;

import React from 'react'

const UserProfileSetting = () => {
  return (
    <div>
      UserProfileSetting Page
    </div>
  )
}

export default UserProfileSetting
