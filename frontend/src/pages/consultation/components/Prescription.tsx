// src/features/consultation/components/Prescription.tsx

import React, { useState, useEffect, useRef } from "react";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { supabase } from "../../../lib/supabaseClient";
import type { PrescriptionRowDb, RemedyRow } from "../types";

// --- TYPES ---
export type PrescriptionRow = {
  id: string | number;
  medicineName: string;
  times: string;
  quantity: string;
  days: string;
  note: string;
};

type Props = {
  onSaveAndContinue: (data: PrescriptionRow[]) => void;
  isSaving: boolean;
  consultationId: string;
  clinicId: string; // <-- REQUIRED: To filter remedies by clinic
};

// Helper to create a new blank row
const createBlankRow = (): PrescriptionRow => ({
  id: Date.now(),
  medicineName: "",
  times: "",
  quantity: "",
  days: "",
  note: "",
});

// --- SUB-COMPONENT: Medicine Autocomplete ---
type AutoCompleteProps = {
  value: string;
  onChange: (val: string) => void;
  onSelect: (remedy: RemedyRow) => void;
  clinicId: string;
};

function MedicineAutocomplete({ value, onChange, onSelect, clinicId }: AutoCompleteProps) {
  const [suggestions, setSuggestions] = useState<RemedyRow[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (!value || value.length < 2) {
        setSuggestions([]);
        return;
      }

      // Only search if the dropdown is actually desired (optional logic, 
      // but prevents searching when user is just reading)
      if (!showSuggestions) return;

      try {
        const { data, error } = await supabase
          .from("remedies")
          .select("*")
          .eq("clinic_id", clinicId)
          .ilike("name", `%${value}%`)
          .limit(10);

        if (error) throw error;
        setSuggestions(data || []);
      } catch (err) {
        console.error("Error fetching remedies:", err);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [value, clinicId, showSuggestions]);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        className="w-full form-input"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => {
          if (value.length >= 2) setShowSuggestions(true);
        }}
        placeholder="Type medicine name..."
        autoComplete="off"
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1 left-0">
          {suggestions.map((remedy) => (
            <li
              key={remedy.id}
              className="px-4 py-2 hover:bg-sky-50 cursor-pointer text-sm text-slate-700 border-b last:border-0 border-slate-100"
              onClick={() => {
                onSelect(remedy);
                setShowSuggestions(false);
              }}
            >
              <div className="font-medium">{remedy.name}</div>
              {(remedy.times || remedy.note) && (
                 <div className="text-xs text-slate-400">
                    {remedy.times} {remedy.note ? `• ${remedy.note}` : ''}
                 </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function Prescription({
  onSaveAndContinue,
  isSaving,
  consultationId,
  clinicId,
}: Props) {
  const [rows, setRows] = useState<PrescriptionRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch existing prescriptions
  useEffect(() => {
    async function fetchPrescriptions() {
      if (!consultationId) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("prescriptions")
          .select("*")
          .eq("consultation_id", consultationId)
          .order("created_at", { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          const fetchedRows = data.map((row: PrescriptionRowDb) => ({
            id: row.id,
            medicineName: row.medicine_name,
            times: row.times || "",
            quantity: row.quantity || "",
            days: row.days || "",
            note: row.note || "",
          }));
          setRows(fetchedRows);
        } else {
          setRows([createBlankRow()]);
        }
      } catch (e: any) {
        console.error("Failed to fetch prescriptions:", e.message);
        setRows([createBlankRow()]);
      } finally {
        setLoading(false);
      }
    }

    fetchPrescriptions();
  }, [consultationId]);

  // Standard input change handler
  const handleInputChange = (
    id: string | number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === id ? { ...row, [name]: value } : row
      )
    );
  };

  // Specific handler for Name change (updates only name)
  const handleNameChange = (id: string | number, newName: string) => {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === id ? { ...row, medicineName: newName } : row
      )
    );
  };

  // Specific handler for AutoComplete selection (updates multiple fields)
  const handleRemedySelect = (id: string | number, remedy: RemedyRow) => {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === id
          ? {
              ...row,
              medicineName: remedy.name,
              times: remedy.times || "",
              quantity: remedy.quantity || "",
              days: remedy.days || "",
              note: remedy.note || "",
            }
          : row
      )
    );
  };

  const addRow = () => {
    setRows((currentRows) => [...currentRows, createBlankRow()]);
  };

  const deleteRow = (id: string | number) => {
    if (rows.length <= 1) return;
    setRows((currentRows) => currentRows.filter((row) => row.id !== id));
  };

  const handleSave = () => {
    onSaveAndContinue(rows);
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-60 flex justify-center items-center">
        <p className="text-slate-500">Loading prescriptions...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-800">Prescription</h2>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 font-medium text-sm text-sky-600 bg-sky-100 transition rounded-lg hover:bg-sky-200 active:scale-95"
          onClick={addRow}
        >
          <IconPlus size={18} />
          Add Row
        </button>
      </div>

      <div className="overflow-visible -mx-2">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50">
            <tr>
              <th className="px-4 py-3 w-1/3">Medicine Name</th>
              <th className="px-4 py-3">Times (e.g., 1-0-1)</th>
              <th className="px-4 py-3">Quantity</th>
              <th className="px-4 py-3">Days</th>
              <th className="px-4 py-3">Note</th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b relative">
                <td className="p-2 align-top">
                  {/* Using the AutoComplete Component Here */}
                  <MedicineAutocomplete 
                    value={row.medicineName}
                    clinicId={clinicId}
                    onChange={(val) => handleNameChange(row.id, val)}
                    onSelect={(remedy) => handleRemedySelect(row.id, remedy)}
                  />
                </td>
                <td className="p-2 align-top">
                  <input
                    name="times"
                    value={row.times}
                    onChange={(e) => handleInputChange(row.id, e)}
                    className="w-full form-input"
                  />
                </td>
                <td className="p-2 align-top">
                  <input
                    name="quantity"
                    value={row.quantity}
                    onChange={(e) => handleInputChange(row.id, e)}
                    className="w-24 form-input"
                  />
                </td>
                <td className="p-2 align-top">
                  <input
                    name="days"
                    value={row.days}
                    onChange={(e) => handleInputChange(row.id, e)}
                    className="w-24 form-input"
                  />
                </td>
                <td className="p-2 align-top">
                  <input
                    name="note"
                    value={row.note}
                    onChange={(e) => handleInputChange(row.id, e)}
                    className="w-full form-input"
                  />
                </td>
                <td className="p-2 text-center align-top">
                  <button
                    onClick={() => deleteRow(row.id)}
                    className="text-slate-400 hover:text-red-500 p-2 mt-0.5 disabled:opacity-30 disabled:hover:text-slate-400"
                    disabled={rows.length <= 1}
                    title="Delete row"
                  >
                    <IconTrash size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 font-semibold text-white transition bg-gradient-to-r from-indigo-600 to-sky-500 rounded-xl shadow-sm hover:brightness-105 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save & Continue"}
        </button>
      </div>
      <style>{`.form-input { padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; transition: all 0.2s; } .form-input:focus { outline: none; border-color: #38bdf8; box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2); }`}</style>
    </div>
  );
}