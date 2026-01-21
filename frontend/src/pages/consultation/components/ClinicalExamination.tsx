// src/features/consultation/components/ClinicalExamination.tsx

import React, { useState, useEffect } from 'react'; // <-- Import useEffect
import DentalChart from './dental-chart/DentalChart';

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
    consultationId: string; // <-- ADD THIS
    clinicId: string;     // <-- ADD THIS
};

export default function ClinicalExamination({ onSaveAndContinue, isSaving, initialData, consultationId, clinicId }: Props) { // <-- UPDATED: Destructure initialData
  const [formData, setFormData] = useState<ClinicalExaminationData>({
    chiefComplaints: '',
    onExamination: '',
    advice: '',
    notes: '',
  });

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
            <TextArea 
                label="On Examination" 
                name="onExamination"
                id="onExamination"
                value={formData.onExamination} // Value is now driven by state
                onChange={handleChange}
                placeholder="e.g., Deep caries noted on tooth #3..."
                rows={5}
            />
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
          <DentalChart consultationId={consultationId} 
          clinicId={clinicId}/>
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
    </div>
  );
}