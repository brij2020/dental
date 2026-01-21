import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  IconChevronLeft,
  IconDeviceFloppy,
  IconNumbers,
  IconReceiptTax,
  IconNote,
} from "@tabler/icons-react";
import { useAuth } from "../../../state/useAuth";
import { getFeeByClinicId, saveFee, updateFeeByClinicId } from "../../../lib/apiClient";

type Fee = {
  _id: string;
  clinic_id: string;
  cost_fees: number | null;
  gst_number: string | null;
  note: string | null;
};

export default function FeesPanel() {
  const { user } = useAuth();

  const [fee, setFee] = useState<Fee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [costFees, setCostFees] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [note, setNote] = useState("");

  const fetchFee = async () => {
    if (!user?.clinic_id) return;

    setIsLoading(true);

    try {
      const response = await getFeeByClinicId(user.clinic_id);
      
      if (response.data && response.data.data) {
        const feeData = response.data.data;
        setFee(feeData);
        setCostFees(feeData.cost_fees?.toString() ?? "");
        setGstNumber(feeData.gst_number ?? "");
        setNote(feeData.note ?? "");
      }
    } catch (error: any) {
      // 404 error is expected when no fee exists yet
      if (error.response?.status !== 404) {
        toast.error("Failed to fetch fee.");
        console.error(error);
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchFee();
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.clinic_id) return;

    const parsedCost = parseFloat(costFees);
    if (Number.isNaN(parsedCost) || parsedCost < 0) {
      toast.error("Please enter a valid fee amount.");
      return;
    }

    setIsSaving(true);

    const payload = {
      clinic_id: user.clinic_id,
      cost_fees: parsedCost,
      gst_number: gstNumber || null,
      note: note || null,
    };

    try {
      let response;
      if (fee) {
        // Update if record exists
        response = await updateFeeByClinicId(user.clinic_id, payload);
      } else {
        // Insert if not exists
        response = await saveFee(payload);
      }
      
      if (response.data && response.data.data) {
        setFee(response.data.data);
        toast.success("Fee settings saved.");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save fee.");
      console.error(error);
    }

    setIsSaving(false);
  };

  return (
    <div>
      <Link
        to="/settings"
        className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-4"
      >
        <IconChevronLeft className="h-5 w-5" />
        Back to Settings
      </Link>

      <div className="p-6 bg-white border rounded-2xl">
        <h2 className="text-lg font-semibold text-slate-800">Clinic Fees</h2>
        <p className="text-sm text-slate-500 mt-1">Set the fee for your clinic.</p>

        {isLoading ? (
          <div className="mt-6 text-slate-500 text-center">Loading fee...</div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Cost / Fees */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Cost / Fees
              </label>
              <div className="relative">
                <IconNumbers className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={costFees}
                  onChange={(e) => setCostFees(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
                  placeholder="500"
                />
              </div>
            </div>

            {/* GST */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                GST Number (Optional)
              </label>
              <div className="relative">
                <IconReceiptTax className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Note (Optional)
              </label>
              <div className="relative">
                <IconNote className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
                  placeholder="Any extra notes..."
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 text-white font-medium shadow-sm hover:brightness-105 disabled:opacity-60 transition"
              >
                <IconDeviceFloppy className="h-5 w-5" />
                {isSaving ? "Saving..." : "Save Fee"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
