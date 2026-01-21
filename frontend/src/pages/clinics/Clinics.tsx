import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getAllClinics } from "./api";
import type { ClinicResponse } from "./api";
import {
  IconPlus,
  IconTrash,
  IconEdit,
  IconLoader,
  IconPhone,
  IconMapPin,
} from "@tabler/icons-react";

export default function Clinics() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [clinics, setClinics] = useState<ClinicResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(searchParams.get("success") === "true");

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        setLoading(true);
        const data = await getAllClinics();
        setClinics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load clinics");
      } finally {
        setLoading(false);
      }
    };

    fetchClinics();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Manage Clinics</h1>
            <p className="text-slate-600 mt-2">Create and manage clinics with their admin profiles</p>
          </div>
          <button
            onClick={() => navigate("/clinics/create")}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-md"
          >
            <IconPlus size={20} />
            Create Clinic
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">Clinic created successfully!</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center gap-4">
              <IconLoader size={40} className="animate-spin text-indigo-600" />
              <p className="text-slate-600">Loading clinics...</p>
            </div>
          </div>
        )}

        {/* Clinics Grid */}
        {!loading && clinics.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clinics.map((clinic) => (
              <div
                key={clinic.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-slate-200"
              >
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    {clinic.name}
                  </h3>
                  <p className="text-slate-600 text-sm line-clamp-2">
                    {clinic.branding_moto}
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-slate-700">
                    <IconPhone size={18} className="text-indigo-600 flex-shrink-0" />
                    <span className="text-sm">{clinic.phone}</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-700">
                    <IconMapPin size={18} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      {clinic.address?.city}, {clinic.address?.state}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        clinic.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {clinic.status}
                    </span>
                  </div>
                </div>

                <p className="text-slate-600 text-sm mb-6 line-clamp-2">
                  {clinic.description}
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => navigate(`/clinics/${clinic.id}/edit`)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-indigo-300 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
                  >
                    <IconEdit size={18} />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete ${clinic.name}?`)) {
                        // TODO: Implement delete functionality
                        console.log("Delete clinic:", clinic.id);
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
                  >
                    <IconTrash size={18} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && clinics.length === 0 && !error && (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <p className="text-slate-600 mb-4 text-lg">No clinics found</p>
              <button
                onClick={() => navigate("/clinics/create")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                <IconPlus size={20} />
                Create Your First Clinic
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
