import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient"; // backend
import {
  IconX,
  IconDeviceFloppy,
  IconPlus,
  IconTrash,
  IconCash,
} from "@tabler/icons-react";

// --- PROPS ---
type Props = {
  isOpen: boolean;
  onClose: () => void;
  toothNumber: number | null;
  consultationId: string;
  clinicId: string;
  onSaveSuccess: () => void;
};

type ProcedureOption = {
  id: string; // procedure_id
  name: string;
  cost: number | null;
};

const ToothDamageModal: React.FC<Props> = ({
  isOpen,
  onClose,
  toothNumber,
  consultationId,
  clinicId,
  onSaveSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<"one" | "multi">("one");
  const [isSaving, setIsSaving] = useState(false);

  // Shared form fields
  const [problems, setProblems] = useState<string[]>([""]);
  const [solutions, setSolutions] = useState<string[]>([""]);
  const [cost, setCost] = useState<string>("");

  const [procedureOptions, setProcedureOptions] = useState<ProcedureOption[]>([]);
  const [isLoadingProcedures, setIsLoadingProcedures] = useState(false);
  const [loadProceduresError, setLoadProceduresError] = useState<string | null>(null);
  
  const [problemOptions, setProblemOptions] = useState<string[]>([]);
  const [isLoadingProblems, setIsLoadingProblems] = useState(false);
  const [loadProblemsError, setLoadProblemsError] = useState<string | null>(null);

  // --- UPDATED DATA FETCHING LOGIC ---
  useEffect(() => {
    if (!isOpen || !clinicId || !consultationId) return;

    async function fetchClinicData() {
      setIsLoadingProcedures(true);
      setIsLoadingProblems(true);
      setLoadProceduresError(null);
      setLoadProblemsError(null);

      try {
        // 1. First, find the patient's panel via the consultation
        // We join the 'patients' table to get the panel column directly
        const { data: consultData, error: consultError } = await supabase
          .from("consultations")
          .select(`
            patient_id,
            patients (
              panel
            )
          `)
          .eq("id", consultationId)
          .single();

        if (consultError) throw consultError;

        // Extract the panel safely
        // Note: Supabase returns joined data as an object or array based on relationship
        const patientData = consultData?.patients as any; 
        const patientPanel = patientData?.panel || null;

        console.log("Patient Panel detected:", patientPanel);

        // 2. Prepare the Procedure Query
        let procedureQuery = supabase
          .from("clinic_procedures")
          .select(`
            procedure_id,
            amount,
            panel,
            procedures (
              id,
              name
            )
          `)
          .eq("clinic_id", clinicId)
          .order("created_at", { ascending: false });

        // 3. Apply Panel Filter based on your logic
        if (patientPanel) {
          // If patient has a panel, fetch procedures matching that panel
          procedureQuery = procedureQuery.eq("panel", patientPanel);
        } else {
          // If patient has NO panel, fetch procedures where panel is NULL
          procedureQuery = procedureQuery.is("panel", null);
        }

        // 4. Execute Procedure Fetch
        const { data: procData, error: procError } = await procedureQuery;
        if (procError) throw procError;

        const options: ProcedureOption[] = (procData ?? [])
          .map((row: any) => {
            const proc = Array.isArray(row.procedures)
              ? row.procedures[0]
              : row.procedures;

            if (!proc || !proc.name) return null;

            return {
              id: row.procedure_id ?? proc.id,
              name: proc.name,
              cost: row.amount,
            } as ProcedureOption;
          })
          .filter((item): item is ProcedureOption => item !== null);

        setProcedureOptions(options);

        // 5. Fetch Problems (These usually don't depend on the panel, but kept here for unified loading)
        const { data: problemData, error: problemError } = await supabase
          .from("procedure_problems")
          .select("problem_name")
          .eq("clinic_id", clinicId)
          .order("problem_name", { ascending: true });

        if (problemError) throw problemError;

        const probOptions: string[] = problemData.map((item) => item.problem_name);
        setProblemOptions(probOptions);

      } catch (err: any) {
        console.error("Failed to load modal data:", err?.message || err);
        setLoadProceduresError("Could not load data.");
        setLoadProblemsError("Could not load data.");
      } finally {
        setIsLoadingProcedures(false);
        setIsLoadingProblems(false);
      }
    }

    fetchClinicData();
  }, [isOpen, clinicId, consultationId]);

  // --- MULTI TAB STATE ---
  const ADULT_UPPER = useMemo(
    () => [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
    []
  );
  // ... rest of your existing useMemo lists ...
  const ADULT_LOWER = useMemo(
    () => [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
    []
  );
  const CHILD_UPPER = useMemo(() => [55, 54, 53, 52, 51, 61, 62, 63, 64, 65], []);
  const CHILD_LOWER = useMemo(() => [85, 84, 83, 82, 81, 71, 72, 73, 74, 75], []);

  const [selectedTeeth, setSelectedTeeth] = useState<Set<number>>(new Set());

  // Seed the clicked tooth into Multiple tab selection
  useEffect(() => {
    if (!isOpen || toothNumber == null) return;
    setSelectedTeeth((prev) => {
      if (prev.has(toothNumber)) return prev;
      const next = new Set(prev);
      next.add(toothNumber);
      return next;
    });
  }, [isOpen, toothNumber]);

  // Reset when modal closes/opens
  useEffect(() => {
    if (!isOpen) {
      setActiveTab("one");
      setProblems([""]);
      setSolutions([""]);
      setCost("");
      setSelectedTeeth(new Set());
      setLoadProceduresError(null);
      setLoadProblemsError(null);
    }
  }, [isOpen]);

  // --- HELPER: Render Problem Input ---
  const renderProblemInput = (p: string, idx: number, keyPrefix: string) => (
    <div key={`${keyPrefix}-${idx}`} className="flex gap-2">
      {problemOptions.length > 0 ? (
        <select
          value={p}
          onChange={(e) => updateRow("problems", idx, e.target.value)}
          disabled={isSaving}
          className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
        >
          <option value="">-- Select a problem --</option>
          {problemOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={p}
          onChange={(e) => updateRow("problems", idx, e.target.value)}
          placeholder={
            isLoadingProblems ? "Loading problems..." : "e.g., Cavity on occlusal surface"
          }
          disabled={isSaving || isLoadingProblems}
          className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
        />
      )}

      {problems.length > 1 && (
        <button
          type="button"
          onClick={() => removeRow("problems", idx)}
          disabled={isSaving}
          className="shrink-0 p-1.5 text-slate-500 hover:text-rose-600 rounded-md hover:bg-rose-100 disabled:opacity-50"
          title="Delete row"
        >
          <IconTrash className="w-5 h-5" />
        </button>
      )}
    </div>
  );

  // --- HELPER: Cost Calculation ---
  // NOTE: Added dependency on solutions/selectedTeeth/procedureOptions inside the existing useEffect for cost,
  // but we also need the helper if we want manual triggering. 
  // The previous code had a logic duplication. I'll rely on the existing useEffect logic for cost updates.

  // Cost update effect
  useEffect(() => {
    // If no procedures loaded, we can't auto-calc from dropdowns effectively, unless we matched strings.
    if (procedureOptions.length === 0) return;

    let basePerToothCost = 0;

    for (const solutionName of solutions) {
      if (!solutionName) continue;
      const option = procedureOptions.find((opt) => opt.name === solutionName);
      if (option?.cost != null) {
        basePerToothCost += option.cost;
      }
    }

    if (basePerToothCost <= 0) {
      // Only clear cost if user hasn't manually typed something else? 
      // For now, following previous logic: if calculation is 0, clear it.
      // However, if user manually enters cost, this effect might overwrite it if dependencies change.
      // Assuming standard "auto-calc overrides manual" behavior for now.
      // setCost(""); 
      // Logic improvement: only setCost if we found a match.
      if (cost !== "" && basePerToothCost === 0) return; // Don't clear manual entry if no match found
    }

    if (basePerToothCost > 0) {
        const isMultiTab = activeTab === "multi";
        const selectedCount = selectedTeeth.size;
    
        const total =
          isMultiTab && selectedCount > 0
            ? basePerToothCost * selectedCount
            : basePerToothCost;
    
        setCost(String(total));
    }
  }, [solutions, selectedTeeth, activeTab, procedureOptions]); 
  // removed 'cost' from dependency to avoid loops

  // --- ROW HELPERS ---
  const addRow = (type: "problems" | "solutions") => {
    if (type === "problems") setProblems((prev) => [...prev, ""]);
    else setSolutions((prev) => [...prev, ""]);
  };

  const removeRow = (type: "problems" | "solutions", idx: number) => {
    if (type === "problems") {
      setProblems((prev) =>
        prev.length > 1 ? prev.filter((_, i) => i !== idx) : [""]
      );
    } else {
      setSolutions((prev) =>
        prev.length > 1 ? prev.filter((_, i) => i !== idx) : [""]
      );
    }
  };

  const updateRow = (type: "problems" | "solutions", idx: number, val: string) => {
    if (type === "problems") {
      setProblems((prev) => prev.map((v, i) => (i === idx ? val : v)));
    } else {
      setSolutions((prev) => prev.map((v, i) => (i === idx ? val : v)));
    }
  };

  // --- HELPER: Render Solution Input ---
  const renderSolutionInput = (s: string, idx: number, keyPrefix: string) => (
    <div key={`${keyPrefix}-${idx}`} className="flex gap-2">
      {procedureOptions.length > 0 ? (
        <select
          value={s}
          onChange={(e) => updateRow("solutions", idx, e.target.value)}
          disabled={isSaving}
          className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
        >
          <option value="">-- Select a solution --</option>
          {procedureOptions.map((opt) => (
            <option key={opt.id} value={opt.name}>
              {opt.name} {opt.cost != null ? `(₹${opt.cost})` : ""}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={s}
          onChange={(e) => updateRow("solutions", idx, e.target.value)}
          placeholder={
            isLoadingProcedures
              ? "Loading procedures..."
              : "e.g., Composite filling"
          }
          disabled={isSaving || isLoadingProcedures}
          className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
        />
      )}

      {solutions.length > 1 && (
        <button
          type="button"
          onClick={() => removeRow("solutions", idx)}
          disabled={isSaving}
          className="shrink-0 p-1.5 text-slate-500 hover:text-rose-600 rounded-md hover:bg-rose-100 disabled:opacity-50"
          title="Delete row"
        >
          <IconTrash className="w-5 h-5" />
        </button>
      )}
    </div>
  );

  const toggleTooth = (n: number) => {
    setSelectedTeeth((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  };

  const toggleToothGroup = (group: number[]) => {
    setSelectedTeeth((prev) => {
      const next = new Set(prev);
      const areAllSelected = group.every((tooth) => next.has(tooth));

      if (areAllSelected) {
        group.forEach((tooth) => next.delete(tooth));
      } else {
        group.forEach((tooth) => next.add(tooth));
      }
      return next;
    });
  };

  const selectedTeethList = React.useMemo(
    () => Array.from(selectedTeeth).sort((a, b) => a - b),
    [selectedTeeth]
  );

  // --- SAVE TO SUPABASE ---
  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const filteredProblems = problems.filter((p) => p.trim() !== "");
      const filteredSolutions = solutions.filter((s) => s.trim() !== "");
      const numericCost: number | null =
        cost.trim() === "" ? null : Number(cost);

      if (activeTab === "one") {
        const { error } = await supabase.from("treatment_procedures").insert({
          consultation_id: consultationId,
          clinic_id: clinicId,
          tooth_number: toothNumber,
          problems: filteredProblems.length > 0 ? filteredProblems : null,
          solutions: filteredSolutions.length > 0 ? filteredSolutions : null,
          cost: numericCost,
        });
        if (error) throw error;
      } else {
        const perToothCost: number | null =
          numericCost != null && selectedTeethList.length > 0
            ? Number((numericCost / selectedTeethList.length).toFixed(2))
            : null;

        const rows = selectedTeethList.map((tooth) => ({
          consultation_id: consultationId,
          clinic_id: clinicId,
          tooth_number: tooth,
          problems: filteredProblems.length > 0 ? filteredProblems : null,
          solutions: filteredSolutions.length > 0 ? filteredSolutions : null,
          cost: perToothCost,
        }));

        if (rows.length > 0) {
          const { error } = await supabase.from("treatment_procedures").insert(rows);
          if (error) throw error;
        }
      }

      onSaveSuccess();
    } catch (e: any) {
      console.error("Failed to save procedure:", e?.message || e);
      alert("Failed to save procedure. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- ROW COMPONENT ---
  const Row = ({ title, values }: { title: string; values: number[] }) => {
    const areAllSelected =
      values.length > 0 && values.every((v) => selectedTeeth.has(v));

    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-slate-700">{title}</div>
          <label className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 cursor-pointer hover:bg-slate-50">
            <input
              type="checkbox"
              className="accent-sky-500"
              checked={areAllSelected}
              onChange={() => toggleToothGroup(values)}
              disabled={isSaving}
            />
            <span className="text-sm font-semibold">Select All</span>
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {values.map((v) => (
            <label
              key={`${title}-${v}`}
              className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border ${
                selectedTeeth.has(v)
                  ? "border-sky-400 bg-sky-50 text-slate-900"
                  : "border-slate-300 bg-white text-slate-700"
              } cursor-pointer`}
            >
              <input
                type="checkbox"
                className="accent-sky-500"
                checked={selectedTeeth.has(v)}
                onChange={() => toggleTooth(v)}
                disabled={isSaving}
              />
              <span className="text-sm font-semibold">{v}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  if (!isOpen || toothNumber == null) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tooth-damage-title"
    >
      <div
        className={`w-full ${
          activeTab === "one" ? "max-w-lg" : "max-w-3xl"
        } p-0 bg-white border shadow-xl rounded-2xl transition-all duration-300 ease-in-out`}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b">
          <h3 id="tooth-damage-title" className="text-lg font-semibold text-slate-800">
            Add Tooth Damage
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-1 text-slate-400 rounded-full hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            aria-label="Close"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4">
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("one")}
              disabled={isSaving}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                activeTab === "one"
                  ? "bg-white text-slate-900 shadow"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              One Tooth Selection
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("multi")}
              disabled={isSaving}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                activeTab === "multi"
                  ? "bg-white text-slate-900 shadow"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Multiple Tooth Selection
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 overflow-y-auto max-h-[75vh]">
          {activeTab === "one" ? (
            <div className="space-y-6">
              {/* Readonly Tooth Number */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tooth Number
                </label>
                <input
                  value={toothNumber ?? ""}
                  readOnly
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 pr-3 py-2.5 text-slate-900 outline-none"
                />
              </div>

              {/* Problems */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Enter problem
                  </label>
                  <button
                    type="button"
                    onClick={() => addRow("problems")}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                    title="Add problem row"
                  >
                    <IconPlus className="w-4 h-4" />
                    Add row
                  </button>
                </div>
                <div className="space-y-2">
                  {problems.map((p, idx) => renderProblemInput(p, idx, "prob"))}
                  {loadProblemsError && (
                    <p className="text-xs text-red-600 mt-1">
                      {loadProblemsError}
                    </p>
                  )}
                </div>
              </div>

              {/* Solutions */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Enter problem solution
                  </label>
                  <button
                    type="button"
                    onClick={() => addRow("solutions")}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                    title="Add solution row"
                  >
                    <IconPlus className="w-4 h-4" />
                    Add row
                  </button>
                </div>
                <div className="space-y-2">
                  {solutions.map((s, idx) => renderSolutionInput(s, idx, "sol"))}
                  {loadProceduresError && (
                    <p className="text-xs text-red-600 mt-1">
                      {loadProceduresError}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Treatment Cost
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <IconCash className="h-5 w-5 text-slate-400" />
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="e.g., 1500"
                    disabled={isSaving}
                    className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
                  />
                </div>
              </div>
            </div>
          ) : (
            // MULTIPLE TOOTH SELECTION
            <div className="space-y-6">
              {/* Read-only input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tooth Numbers
                </label>
                <input
                  value={selectedTeethList.join(", ")}
                  readOnly
                  placeholder="Select teeth below…"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 pr-3 py-2.5 text-slate-900 outline-none"
                />
              </div>

              {/* Rows */}
              <Row title="Adult Upper teeth" values={ADULT_UPPER} />
              <Row title="Adult Lower teeth" values={ADULT_LOWER} />
              <Row title="Child Upper teeth" values={CHILD_UPPER} />
              <Row title="Child Lower teeth" values={CHILD_LOWER} />

              {/* Problems */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Enter problem
                  </label>
                  <button
                    type="button"
                    onClick={() => addRow("problems")}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                    title="Add problem row"
                  >
                    <IconPlus className="w-4 h-4" />
                    Add row
                  </button>
                </div>
                <div className="space-y-2">
                  {problems.map((p, idx) => renderProblemInput(p, idx, "prob-m"))}
                  {loadProblemsError && (
                    <p className="text-xs text-red-600 mt-1">
                      {loadProblemsError}
                    </p>
                  )}
                </div>
              </div>

              {/* Solutions */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Enter problem solution
                  </label>
                  <button
                    type="button"
                    onClick={() => addRow("solutions")}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                    title="Add solution row"
                  >
                    <IconPlus className="w-4 h-4" />
                    Add row
                  </button>
                </div>
                <div className="space-y-2">
                  {solutions.map((s, idx) => renderSolutionInput(s, idx, "sol-m"))}
                  {loadProceduresError && (
                    <p className="text-xs text-red-600 mt-1">
                      {loadProceduresError}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Total Cost for all selected teeth
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <IconCash className="h-5 w-5 text-slate-400" />
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="e.g., 4500"
                    disabled={isSaving}
                    className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={
              isSaving ||
              (activeTab === "multi" && selectedTeethList.length === 0)
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-5 py-2 text-white font-medium shadow-sm hover:brightness-105 active:brightness-95 transition disabled:opacity-50"
          >
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                <IconDeviceFloppy className="h-5 w-5" />
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToothDamageModal;