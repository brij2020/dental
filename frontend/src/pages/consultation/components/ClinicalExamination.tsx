// src/features/consultation/components/ClinicalExamination.tsx

import React, { useState, useEffect } from 'react'; // <-- Import useEffect
import DentalChart from './dental-chart/DentalChart';
import type { TreatmentProcedureRow } from '../types';
import { getAdultDisplayNumber, getChildDisplayNumber, normalizeToothNumber } from './dental-chart/toothNumbers';
import { deleteTreatmentProcedure, getTreatmentProceduresByConsultationId, updateTreatmentProcedure } from '../../../lib/apiClient';
import { toast } from 'react-toastify';
import { IconPencil, IconTrash, IconX } from '@tabler/icons-react';

type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
};

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(({ id, label, ...props }, ref) => (
  <div>
    <label htmlFor={id} className="block text-sm font-semibold text-slate-800 mb-2">
      {label}
    </label>
    <textarea
      id={id}
      ref={ref}
      className="w-full py-3 px-4 text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-300 placeholder:text-slate-400"
      {...props}
    />
  </div>
));

export type ClinicalExaminationData = {
    chiefComplaints: string;
    onExamination: string;
    advice: string;
    notes: string;
};

type Props = {
  onSaveAndContinue: (data: ClinicalExaminationData) => void;
  isSaving: boolean;
  initialData: ClinicalExaminationData | null;
  consultationId: string;
  clinicId: string;
  procedures?: TreatmentProcedureRow[];
  onProcedureCreated?: (procedures: TreatmentProcedureRow | TreatmentProcedureRow[]) => void;
};

