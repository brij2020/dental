// src/features/consultation/components/Billing.tsx

import React, { useState, useEffect } from 'react';
import type { ConsultationRow, PaymentModeEnum } from '../types'; // <-- Import types
import { getAllFeesByClinicId } from '../../../lib/apiClient';

// --- Reusable Row Component ---
type BillingRowProps = {
  label: string;
  isInput?: boolean;
  isCalculated?: boolean;
  isSelect?: boolean;
  options?: string[];
  value: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  name?: string;
  placeholder?: string;
  bold?: boolean;
};

const BillingRow: React.FC<BillingRowProps> = ({ label, isInput = false, isSelect = false, options, value, onChange, name, placeholder, bold = false }) => (
  <div className="grid grid-cols-2 items-center gap-4 py-3 border-b border-slate-100">
    <dt className={`text-sm ${bold ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>{label}</dt>
    <dd className="text-sm font-medium text-slate-900">
      {isInput ? (
        <input
  type="number"
  step="0.01"
  min="0"
  name={name}
  value={value}
  onChange={onChange}
  placeholder={placeholder}
  className="w-full text-right form-input"
/>
      ) : isSelect ? (
         <select
          name={name}
          value={value}
          onChange={onChange}
          className="w-full text-right form-input bg-white"
        >
          {options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <span className="block text-right px-3">{value}</span>
      )}
    </dd>
  </div>
);

// --- Main Component ---

// This type defines what is editable in this component's state
export type BillingData = {
    consultationFee: number;
    otherAmount: number;
    discount: number;
    paid: number;
    previousOutstandingBalance: number;
    modeOfPayment: PaymentModeEnum;
    paymentReference: string;
};

type Props = {
    onSaveAndContinue: (data: BillingData) => void;
    isSaving: boolean;
    consultationData: ConsultationRow; // <-- NEW: Get full consultation record
};

export default function Billing({ onSaveAndContinue, isSaving, consultationData }: Props) {
  
  // State for *editable* fields. Calculated fields come from props.
  const [billing, setBilling] = useState<BillingData>({
    consultationFee: 0,
    otherAmount: 0,
    discount: 0,
    paid: 0,
    previousOutstandingBalance: 0,
    modeOfPayment: 'Cash',
    paymentReference: ''
  });

  // --- NEW: Populate state from props on load ---
  useEffect(() => {
    if (consultationData) {
      setBilling(prev => ({
        ...prev,
        consultationFee: consultationData.consultation_fee,
        otherAmount: consultationData.other_amount,
        discount: consultationData.discount,
        previousOutstandingBalance: consultationData.previous_outstanding_balance,
        // 'paid' remains 0 on load, as it's a new transaction
      }));
    }
  }, [consultationData]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  const { name, value } = e.target as HTMLInputElement | HTMLSelectElement;
  const numericFields = ['consultationFee', 'otherAmount', 'discount', 'paid', 'previousOutstandingBalance'];

  if (numericFields.includes(name)) {
    const n = parseFloat(value);
    setBilling(prev => ({ ...prev, [name]: Number.isFinite(n) ? n : 0 }));
  } else {
    setBilling(prev => ({ ...prev, [name]: value as any }));
  }
};

// --- Calculations (client-side preview while editing) ---
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const rupee = (n: number) =>
  `₹${(Number.isFinite(n) ? n : 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const procedureAmount = Number(consultationData.procedure_amount || 0);
const totalPaidSoFar = Number(consultationData.total_paid || 0);

// Live preview numbers based on local inputs:
const previewSubtotal = round2(
  (billing.consultationFee || 0) +
  (billing.otherAmount || 0) +
  procedureAmount -
  (billing.discount || 0)
);

const previewTotal = round2(previewSubtotal); // (no tax field in schema)
const previewAmountDue = round2(previewTotal - totalPaidSoFar);
const previewGrandTotalDue = round2(previewAmountDue + (billing.previousOutstandingBalance || 0));
const finalPending = round2(previewGrandTotalDue - (billing.paid || 0));
const status = finalPending <= 0 ? 'Paid' : 'Pending';


  const handleSave = () => {
    // Pass the local state (with camelCase) to the parent.
    // The parent (Consultation.tsx) will map it to snake_case for Supabase.
    onSaveAndContinue(billing);
  };
  
  const paymentModes: PaymentModeEnum[] = ['Cash', 'Card', 'UPI', 'Bank Transfer'];
const [, setDefaultConsultationFee] = useState<number>(0);


useEffect(() => {
  const fetchConsultationFee = async () => {
    if (!consultationData?.clinic_id) return;
    try {
      const resp = await getAllFeesByClinicId(consultationData.clinic_id);
      const fees = resp.data?.data || [];
      if (fees.length > 0) {
        // Prefer clinic-wide fee (doctor_id == null), otherwise take first
        const clinicFee = fees.find((f: any) => !f.doctor_id) || fees[0];
        const cost = Number(clinicFee.cost_fees ?? clinicFee.cost ?? 0);
        setDefaultConsultationFee(cost);
        setBilling(prev => ({
          ...prev,
          consultationFee: prev.consultationFee || cost,
        }));
      }
    } catch (err) {
      console.warn('Failed to load consultation fee from API:', err);
    }
  };

  fetchConsultationFee();
}, [consultationData?.clinic_id]);


  return (
    <div className="max-w-3xl mx-auto">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-xl font-semibold text-slate-800 border-b pb-3">
                Billing Details
            </h2>
            <dl>
                {/* --- THIS CONSULTATION --- */}
<BillingRow label="Consultation Fee" name="consultationFee" isInput value={billing.consultationFee} onChange={handleInputChange} placeholder="0" />
<BillingRow label="Other Amount" name="otherAmount" isInput value={billing.otherAmount} onChange={handleInputChange} placeholder="0" />
<BillingRow label="Procedure Amount" isCalculated value={rupee(procedureAmount)} />
<BillingRow label="Subtotal" isCalculated value={rupee(previewSubtotal)} bold />
<BillingRow label="Discount" name="discount" isInput value={billing.discount} onChange={handleInputChange} placeholder="0" />
<BillingRow label="Total (This Consultation)" isCalculated value={rupee(previewTotal)} bold />
<BillingRow label="Already Paid (This Consultation)" isCalculated value={rupee(totalPaidSoFar)} />
<BillingRow label="Amount Due (This Consultation)" isCalculated value={rupee(previewAmountDue)} bold />

                {/* --- GRAND TOTAL --- */}
                <div className="pt-3 mt-3 border-t border-slate-200">
  <BillingRow label="Previous Outstanding Balance" name="previousOutstandingBalance" isInput value={billing.previousOutstandingBalance} onChange={handleInputChange} placeholder="0" />
  <BillingRow label="Grand Total Due" isCalculated value={rupee(previewGrandTotalDue)} bold />
                </div>
                
                {/* --- PAYMENT --- */}
                <div className="pt-3 mt-3 border-t border-slate-200">
  <BillingRow label="Pay Today" name="paid" isInput value={billing.paid} onChange={handleInputChange} placeholder="0" />
                    <BillingRow label="Mode of Payment" name="modeOfPayment" isSelect options={paymentModes} value={billing.modeOfPayment} onChange={handleInputChange} />
                    <BillingRow label="Payment Reference" name="paymentReference" isInput value={billing.paymentReference} onChange={handleInputChange} placeholder="e.g., UPI ID, Txn No." />
  <BillingRow label="Final Pending Balance" isCalculated value={rupee(finalPending)} bold />
  <BillingRow label="Status" value={status} bold />
                </div>
            </dl>

             {/* Action Button */}
            <div className="flex justify-end pt-4">
                <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 font-semibold text-white transition bg-gradient-to-r from-indigo-600 to-sky-500 rounded-xl shadow-sm hover:brightness-105 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? 'Saving...' : 'Save & Continue'}
                </button>
            </div>
        </div>
        <style>{`.form-input { padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; transition: all 0.2s; } .form-input:focus { outline: none; border-color: #38bdf8; box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2); }`}</style>
    </div>
  );
}