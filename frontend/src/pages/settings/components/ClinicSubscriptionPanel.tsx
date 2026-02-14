import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { IconChevronLeft } from "@tabler/icons-react";
import {
  getActiveClinicSubscription,
  getClinicSubscriptionHistory,
  getSubscriptions,
  purchaseClinicSubscription,
} from "../../../lib/apiClient";

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

export default function ClinicSubscriptionPanel() {
  const [available, setAvailable] = useState<Subscription[]>([]);
  const [activeSub, setActiveSub] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [subsResp, activeResp, historyResp] = await Promise.all([
        getSubscriptions(),
        getActiveClinicSubscription(),
        getClinicSubscriptionHistory(),
      ]);
      setAvailable(subsResp.data?.data || []);
      setActiveSub(activeResp.data?.data || null);
      setHistory(historyResp.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePurchase = async (subscriptionId: string) => {
    setPurchasingId(subscriptionId);
    try {
      await purchaseClinicSubscription({ subscription_id: subscriptionId });
      toast.success("Subscription purchased");
      await fetchData();
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || err.message || "Failed to purchase subscription";
      toast.error(msg);
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <div>
      <Link to="/settings" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-4">
        <IconChevronLeft className="h-5 w-5" />
        Back to Settings
      </Link>

      <div className="p-6 bg-white border rounded-2xl">
        <h2 className="text-lg font-semibold text-slate-800">Subscription Plan</h2>
        <p className="text-sm text-slate-500 mt-1">Purchase and manage your clinic subscription.</p>

        {loading ? (
          <p className="text-sm text-slate-500 mt-4">Loading...</p>
        ) : (
          <>
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-slate-700">Active Plan</h3>
              {activeSub ? (
                <div className="mt-2 rounded-lg border p-3 text-sm">
                  <div className="font-medium">{activeSub.name_snapshot}</div>
                  <div className="text-slate-500">
                    {activeSub.currency_snapshot} {activeSub.price_snapshot} | Ends {new Date(activeSub.end_date).toLocaleDateString()}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 mt-2">No active subscription.</p>
              )}
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-700">Available Plans</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                {available
                  .filter(s => s.status === "Active")
                  .map(sub => (
                    <div key={sub._id || sub.id} className="border rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold">{sub.name}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            {sub.currency} {sub.price} / {sub.duration_days} days
                          </div>
                        </div>
                        <button
                          className="text-xs px-3 py-1 rounded-md bg-indigo-600 text-white disabled:opacity-60"
                          onClick={() => handlePurchase(sub._id || sub.id || "")}
                          disabled={purchasingId === (sub._id || sub.id || "")}
                        >
                          {purchasingId === (sub._id || sub.id || "") ? "Processing..." : "Purchase"}
                        </button>
                      </div>
                      <div className="text-xs text-slate-600 mt-2">
                        Limits: Doctors {sub.limits?.max_doctors || 0}, Staff {sub.limits?.max_staff || 0},
                        Branches {sub.limits?.max_branches || 0}, Appts {sub.limits?.max_appointments || 0}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {history.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-700">History</h3>
                <div className="mt-2 text-xs text-slate-600">
                  {history.map(h => (
                    <div key={h._id} className="py-1 border-b last:border-b-0">
                      {h.name_snapshot} • {h.currency_snapshot} {h.price_snapshot} • {new Date(h.start_date).toLocaleDateString()} - {new Date(h.end_date).toLocaleDateString()}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
