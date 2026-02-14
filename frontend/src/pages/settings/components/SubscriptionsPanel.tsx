import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  IconChevronLeft,
  IconPlus,
  IconPencil,
  IconX,
  IconDeviceFloppy,
} from "@tabler/icons-react";
import { useAuth } from "../../../state/useAuth";
import { createSubscription, getSubscriptions, updateSubscription } from "../../../lib/apiClient";

type Subscription = {
  _id?: string;
  id?: string;
  name: string;
  price: number;
  currency: string;
  duration_days: number;
  features?: string[];
  limits?: {
    max_doctors?: number;
    max_staff?: number;
    max_branches?: number;
    max_appointments?: number;
  };
  status?: "Active" | "Inactive";
  scope?: "global" | "clinic";
  clinic_id?: string | null;
};

type ModalMode = "add" | "edit";

export default function SubscriptionsPanel() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("add");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [durationDays, setDurationDays] = useState("30");
  const [featuresText, setFeaturesText] = useState("");
  const [maxDoctors, setMaxDoctors] = useState("");
  const [maxStaff, setMaxStaff] = useState("");
  const [maxBranches, setMaxBranches] = useState("");
  const [maxAppointments, setMaxAppointments] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getSubscriptions();
      setSubscriptions(response.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const resetForm = () => {
    setName("");
    setPrice("");
    setCurrency("INR");
    setDurationDays("30");
    setFeaturesText("");
    setMaxDoctors("");
    setMaxStaff("");
    setMaxBranches("");
    setMaxAppointments("");
    setStatus("Active");
    setEditingId(null);
  };

  const openAddModal = () => {
    setModalMode("add");
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (sub: Subscription) => {
    setModalMode("edit");
    setEditingId(sub._id || sub.id || null);
    setName(sub.name || "");
    setPrice(String(sub.price ?? ""));
    setCurrency(sub.currency || "INR");
    setDurationDays(String(sub.duration_days ?? 30));
    setFeaturesText((sub.features || []).join(", "));
    setMaxDoctors(String(sub.limits?.max_doctors ?? ""));
    setMaxStaff(String(sub.limits?.max_staff ?? ""));
    setMaxBranches(String(sub.limits?.max_branches ?? ""));
    setMaxAppointments(String(sub.limits?.max_appointments ?? ""));
    setStatus(sub.status || "Active");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    const parsedPrice = Number(price);
    const parsedDuration = Number(durationDays);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      toast.error("Price must be a valid number");
      return;
    }
    if (Number.isNaN(parsedDuration) || parsedDuration < 1) {
      toast.error("Duration must be a valid number of days");
      return;
    }

    const payload = {
      name: name.trim(),
      price: parsedPrice,
      currency: currency.trim() || "INR",
      duration_days: parsedDuration,
      features: featuresText.split(",").map(s => s.trim()).filter(Boolean),
      limits: {
        max_doctors: Number(maxDoctors) || 0,
        max_staff: Number(maxStaff) || 0,
        max_branches: Number(maxBranches) || 0,
        max_appointments: Number(maxAppointments) || 0,
      },
      status,
    };

    setIsSaving(true);
    try {
      if (modalMode === "add") {
        const response = await createSubscription(payload);
        setSubscriptions(prev => [response.data?.data, ...prev].filter(Boolean));
        toast.success("Subscription created");
      } else if (editingId) {
        const response = await updateSubscription(editingId, payload);
        setSubscriptions(prev =>
          prev.map(s => (s._id === editingId || s.id === editingId ? response.data?.data : s))
        );
        toast.success("Subscription updated");
      }
      closeModal();
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || err.message || "Failed to save subscription";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <Link to="/settings" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-4">
        <IconChevronLeft className="h-5 w-5" />
        Back to Settings
      </Link>

      <div className="p-6 bg-white border rounded-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Subscriptions</h2>
            <p className="text-sm text-slate-500 mt-1">
              {user?.role === "super_admin"
                ? "Create and manage global subscription plans."
                : "Create and manage clinic-specific subscription plans."}
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500"
          >
            <IconPlus className="h-4 w-4" />
            New Subscription
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <p className="text-sm text-slate-500">Loading subscriptions...</p>
          ) : subscriptions.length === 0 ? (
            <p className="text-sm text-slate-500">No subscriptions found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-2">Name</th>
                  <th className="py-2">Price</th>
                  <th className="py-2">Duration</th>
                  <th className="py-2">Limits</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map(sub => (
                  <tr key={sub._id || sub.id} className="border-b last:border-b-0">
                    <td className="py-3">{sub.name}</td>
                    <td className="py-3">{sub.currency} {sub.price}</td>
                    <td className="py-3">{sub.duration_days} days</td>
                    <td className="py-3">
                      <div className="text-xs text-slate-600">
                        Doctors: {sub.limits?.max_doctors || 0}, Staff: {sub.limits?.max_staff || 0},
                        Branches: {sub.limits?.max_branches || 0}, Appts: {sub.limits?.max_appointments || 0}
                      </div>
                    </td>
                    <td className="py-3">{sub.status}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => openEditModal(sub)}
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-500"
                      >
                        <IconPencil className="h-4 w-4" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                {modalMode === "add" ? "Create Subscription" : "Edit Subscription"}
              </h3>
              <button onClick={closeModal} className="text-slate-500 hover:text-slate-700">
                <IconX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500">Name</label>
                <input
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Price</label>
                <input
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Currency</label>
                <input
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Duration (days)</label>
                <input
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-500">Features (comma-separated)</label>
                <input
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Max Doctors</label>
                <input
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  value={maxDoctors}
                  onChange={(e) => setMaxDoctors(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Max Staff</label>
                <input
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  value={maxStaff}
                  onChange={(e) => setMaxStaff(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Max Branches</label>
                <input
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  value={maxBranches}
                  onChange={(e) => setMaxBranches(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Max Appointments / Month</label>
                <input
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  value={maxAppointments}
                  onChange={(e) => setMaxAppointments(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Status</label>
                <select
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "Active" | "Inactive")}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:opacity-60"
                >
                  <IconDeviceFloppy className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
