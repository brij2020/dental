import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createClinic } from "./api";
import type { ClinicFormData } from "./api";
import { IconArrowLeft, IconLoader } from "@tabler/icons-react";

// Helper function to generate random password (8-16 characters)
const generatePassword = (): string => {
  const length = Math.floor(Math.random() * (16 - 8 + 1)) + 8; // Random length between 8 and 16
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

export default function CreateClinic() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ClinicFormData>({
    name: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      postal_code: "",
      country: "India",
    },
    branding_moto: "",
    location: {
      latitude: 0,
      longitude: 0,
    },
    description: "",
    status: "Active",
    adminProfile: {
      email: "",
      mobile_number: "",
      password: generatePassword(), // Initialize with auto-generated password
      full_name: "",
      role: "admin",
      status: "Active",
      slot_duration_minutes: 20,
      education: [],
      qualification: "",
      specialization: "",
      availability: {},
    },
  });

  const handleClinicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof ClinicFormData] as Record<string, any>),
          [child]: isNaN(Number(value)) ? value : Number(value),
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleAdminChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        adminProfile: {
          ...prev.adminProfile,
          [parent]: {
            ...(prev.adminProfile[parent as keyof typeof formData.adminProfile] as Record<string, any>),
            [child]: isNaN(Number(value)) ? value : Number(value),
          },
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        adminProfile: {
          ...prev.adminProfile,
          [name]: value,
        },
      }));
    }
  };

  // Helper function to generate random password (8-16 characters)
  const generatePasswordLocal = (): string => {
    const length = Math.floor(Math.random() * (16 - 8 + 1)) + 8; // Random length between 8 and 16
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Basic validation
      if (!formData.name.trim()) {
        throw new Error("Clinic name is required");
      }
      if (!formData.adminProfile.email.trim()) {
        throw new Error("Admin email is required");
      }
      if (!formData.adminProfile.full_name.trim()) {
        throw new Error("Admin full name is required");
      }

      // Prepare data - clean up empty arrays and empty strings
      const dataToSubmit = {
        ...formData,
        adminProfile: {
          ...formData.adminProfile,
          // Password is already in form state (auto-generated, user can regenerate)
          // Always set role to admin for clinic creation
          role: "admin",
          // Remove empty arrays
          education: Array.isArray(formData.adminProfile.education) && formData.adminProfile.education.length > 0 
            ? formData.adminProfile.education 
            : undefined,
          // Only include non-empty strings
          qualification: formData.adminProfile.qualification?.trim() || undefined,
          specialization: formData.adminProfile.specialization?.trim() || undefined,
          bio: formData.adminProfile.bio?.trim() || undefined,
        }
      };

      await createClinic(dataToSubmit);
      navigate("/clinics?success=true");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create clinic");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/clinics")}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4 transition-colors"
          >
            <IconArrowLeft size={20} />
            Back to Clinics
          </button>
          <h1 className="text-4xl font-bold text-slate-900">Create New Clinic</h1>
          <p className="text-slate-600 mt-2">Set up a new clinic with its admin profile</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Clinic Information Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6">Clinic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Clinic Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleClinicChange}
                  placeholder="e.g., Apollo Dental Clinic"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleClinicChange}
                  placeholder="9876543210"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Branding Motto
                </label>
                <input
                  type="text"
                  name="branding_moto"
                  value={formData.branding_moto}
                  onChange={handleClinicChange}
                  placeholder="e.g., Your Smile is Our Priority"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleClinicChange}
                  placeholder="Describe your clinic..."
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleClinicChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6">Address</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleClinicChange}
                  placeholder="123 Main Street"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleClinicChange}
                  placeholder="Mumbai"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  State
                </label>
                <input
                  type="text"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleClinicChange}
                  placeholder="Maharashtra"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Postal Code
                </label>
                <input
                  type="text"
                  name="address.postal_code"
                  value={formData.address.postal_code}
                  onChange={handleClinicChange}
                  placeholder="400001"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  name="address.country"
                  value={formData.address.country}
                  onChange={handleClinicChange}
                  placeholder="India"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  name="location.latitude"
                  value={formData.location.latitude}
                  onChange={handleClinicChange}
                  placeholder="19.0760"
                  step="0.0001"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  name="location.longitude"
                  value={formData.location.longitude}
                  onChange={handleClinicChange}
                  placeholder="72.8777"
                  step="0.0001"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Admin Profile Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6">Admin Profile</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.adminProfile.full_name}
                  onChange={handleAdminChange}
                  placeholder="Dr. Mohit Sharma"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.adminProfile.email}
                  onChange={handleAdminChange}
                  placeholder="admin@clinic.com"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  name="mobile_number"
                  value={formData.adminProfile.mobile_number}
                  onChange={handleAdminChange}
                  placeholder="9876543223"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Auto-Generated Password
                  <span className="text-xs text-slate-500 ml-1">(8-16 characters)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.adminProfile.password}
                    readOnly
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newPassword = generatePasswordLocal();
                      setFormData(prev => ({
                        ...prev,
                        adminProfile: {
                          ...prev.adminProfile,
                          password: newPassword
                        }
                      }));
                    }}
                    className="px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg font-medium hover:bg-indigo-200 transition-colors"
                  >
                    Regenerate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Qualification
                </label>
                <select
                  name="qualification"
                  value={(formData.adminProfile as any).qualification || ""}
                  onChange={handleAdminChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Qualification</option>
                  <option value="BDS">BDS (Bachelor of Dental Surgery)</option>
                  <option value="MDS">MDS (Master of Dental Surgery)</option>
                  <option value="PhD">PhD in Dentistry</option>
                  <option value="PGDIP">PGDIP (Post Graduate Diploma)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Specialization
                </label>
                <select
                  name="specialization"
                  value={(formData.adminProfile as any).specialization || ""}
                  onChange={handleAdminChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Specialization</option>
                  <option value="General Dentistry">General Dentistry</option>
                  <option value="Orthodontics">Orthodontics</option>
                  <option value="Periodontics">Periodontics</option>
                  <option value="Endodontics">Endodontics</option>
                  <option value="Prosthodontics">Prosthodontics</option>
                  <option value="Oral Surgery">Oral Surgery</option>
                  <option value="Pediatric Dentistry">Pediatric Dentistry</option>
                  <option value="Cosmetic Dentistry">Cosmetic Dentistry</option>
                  <option value="Implantology">Implantology</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.adminProfile.bio || ""}
                  onChange={handleAdminChange}
                  placeholder="Professional bio..."
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate("/clinics")}
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors flex items-center gap-2"
            >
              {loading && <IconLoader size={20} className="animate-spin" />}
              {loading ? "Creating..." : "Create Clinic"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
