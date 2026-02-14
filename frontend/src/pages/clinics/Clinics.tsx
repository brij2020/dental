import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getAllClinics, deactivateClinic, getClinicActiveSubscription } from "./api";
import type { ClinicResponse } from "./api";
import {
  IconPlus,
  IconTrash,
  IconEdit,
  IconLoader,
  IconArrowUp,
  IconArrowDown,
} from "@tabler/icons-react";
import { toast } from "react-toastify";
import TablePagination from "../../components/TablePagination";
import TableOverlayLoader from "../../components/TableOverlayLoader";

type SortField = "name" | "phone" | "city" | "status";
type SortOrder = "asc" | "desc";

export default function Clinics() {
  const PAGE_SIZE = 10;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [clinics, setClinics] = useState<ClinicResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(searchParams.get("success") === "true");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [subscriptionMap, setSubscriptionMap] = useState<Record<string, string>>({});
  const hasFetchedOnceRef = useRef(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const useFullPageLoader = !hasFetchedOnceRef.current;
        if (useFullPageLoader) {
          setLoading(true);
        } else {
          setIsPageLoading(true);
        }
        const response = await getAllClinics({ page: currentPage, limit: PAGE_SIZE });
        const pageData = response?.data || [];
        const pagination = response?.pagination;
        setClinics(pageData);
        setTotalItems(pagination?.total ?? pageData.length);
        setTotalPages(Math.max(1, pagination?.pages ?? 1));
        if (pageData.length > 0) {
          const activeSubs: Record<string, string> = {};
          await Promise.all(
            pageData.map(async (clinic) => {
              try {
                const resp = await getClinicActiveSubscription(getClinicId(clinic));
                if (resp?.data?.data?.name_snapshot) {
                  activeSubs[getClinicId(clinic)] = resp.data.data.name_snapshot;
                } else {
                  activeSubs[getClinicId(clinic)] = "Free plan";
                }
              } catch (err) {
                activeSubs[getClinicId(clinic)] = "Free plan";
              }
            })
          );
          setSubscriptionMap(activeSubs);
        } else {
          setSubscriptionMap({});
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load clinics");
        setClinics([]);
        setTotalItems(0);
        setTotalPages(1);
      } finally {
        if (!hasFetchedOnceRef.current) {
          setLoading(false);
        } else {
          setIsPageLoading(false);
        }
        hasFetchedOnceRef.current = true;
      }
    };

    fetchClinics();
  }, [PAGE_SIZE, currentPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const processedClinics = useMemo(() => {
    const filtered = clinics.filter((clinic) => {
      const matchesSearch =
        searchTerm.trim() === "" ||
        clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (clinic.phone || "").includes(searchTerm) ||
        (clinic.address?.city || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (clinic.branding_moto || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCity =
        filterCity === "" ||
        (clinic.address?.city || "").toLowerCase() === filterCity.toLowerCase();

      const matchesStatus =
        filterStatus === "" || (clinic.status || "").toLowerCase() === filterStatus.toLowerCase();

      return matchesSearch && matchesCity && matchesStatus;
    });

    const sorted = [...filtered].sort((a, b) => {
      let aVal: string = "";
      let bVal: string = "";

      if (sortField === "city") {
        aVal = (a.address?.city || "").toLowerCase();
        bVal = (b.address?.city || "").toLowerCase();
      } else if (sortField === "name") {
        aVal = (a.name || "").toLowerCase();
        bVal = (b.name || "").toLowerCase();
      } else if (sortField === "phone") {
        aVal = (a.phone || "").toLowerCase();
        bVal = (b.phone || "").toLowerCase();
      } else if (sortField === "status") {
        aVal = (a.status || "").toLowerCase();
        bVal = (b.status || "").toLowerCase();
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [clinics, searchTerm, filterCity, filterStatus, sortField, sortOrder]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? 
      <IconArrowUp size={16} className="inline ml-1" /> : 
      <IconArrowDown size={16} className="inline ml-1" />;
  };

  const getClinicId = (clinic: ClinicResponse) => {
    return clinic.id || (clinic as any)._id;
  };

  const handleDelete = async (clinic: ClinicResponse) => {
    if (!confirm(`Are you sure you want to deactivate ${clinic.name}?`)) {
      return;
    }

    try {
      const clinicId = getClinicId(clinic);
      setDeleting(clinicId);
      await deactivateClinic(clinicId);
      if (clinics.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      } else {
        setClinics(clinics.filter(c => getClinicId(c) !== clinicId));
        setTotalItems(prev => Math.max(0, prev - 1));
      }
      toast.success(`${clinic.name} deactivated successfully`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to deactivate clinic";
      toast.error(errorMessage);
      console.error("Deactivate error:", err);
    } finally {
      setDeleting(null);
    }
  };

  const uniqueCities = useMemo(() => {
    const cities = clinics
      .map((c) => c.address?.city?.trim() || "")
      .filter((city) => city.length > 0);

    return Array.from(new Set(cities)).sort();
  }, [clinics]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Manage Clinics</h1>
            <p className="text-slate-600 mt-2">{totalItems} clinic{totalItems !== 1 ? "s" : ""} registered</p>
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

        {/* Filter + Table View */}
        <div className="mb-6 grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="text-xs uppercase tracking-wider text-slate-500">Search clinics</label>
            <input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, city, phone..."
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-slate-500">Filter city</label>
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            >
              <option value="">All cities</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-slate-500">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            >
              <option value="">All statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterCity("");
                setFilterStatus("");
              }}
              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 transition"
            >
              Clear filters
            </button>
          </div>
        </div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
          <span className="text-slate-600">
            Showing {processedClinics.length} of {totalItems} clinic{totalItems !== 1 ? "s" : ""}
          </span>
          {(filterCity || filterStatus || searchTerm) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterCity("");
                setFilterStatus("");
              }}
              className="text-sky-600 underline text-xs"
            >
              Reset filters
            </button>
          )}
        </div>

        {!loading && clinics.length > 0 && (
          <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
            <div className="relative overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort("name")}
                        className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors flex items-center"
                      >
                        Clinic Name
                        <SortIcon field="name" />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort("phone")}
                        className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors flex items-center"
                      >
                        Phone
                        <SortIcon field="phone" />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort("city")}
                        className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors flex items-center"
                      >
                        City
                        <SortIcon field="city" />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort("status")}
                        className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors flex items-center"
                      >
                        Status
                        <SortIcon field="status" />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <span className="font-semibold text-slate-900">Admin / Doctor</span>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <span className="font-semibold text-slate-900">Motto</span>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <span className="font-semibold text-slate-900">Subscription</span>
                    </th>
                    <th className="px-6 py-4 text-center">
                      <span className="font-semibold text-slate-900">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {processedClinics.map((clinic) => (
                    <tr key={getClinicId(clinic)} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-900">{clinic.name}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {clinic.phone}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {clinic.address?.city || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            clinic.status === "Active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {clinic.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {clinic.admin_staff_name || clinic.contact_name || "-"}
                      </td>
                      <td className="px-6 py-4 text-slate-600 truncate max-w-xs">
                        {clinic.branding_moto || "-"}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {subscriptionMap[getClinicId(clinic)] || "Free plan"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => navigate(`/clinics/${getClinicId(clinic)}/edit`)}
                            className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-indigo-300 text-indigo-600 rounded hover:bg-indigo-50 transition-colors"
                          >
                            <IconEdit size={16} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(clinic)}
                            disabled={deleting === getClinicId(clinic)}
                            className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deleting === getClinicId(clinic) ? (
                              <>
                                <IconLoader size={16} className="animate-spin" />
                                Deactivating...
                              </>
                            ) : (
                              <>
                                <IconTrash size={16} />
                                Deactivate
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {isPageLoading && <TableOverlayLoader />}
            </div>
          </div>
        )}
        {!loading && clinics.length > 0 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            isLoading={isPageLoading}
            onPageChange={setCurrentPage}
          />
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