export default function ClinicalExamination({
  onSaveAndContinue,
  isSaving,
  initialData,
  consultationId,
  clinicId,
  procedures = [],
  onProcedureCreated,
}: Props) {
  const formatToothForDisplay = (toothValue: unknown) => {
    const numeric = Number(toothValue);
    if (!Number.isFinite(numeric)) return '—';

    // In treatment_procedures, tooth_number is stored as internal normalized index.
    // Use it directly to avoid re-normalization collisions (e.g., 27 should render as 43).
    const normalized = (numeric >= 1 && numeric <= 52) ? numeric : normalizeToothNumber(numeric);
    if (normalized == null) return String(toothValue);

    return normalized <= 32
      ? String(getAdultDisplayNumber(normalized))
      : String(getChildDisplayNumber(normalized));
  };

  const [formData, setFormData] = useState<ClinicalExaminationData>({
    chiefComplaints: '',
    onExamination: '',
    advice: '',
    notes: '',
  });
  const [consultationData, setData] = useState<ClinicalExaminationData | null>(null); 
  // NEW: This effect syncs the component's state with the initial data
  // when it's passed from the parent component.
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSaveAndContinue(formData);
  };
  const setConsultationData = (data: ClinicalExaminationData) => {
    setData(data);
  };
  const [displayProcedures, setDisplayProcedures] = useState<TreatmentProcedureRow[]>(procedures);
  const [editingProcedure, setEditingProcedure] = useState<TreatmentProcedureRow | null>(null);
  const [isUpdatingProcedure, setIsUpdatingProcedure] = useState(false);
  const [deletingProcedureId, setDeletingProcedureId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    problems: '',
    solutions: '',
    cost: '',
    toothDamage: '',
  });

  useEffect(() => {
    setDisplayProcedures(procedures);
  }, [procedures]);

  useEffect(() => {
    let cancelled = false;
    const loadSavedProcedures = async () => {
      if (!consultationId) return;
      try {
        const resp = await getTreatmentProceduresByConsultationId(consultationId);
        if (cancelled) return;
        const payload = resp?.data?.data ?? resp?.data ?? [];
        const list = Array.isArray(payload) ? payload : (payload ? [payload] : []);
        setDisplayProcedures(list as TreatmentProcedureRow[]);
      } catch {
        // Non-blocking: keep current in-memory rows if fetch fails.
      }
    };

    loadSavedProcedures();
    return () => {
      cancelled = true;
    };
  }, [consultationId]);

  const handleProceduresCreated = (newEntries: TreatmentProcedureRow | TreatmentProcedureRow[]) => {
    const entries = Array.isArray(newEntries) ? newEntries : [newEntries];
    if (entries.length === 0) return;
    setDisplayProcedures((prev) => [...entries, ...prev]);
    onProcedureCreated?.(entries);
  };

  const openEditModal = (proc: TreatmentProcedureRow) => {
    setEditingProcedure(proc);
    setEditForm({
      problems: Array.isArray(proc.problems) ? proc.problems.join(', ') : '',
      solutions: Array.isArray(proc.solutions) ? proc.solutions.join(', ') : '',
      cost: String(Number(proc.cost || 0)),
      toothDamage: proc.tooth_damage || '',
    });
  };

  const closeEditModal = () => {
    if (isUpdatingProcedure) return;
    setEditingProcedure(null);
    setEditForm({
      problems: '',
      solutions: '',
      cost: '',
      toothDamage: '',
    });
  };

  const handleUpdateProcedure = async () => {
    if (!editingProcedure?.id) return;
    setIsUpdatingProcedure(true);
    try {
      const parsedProblems = editForm.problems
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
      const parsedSolutions = editForm.solutions
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
      const parsedCost = Number(editForm.cost || 0);

      const response = await updateTreatmentProcedure(editingProcedure.id, {
        problems: parsedProblems,
        solutions: parsedSolutions,
        cost: Number.isFinite(parsedCost) ? parsedCost : 0,
        tooth_damage: editForm.toothDamage?.trim() || '',
      });

      const payload = response?.data?.data ?? response?.data ?? null;
      const updated: TreatmentProcedureRow = payload
        ? {
            ...editingProcedure,
            ...payload,
            id: payload.id || payload._id || editingProcedure.id,
          }
        : {
            ...editingProcedure,
            problems: parsedProblems,
            solutions: parsedSolutions,
            cost: Number.isFinite(parsedCost) ? parsedCost : 0,
            tooth_damage: editForm.toothDamage?.trim() || '',
          };

      setDisplayProcedures((prev) =>
        prev.map((proc) => (String(proc.id) === String(editingProcedure.id) ? updated : proc)),
      );
      toast.success('Tooth damage entry updated.');
      closeEditModal();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to update tooth damage entry.';
      toast.error(message);
    } finally {
      setIsUpdatingProcedure(false);
    }
  };

  const handleDeleteProcedure = async (proc: TreatmentProcedureRow) => {
    const id = String(proc.id || '');
    if (!id) return;

    setDeletingProcedureId(id);
    try {
      await deleteTreatmentProcedure(id);
      setDisplayProcedures((prev) => prev.filter((row) => String(row.id) !== id));
      setConfirmDeleteId(null);
      toast.success('Tooth damage entry deleted.');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to delete tooth damage entry.';
      toast.error(message);
    } finally {
      setDeletingProcedureId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top section: Examination and placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        <div className="lg:col-span-3 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200/80">
          <div className="space-y-6">
            <TextArea 
                label="Chief Complaints" 
                name="chiefComplaints"
                id="chiefComplaints"
                value={formData.chiefComplaints} // Value is now driven by state
                onChange={handleChange}
                placeholder="e.g., Sensitivity in upper right molar..."
                rows={4}
            />
            <div className="space-y-3">
              <TextArea 
                  label="On Examination" 
                  name="onExamination"
                  id="onExamination"
                  value={formData.onExamination} // Value is now driven by state
                  onChange={handleChange}
                  placeholder="e.g., Deep caries noted on tooth #3..."
                  rows={5}
              />
              {displayProcedures && displayProcedures.length > 0 && (
                <div className="bg-white shadow-lg rounded-3xl border border-slate-100 overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100">
                    <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-500">
                      Recent Tooth Damage Entries
                    </p>
                    <p className="text-[13px] text-slate-500 mt-0.5">
                      Automatically populated from the dental chart.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-slate-400 bg-slate-50">
                          <th className="px-4 py-3 font-semibold">Tooth</th>
                          <th className="px-4 py-3 font-semibold">Problems</th>
                          <th className="px-4 py-3 font-semibold">Solutions</th>
                          <th className="px-4 py-3 text-right font-semibold">Cost</th>
                          <th className="px-4 py-3 text-right font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayProcedures.map((proc) => (
                          <tr key={proc.id} className="border-b border-slate-100 last:border-b-0">
                            <td className="px-4 py-3 text-slate-800 font-medium text-sm">{formatToothForDisplay(proc.tooth_number)}</td>
                            <td className="px-4 py-3 text-slate-600">{proc.problems?.join(', ') || '—'}</td>
                            <td className="px-4 py-3 text-slate-600">{proc.solutions?.join(', ') || '—'}</td>
                            <td className="px-4 py-3 text-right text-slate-700 font-semibold">₹{typeof proc.cost === 'number' ? proc.cost.toFixed(2) : '0.00'}</td>
                            <td className="px-4 py-3 text-right relative">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(proc)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                                  title="Edit entry"
                                  aria-label="Edit entry"
                                >
                                  <IconPencil size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(String(proc.id))}
                                  disabled={deletingProcedureId === String(proc.id)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                                  title="Delete entry"
                                  aria-label="Delete entry"
                                >
                                  <IconTrash size={14} />
                                </button>
                              </div>
                              {confirmDeleteId === String(proc.id) && (
                                <div className="absolute right-0 top-10 z-20 w-52 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-lg">
                                  <p className="text-xs text-slate-600 mb-2">Delete this entry?</p>
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId(null)}
                                      disabled={deletingProcedureId === String(proc.id)}
                                      className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteProcedure(proc)}
                                      disabled={deletingProcedureId === String(proc.id)}
                                      className="rounded-md bg-rose-600 px-2 py-1 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-50"
                                    >
                                      {deletingProcedureId === String(proc.id) ? 'Deleting...' : 'Delete'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <TextArea 
                label="Advice" 
                name="advice"
                id="advice"
                value={formData.advice} // Value is now driven by state
                onChange={handleChange}
                placeholder="e.g., Advised for root canal treatment..."
                rows={4}
            />
          </div>
        </div>
        {/* --- DENTAL CHART INTEGRATION --- */}
        <div className="lg:col-span-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col items-center justify-center aspect-square">
          <DentalChart
            consultationId={consultationId}
            clinicId={clinicId}
            onProcedureSaved={handleProceduresCreated}
          />
        </div>
      </div>
     
      {/* Bottom section: Notes */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200/80">
        <TextArea 
            label="Notes for Today's Sitting" 
            name="notes"
            id="notes"
            value={formData.notes} // Value is now driven by state
            onChange={handleChange}
            placeholder="Add any internal notes for this visit..."
            rows={3}
        />
      </div>

      {/* Action Button */}
      <div className="flex justify-end pt-4">
         <button
            type="button"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 font-semibold text-white transition-all duration-300 bg-gradient-to-r from-sky-600 to-cyan-500 rounded-xl shadow-md hover:brightness-110 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save & Continue'}
          </button>
      </div>

      {editingProcedure && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isUpdatingProcedure) {
              closeEditModal();
            }
          }}
        >
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">
                Edit Tooth Damage Entry (Tooth {formatToothForDisplay(editingProcedure.tooth_number)})
              </h3>
              <button
                type="button"
                onClick={closeEditModal}
                disabled={isUpdatingProcedure}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
              >
                <IconX size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Problems (comma separated)</label>
                <input
                  type="text"
                  value={editForm.problems}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, problems: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
                  placeholder="e.g. Caries, Sensitivity"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Solutions (comma separated)</label>
                <input
                  type="text"
                  value={editForm.solutions}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, solutions: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
                  placeholder="e.g. Filling, RCT"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cost</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.cost}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, cost: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tooth Damage (optional)</label>
                <input
                  type="text"
                  value={editForm.toothDamage}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, toothDamage: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
                  placeholder="e.g. Fracture, Wear"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={isUpdatingProcedure}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateProcedure}
                disabled={isUpdatingProcedure}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
              >
                {isUpdatingProcedure ? 'Updating...' : 'Update Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
