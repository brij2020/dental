// src/features/consultation/components/Procedure.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import type { TreatmentProcedureRow } from '../types';

type Props = {
  onSaveAndContinue: () => void;
  isSaving: boolean;
  consultationId: string;
};

export default function Procedure({ onSaveAndContinue, isSaving, consultationId }: Props) {
  const [procedures, setProcedures] = useState<TreatmentProcedureRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inline edit state
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [draftCost, setDraftCost] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProcedures() {
      if (!consultationId) return;
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('treatment_procedures')
          .select('*')
          .eq('consultation_id', consultationId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setProcedures(data || []);
      } catch (e: any) {
        console.error('Failed to fetch procedures:', e);
        setError('Could not load procedures.');
      } finally {
        setLoading(false);
      }
    }

    fetchProcedures();
  }, [consultationId]);

  // Total: treat null as 0
  const totalCost = procedures.reduce((acc, item) => acc + (item.cost ?? 0), 0);

  const formatArray = (arr: string[] | null) => (arr && arr.length ? arr.join(', ') : 'N/A');

  // --- Inline edit helpers ---
  const startEdit = (id: string, current: number | null) => {
    setEditing(prev => ({ ...prev, [id]: true }));
    setDraftCost(prev => ({ ...prev, [id]: current == null ? '' : String(current) }));
    setSaveError(null);
  };

  const cancelEdit = (id: string) => {
    setEditing(prev => ({ ...prev, [id]: false }));
    setDraftCost(prev => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    setSaveError(null);
  };

  const saveCost = async (id: string) => {
    const raw = draftCost[id] ?? '';
    const newCost = raw.trim() === '' ? null : Number(raw);

    if (newCost != null && (Number.isNaN(newCost) || newCost < 0)) {
      setSaveError('Enter a valid non-negative amount or leave blank.');
      return;
    }

    try {
      setSavingId(id);
      setSaveError(null);

      const { error } = await supabase
        .from('treatment_procedures')
        .update({ cost: newCost })
        .eq('id', id)
        .select('id, cost')
        .single();

      if (error) throw error;

      // Update local state so UI is instant
      setProcedures(prev => prev.map(p => (p.id === id ? { ...p, cost: newCost ?? 0 } : p)));
      cancelEdit(id);
    } catch (e: any) {
      console.error('Failed to save cost:', e);
      setSaveError(e?.message ?? 'Failed to save.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
      <h2 className="text-xl font-semibold text-slate-800">Treatment Procedure</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-500">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 rounded-t-lg">
            <tr>
              <th scope="col" className="px-6 py-3">Tooth Number</th>
              <th scope="col" className="px-6 py-3">Tooth Problem(s)</th>
              <th scope="col" className="px-6 py-3">Tooth Solution(s)</th>
              <th scope="col" className="px-6 py-3 text-right">Treatment Cost (₹)</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center px-6 py-4 text-slate-500">Loading procedures...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={4} className="text-center px-6 py-4 text-red-500">{error}</td>
              </tr>
            ) : procedures.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center px-6 py-4 text-slate-500">No procedures added yet.</td>
              </tr>
            ) : (
              procedures.map((procedure) => (
                <tr key={procedure.id} className="bg-white border-b">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {procedure.tooth_number}
                  </td>
                  <td className="px-6 py-4">{formatArray(procedure.problems)}</td>
                  <td className="px-6 py-4">{formatArray(procedure.solutions)}</td>

                  <td className="px-6 py-4 text-right font-semibold">
                    {editing[procedure.id] ? (
                      <div className="flex items-center justify-end gap-2">
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          placeholder="—"
                          className="w-28 rounded-md border border-slate-300 px-2 py-1 text-right"
                          value={draftCost[procedure.id] ?? ''}
                          onChange={(e) =>
                            setDraftCost(prev => ({ ...prev, [procedure.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveCost(procedure.id);
                            if (e.key === 'Escape') cancelEdit(procedure.id);
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => saveCost(procedure.id)}
                          disabled={savingId === procedure.id}
                          className="px-2 py-1 rounded-md bg-emerald-600 text-white text-xs disabled:opacity-50"
                        >
                          {savingId === procedure.id ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelEdit(procedure.id)}
                          className="px-2 py-1 rounded-md border border-slate-300 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="underline text-indigo-600 hover:text-indigo-700"
                        onClick={() => startEdit(procedure.id, procedure.cost ?? null)}
                        title={procedure.cost == null ? 'Add cost' : 'Edit cost'}
                      >
                        {procedure.cost == null
                          ? 'Add'
                          : Number(procedure.cost).toLocaleString('en-IN')}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>

          <tfoot>
            <tr className="font-semibold text-slate-900">
              <td colSpan={3} className="px-6 py-3 text-right">Total Cost</td>
              <td className="px-6 py-3 text-right text-lg">
                ₹{totalCost.toLocaleString('en-IN')}
              </td>
            </tr>
            {saveError && (
              <tr>
                <td colSpan={4} className="px-6 pb-3 text-right text-sm text-red-600">
                  {saveError}
                </td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 font-semibold text-white transition bg-gradient-to-r from-indigo-600 to-sky-500 rounded-xl shadow-sm hover:brightness-105 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={onSaveAndContinue}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save & Continue'}
        </button>
      </div>
    </div>
  );
}
