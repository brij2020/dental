import { useEffect, useMemo, useState } from 'react';
import type { TreatmentProcedureRow } from '../types';

export type PostProcedureData = {
  diagnosedToothNo: string;
  diagnosedProcedure: string;
  status: 'Completed' | 'Scheduled';
  instruction: string;
};

type Props = {
  onSaveAndContinue: (data: PostProcedureData[]) => void;
  isSaving: boolean;
  initialData?: PostProcedureData[] | null;
  procedures?: TreatmentProcedureRow[];
};

const buildKey = (toothNo: string, procedureName: string) => `${toothNo}::${procedureName}`;

export default function PostProcedure({ onSaveAndContinue, isSaving, initialData, procedures = [] }: Props) {
  const [selectedTooth, setSelectedTooth] = useState('');
  const [status, setStatus] = useState<'Completed' | 'Scheduled'>('Scheduled');
  const [instruction, setInstruction] = useState('');
  const [recordsByTooth, setRecordsByTooth] = useState<Record<string, PostProcedureData>>({});

  const toothProcedureMap = useMemo(() => {
    const map = new Map<string, string>();
    procedures.forEach((row) => {
      const toothNo = row?.tooth_number != null ? String(row.tooth_number).trim() : '';
      if (!toothNo) return;
      const solutions = (row?.solutions || [])
        .map((value) => String(value || '').trim())
        .filter(Boolean);
      const existing = map.get(toothNo);
      const combined = Array.from(new Set([...(existing ? existing.split(', ').filter(Boolean) : []), ...solutions]));
      map.set(toothNo, combined.length > 0 ? combined.join(', ') : '-');
    });
    return map;
  }, [procedures]);

  const toothOptions = useMemo(() => Array.from(toothProcedureMap.keys()), [toothProcedureMap]);

  const records = useMemo(
    () =>
      toothOptions
        .map((tooth) => recordsByTooth[tooth])
        .filter((item): item is PostProcedureData => Boolean(item)),
    [recordsByTooth, toothOptions],
  );

  const mappedProcedureName = selectedTooth ? toothProcedureMap.get(selectedTooth) || '-' : '';
  const hasTreatmentProcedures = toothOptions.length > 0;
  const allTeethRecorded = hasTreatmentProcedures && records.length === toothOptions.length;

  useEffect(() => {
    const next: Record<string, PostProcedureData> = {};
    (initialData || []).forEach((item) => {
      const toothNo = String(item?.diagnosedToothNo || '').trim();
      if (!toothNo) return;
      next[toothNo] = {
        diagnosedToothNo: toothNo,
        diagnosedProcedure: item?.diagnosedProcedure || toothProcedureMap.get(toothNo) || '-',
        status: item?.status || 'Scheduled',
        instruction: item?.instruction || '',
      };
    });
    setRecordsByTooth(next);
  }, [initialData, toothProcedureMap]);

  useEffect(() => {
    if (!selectedTooth && toothOptions.length > 0) {
      setSelectedTooth(toothOptions[0]);
    }
  }, [selectedTooth, toothOptions]);

  useEffect(() => {
    if (!selectedTooth) return;
    const existing = recordsByTooth[selectedTooth];
    setStatus(existing?.status || 'Scheduled');
    setInstruction(existing?.instruction || '');
  }, [selectedTooth, recordsByTooth]);

  const handleSaveSelectedTooth = () => {
    if (!selectedTooth) return;
    setRecordsByTooth((prev) => ({
      ...prev,
      [selectedTooth]: {
        diagnosedToothNo: selectedTooth,
        diagnosedProcedure: toothProcedureMap.get(selectedTooth) || '-',
        status,
        instruction,
      },
    }));
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
      <h2 className="text-xl font-semibold text-slate-800">Post Procedure</h2>

      <p className="text-sm text-slate-600">
        Select a tooth, review mapped procedure, set status and instruction, then save. Repeat for each tooth.
      </p>

      {!hasTreatmentProcedures && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          No Treatment Procedure data found. Add procedures in the previous step to map all teeth here.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tooth No.</label>
          <select
            value={selectedTooth}
            onChange={(e) => setSelectedTooth(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400"
            disabled={!hasTreatmentProcedures}
          >
            <option value="">Select Tooth</option>
            {toothOptions.map((tooth) => (
              <option key={tooth} value={tooth}>
                {tooth}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Procedure Name</label>
          <input
            type="text"
            value={mappedProcedureName || 'Select Tooth First'}
            readOnly
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'Completed' | 'Scheduled')}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400"
            disabled={!selectedTooth}
          >
            <option value="Completed">Completed</option>
            <option value="Scheduled">Scheduled</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={handleSaveSelectedTooth}
            disabled={!selectedTooth}
            className="w-full rounded-xl bg-slate-900 text-white px-4 py-2.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Tooth Record
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Instruction</label>
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          rows={3}
          placeholder={status === 'Completed' ? 'e.g. Avoid cold water for one day after extraction' : 'Optional note for scheduled procedure'}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Tooth No.</th>
              <th className="px-4 py-3 text-left font-semibold">Procedure Name</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Instruction</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr className="bg-white">
                <td colSpan={4} className="px-4 py-4 text-center text-slate-500">No tooth records saved yet.</td>
              </tr>
            ) : (
              records.map((row) => (
                <tr className="bg-white border-t border-slate-100" key={buildKey(row.diagnosedToothNo, row.diagnosedProcedure)}>
                  <td className="px-4 py-3">{row.diagnosedToothNo}</td>
                  <td className="px-4 py-3">{row.diagnosedProcedure}</td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3">{row.instruction || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onSaveAndContinue(records)}
          disabled={isSaving || !allTeethRecorded}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 font-semibold text-white transition bg-gradient-to-r from-indigo-600 to-sky-500 rounded-xl shadow-sm hover:brightness-105 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save & Continue'}
        </button>
      </div>
      {hasTreatmentProcedures && (
        <p className="text-xs text-slate-500 text-right">
          Saved {records.length} of {toothOptions.length} teeth
        </p>
      )}
    </div>
  );
}
