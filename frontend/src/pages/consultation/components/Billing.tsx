// src/features/consultation/components/Billing.tsx

import React, { useState, useEffect } from 'react';
import type { ConsultationRow, PaymentModeEnum } from '../types'; // <-- Import types
import { getAllFeesByClinicId, getAllProfiles } from '../../../lib/apiClient';

// --- Reusable Row Component ---
type BillingRowProps = {
  label: string;
  isInput?: boolean;
  isSelect?: boolean;
  options?: string[];
  value: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  name?: string;
  placeholder?: string;
  bold?: boolean;
  inputType?: 'number' | 'text';
  readOnly?: boolean;
  accent?: 'normal' | 'strong' | 'success';
};

const BillingRow: React.FC<BillingRowProps> = ({
  label,
  isInput = false,
  isSelect = false,
  options,
  value,
  onChange,
  name,
  placeholder,
  bold = false,
  inputType = 'number',
  readOnly = false,
  accent = 'normal',
}) => (
  <div className="grid grid-cols-1 gap-2 py-3 md:grid-cols-2 md:items-center md:gap-4 border-b border-slate-100 last:border-b-0">
    <dt
      className={`text-sm ${
        bold ? 'font-semibold text-slate-800' : 'text-slate-600'
      }`}
    >
      {label}
    </dt>
    <dd className="text-sm font-medium text-slate-900">
      {isInput ? (
        <div className="relative">
          {inputType === 'number' && (
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              ₹
            </span>
          )}
          <input
            type={inputType}
            step={inputType === 'number' ? '0.01' : undefined}
            min={inputType === 'number' ? '0' : undefined}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            readOnly={readOnly}
            className={`w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-3 text-right text-slate-900 transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-200/60 ${
              inputType === 'number' ? 'pl-8' : 'pl-3'
            } ${readOnly ? 'bg-slate-50 text-slate-500' : ''}`}
          />
        </div>
      ) : isSelect ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-3 pr-3 text-right text-slate-900 transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-200/60"
        >
          {options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <span
          className={`block rounded-xl px-3 py-2.5 text-right ${
            accent === 'strong'
              ? 'bg-slate-100 font-semibold text-slate-900'
              : accent === 'success'
              ? 'bg-emerald-50 font-semibold text-emerald-700'
              : 'bg-slate-50 text-slate-800'
          }`}
        >
          {value}
        </span>
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
    procedureAmountOverride?: number;
};

export default function Billing({ onSaveAndContinue, isSaving, consultationData, procedureAmountOverride }: Props) {
  
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

const procedureAmount = Number(
  procedureAmountOverride ?? consultationData.procedure_amount ?? 0,
);
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
useEffect(() => {
  const fetchConsultationFee = async () => {
    if (!consultationData?.clinic_id) return;
    try {
      const resp = await getAllFeesByClinicId(consultationData.clinic_id);
      const fees = resp.data?.data || [];
      if (fees.length === 0) return;

      const selectedDoctorId = consultationData?.doctor_id ? String(consultationData.doctor_id) : null;
      const byDoctorId = (fee: any, doctorId: string) =>
        fee?.doctor_id != null && String(fee.doctor_id) === doctorId;

      // Priority:
      // 1) selected doctor fee
      // 2) clinic-wide fee (doctor_id null)
      // 3) any admin-doctor fee
      // 4) first available fee
      let preferredFee: any =
        (selectedDoctorId
          ? fees.find((f: any) => byDoctorId(f, selectedDoctorId))
          : null) ||
        fees.find((f: any) => !f.doctor_id) ||
        null;

      if (!preferredFee) {
        try {
          const profilesResp = await getAllProfiles();
          const profileData = profilesResp?.data?.data || profilesResp?.data || [];
          const profiles = Array.isArray(profileData) ? profileData : [profileData];
          const adminDoctorIds = new Set(
            profiles
              .filter((p: any) => p?.role === 'admin')
              .map((p: any) => String(p?._id || p?.id))
              .filter(Boolean),
          );
          preferredFee =
            fees.find((f: any) => f?.doctor_id && adminDoctorIds.has(String(f.doctor_id))) ||
            fees[0];
        } catch {
          preferredFee = fees[0];
        }
      }

      const cost = Number(preferredFee?.cost_fees ?? preferredFee?.cost ?? 0);
      setBilling(prev => ({
        ...prev,
        consultationFee: prev.consultationFee || cost,
      }));
    } catch (err) {
      console.warn('Failed to load consultation fee from API:', err);
    }
  };

  fetchConsultationFee();
}, [consultationData?.clinic_id, consultationData?.doctor_id]);


  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-800">Billing Details</h2>
            <p className="mt-1 text-sm text-slate-500">
              Review consultation charges and collect payment for this visit.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              This Consultation
            </h3>
            <dl>
              <BillingRow
                label="Consultation Fee"
                name="consultationFee"
                isInput
                value={billing.consultationFee}
                onChange={handleInputChange}
                placeholder="0"
              />
              <BillingRow
                label="Other Amount"
                name="otherAmount"
                isInput
                value={billing.otherAmount}
                onChange={handleInputChange}
                placeholder="0"
              />
              <BillingRow label="Procedure Amount" value={rupee(procedureAmount)} />
              <BillingRow label="Subtotal" value={rupee(previewSubtotal)} bold accent="strong" />
              <BillingRow
                label="Discount"
                name="discount"
                isInput
                value={billing.discount}
                onChange={handleInputChange}
                placeholder="0"
              />
              <BillingRow
                label="Total (This Consultation)"
                value={rupee(previewTotal)}
                bold
                accent="strong"
              />
              <BillingRow label="Already Paid (This Consultation)" value={rupee(totalPaidSoFar)} />
              <BillingRow
                label="Amount Due (This Consultation)"
                value={rupee(previewAmountDue)}
                bold
                accent="strong"
              />
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Grand Total & Payment
            </h3>
            <dl>
              <BillingRow
                label="Previous Outstanding Balance"
                name="previousOutstandingBalance"
                isInput
                value={billing.previousOutstandingBalance}
                onChange={handleInputChange}
                placeholder="0"
              />
              <BillingRow label="Grand Total Due" value={rupee(previewGrandTotalDue)} bold accent="strong" />
              <BillingRow
                label="Pay Today"
                name="paid"
                isInput
                value={billing.paid}
                onChange={handleInputChange}
                placeholder="0"
              />
              <BillingRow
                label="Mode of Payment"
                name="modeOfPayment"
                isSelect
                options={paymentModes}
                value={billing.modeOfPayment}
                onChange={handleInputChange}
              />
              <BillingRow
                label="Payment Reference"
                name="paymentReference"
                isInput
                inputType="text"
                value={billing.paymentReference}
                onChange={handleInputChange}
                placeholder="e.g., UPI ID, Txn No."
              />
              <BillingRow
                label="Final Pending Balance"
                value={rupee(finalPending)}
                bold
                accent={finalPending <= 0 ? 'success' : 'strong'}
              />
              <BillingRow
                label="Status"
                value={status}
                bold
                accent={status === 'Paid' ? 'success' : 'strong'}
              />
            </dl>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-6 py-2.5 font-semibold text-white shadow-sm transition hover:brightness-105 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
        </div>

        <aside className="lg:col-span-1">
          <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Summary</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Total (Consultation)</span>
                <span className="font-semibold text-slate-900">{rupee(previewTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Grand Total Due</span>
                <span className="font-semibold text-slate-900">{rupee(previewGrandTotalDue)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Pay Today</span>
                <span className="font-semibold text-slate-900">{rupee(billing.paid || 0)}</span>
              </div>
              <div className="border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-700">Balance After Payment</span>
                  <span
                    className={`rounded-lg px-2.5 py-1 text-sm font-semibold ${
                      finalPending <= 0
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {rupee(finalPending)}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-500">Status: {status}</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
