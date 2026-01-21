import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getClinicInfo, updateClinic } from "./api";
import type { ClinicFormData, ClinicResponse } from "./api";
import { IconArrowLeft, IconLoader } from "@tabler/icons-react";
import { toast } from "react-toastify";

export default function EditClinic() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clinic, setClinic] = useState<ClinicResponse | null>(null);

  const [formData, setFormData] = useState<Partial<ClinicFormData>>({
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
  });

  // Fetch clinic data on mount
  useEffect(() => {
    const fetchClinic = async () => {
      try {
        if (!id) throw new Error("Clinic ID is required");
        setLoading(true);
        const data = await getClinicInfo(id);
        setClinic(data);
        setFormData({
          name: data.name,
          phone: data.phone,
          address: data.address,
          branding_moto: data.branding_moto,
          location: data.location,
          description: data.description,
          status: data.status,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load clinic";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchClinic();
  }, [id]);

  const handleClinicChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof formData] as Record<string, any>),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (!clinic?.id) throw new Error("Clinic ID is required");
      if (!formData.name?.trim()) {
        throw new Error("Clinic name is required");
      }

      await updateClinic(clinic.id, formData);
      toast.success("Clinic updated successfully!");
      navigate("/clinics?success=true");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update clinic";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <IconLoader size={40} className="animate-spin text-indigo-600" />
          <p className="text-slate-600">Loading clinic...</p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-4xl font-bold text-slate-900">Edit Clinic</h1>
          <p className="text-slate-600 mt-2">{clinic?.name}</p>
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
                  value={formData.name || ""}
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
                  value={formData.phone || ""}
                  onChange={handleClinicChange}
                  placeholder="9876543210"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status || "Active"}
                  onChange={handleClinicChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Branding Motto
                </label>
                <input
                  type="text"
                  name="branding_moto"
                  value={formData.branding_moto || ""}
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
                  value={formData.description || ""}
                  onChange={handleClinicChange}
                  placeholder="Describe your clinic..."
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Address Information Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6">Address Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address?.street || ""}
                  onChange={handleClinicChange}
                  placeholder="Street address"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  name="address.city"
                  value={formData.address?.city || ""}
                  onChange={handleClinicChange}
                  placeholder="City"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  name="address.state"
                  value={formData.address?.state || ""}
                  onChange={handleClinicChange}
                  placeholder="State"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Postal Code
                </label>
                <input
                  type="text"
                  name="address.postal_code"
                  value={formData.address?.postal_code || ""}
                  onChange={handleClinicChange}
                  placeholder="Postal code"
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
                  value={formData.address?.country || ""}
                  onChange={handleClinicChange}
                  placeholder="Country"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Location Information Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6">Location Coordinates</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  name="location.latitude"
                  value={formData.location?.latitude || ""}
                  onChange={handleClinicChange}
                  placeholder="Latitude"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  name="location.longitude"
                  value={formData.location?.longitude || ""}
                  onChange={handleClinicChange}
                  placeholder="Longitude"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <>
                  <IconLoader size={20} className="animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate("/clinics")}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
