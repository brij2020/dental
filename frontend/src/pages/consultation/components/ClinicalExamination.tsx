// src/features/consultation/components/ClinicalExamination.tsx

import React, { useState, useEffect } from 'react'; // <-- Import useEffect
import DentalChart from './dental-chart/DentalChart';
import type { TreatmentProcedureRow } from '../types';

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

  useEffect(() => {
    setDisplayProcedures(procedures);
  }, [procedures]);

  const handleProceduresCreated = (newEntries: TreatmentProcedureRow | TreatmentProcedureRow[]) => {
    const entries = Array.isArray(newEntries) ? newEntries : [newEntries];
    if (entries.length === 0) return;
    setDisplayProcedures((prev) => [...entries, ...prev]);
    onProcedureCreated?.(entries);
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
                        </tr>
                      </thead>
                      <tbody>
                        {displayProcedures.map((proc) => (
                          <tr key={proc.id} className="border-b border-slate-100 last:border-b-0">
                            <td className="px-4 py-3 text-slate-800 font-medium text-sm">{proc.tooth_number}</td>
                            <td className="px-4 py-3 text-slate-600">{proc.problems?.join(', ') || '—'}</td>
                            <td className="px-4 py-3 text-slate-600">{proc.solutions?.join(', ') || '—'}</td>
                            <td className="px-4 py-3 text-right text-slate-700 font-semibold">₹{typeof proc.cost === 'number' ? proc.cost.toFixed(2) : '0.00'}</td>
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
      {/* 
      START 
      */}

      {/* Tooth Damage Table: Show after On Examination */}
      {(() => {
        if (!displayProcedures || displayProcedures.length === 0) return null;
        const toothDamageProcedures = displayProcedures.filter((p) => {
          const hasProblems =
            Array.isArray(p.problems) && p.problems.some((pr) => typeof pr === 'string' && pr.trim() !== "");
          const hasSolutions =
            Array.isArray(p.solutions) && p.solutions.some((sol) => typeof sol === 'string' && sol.trim() !== "");
          const hasDamageText = !!p.tooth_damage?.trim();
          return hasProblems || hasSolutions || hasDamageText;
        });
        if (!toothDamageProcedures.length) return null;
        return (
          <div className="mt-4 overflow-x-auto">
            <strong className="block mb-1">Tooth Damage</strong>
            <table className="min-w-full border text-xs">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border px-2 py-1">Tooth</th>
                  <th className="border px-2 py-1">Problem(s)</th>
                  <th className="border px-2 py-1">Solution(s)</th>
                  <th className="border px-2 py-1">Cost</th>
                  <th className="border px-2 py-1">Damage Notes</th>
                </tr>
              </thead>
              <tbody>
                {toothDamageProcedures.map((p) => (
                  <tr key={p.id}>
                    <td className="border px-2 py-1">{p.tooth_number ?? '-'}</td>
                    <td className="border px-2 py-1">{Array.isArray(p.problems) ? p.problems.join(', ') : '-'}</td>
                    <td className="border px-2 py-1">{Array.isArray(p.solutions) ? p.solutions.join(', ') : '-'}</td>
                    <td className="border px-2 py-1">{p.cost ?? '-'}</td>
                    <td className="border px-2 py-1">{p.tooth_damage || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })()}
      {/* END */}
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
    </div>
  );
}
