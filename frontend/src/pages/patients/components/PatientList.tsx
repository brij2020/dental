import { useState, useEffect } from 'react';
import { IconCalendarPlus, IconSortAscending, IconSortDescending } from '@tabler/icons-react';
import type { ClinicPatientRow } from '../types';
import { computeAge } from '../helpers';

type SortBy = 'name' | 'age' | 'uhid' | 'date';
type SortOrder = 'asc' | 'desc';

type Props = {
  searchTerm: string;
  loading: boolean;
  error: string | null;
  patients: ClinicPatientRow[];
  totalCount?: number;
  onBookAppointment: (patient: ClinicPatientRow) => void;
};

export default function PatientList({ searchTerm, loading, error, patients, totalCount, onBookAppointment }: Props) {
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [sortedPatients, setSortedPatients] = useState<ClinicPatientRow[]>([]);

  // Sort patients whenever patients list or sort settings change
  useEffect(() => {
    const sorted = [...patients].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortBy) {
        case 'name':
          aVal = a.full_name || '';
          bVal = b.full_name || '';
          break;
        case 'age':
          aVal = computeAge(a.date_of_birth) || 0;
          bVal = computeAge(b.date_of_birth) || 0;
          break;
        case 'uhid':
          aVal = a.uhid || '';
          bVal = b.uhid || '';
          break;
        case 'date':
          aVal = new Date(a.date_of_birth || 0).getTime();
          bVal = new Date(b.date_of_birth || 0).getTime();
          break;
        default:
          aVal = '';
          bVal = '';
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    setSortedPatients(sorted);
  }, [patients, sortBy, sortOrder]);

  const toggleSort = (newSortBy: SortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  return (
    <div className="mt-4">
      {loading && <p className="text-slate-500">Searching...</p>}
      {error && <p className="text-rose-600">{error}</p>}

      {!loading && !error && (
        <>
          {searchTerm && patients.length === 0 && (
            <p className="text-slate-500">No patients found for "{searchTerm}".</p>
          )}

          {patients.length > 0 && (
            <div>
              {/* Sort Controls */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-700">Sort by:</span>
                
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => toggleSort('name')}
                    className={`inline-flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg transition ${
                      sortBy === 'name'
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Name
                    {sortBy === 'name' && (
                      sortOrder === 'asc' ? <IconSortAscending size={14} /> : <IconSortDescending size={14} />
                    )}
                  </button>

                  <button
                    onClick={() => toggleSort('age')}
                    className={`inline-flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg transition ${
                      sortBy === 'age'
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Age
                    {sortBy === 'age' && (
                      sortOrder === 'asc' ? <IconSortAscending size={14} /> : <IconSortDescending size={14} />
                    )}
                  </button>

                  <button
                    onClick={() => toggleSort('uhid')}
                    className={`inline-flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg transition ${
                      sortBy === 'uhid'
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    UHID
                    {sortBy === 'uhid' && (
                      sortOrder === 'asc' ? <IconSortAscending size={14} /> : <IconSortDescending size={14} />
                    )}
                  </button>

                  <button
                    onClick={() => toggleSort('date')}
                    className={`inline-flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg transition ${
                      sortBy === 'date'
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    DOB
                    {sortBy === 'date' && (
                      sortOrder === 'asc' ? <IconSortAscending size={14} /> : <IconSortDescending size={14} />
                    )}
                  </button>
                </div>

                <span className="text-xs text-slate-500">
                  ({totalCount ?? sortedPatients.length} patient{(totalCount ?? sortedPatients.length) !== 1 ? 's' : ''} total)
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
                <table className="w-full text-sm">
                  {/* Table Header */}
                  <thead>
                    <tr className="bg-gradient-to-r from-sky-50 to-cyan-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-left font-semibold text-slate-700">Patient Name</th>
                      <th className="px-6 py-4 text-left font-semibold text-slate-700">UHID</th>
                      <th className="px-6 py-4 text-left font-semibold text-slate-700">File #</th>
                      <th className="px-6 py-4 text-left font-semibold text-slate-700">DOB</th>
                      <th className="px-6 py-4 text-center font-semibold text-slate-700">Age</th>
                      <th className="px-6 py-4 text-center font-semibold text-slate-700">Action</th>
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody className="divide-y divide-slate-200">
                    {sortedPatients.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-sky-50 transition duration-150"
                      >
                        <td className="px-6 py-4 font-medium text-slate-800">{p.full_name}</td>
                        <td className="px-6 py-4 text-slate-600">{p.uhid || '—'}</td>
                        <td className="px-6 py-4 text-slate-600">{p.file_number || '—'}</td>
                        <td className="px-6 py-4 text-slate-600">
                          {p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4 text-center text-slate-600">
                          {computeAge(p.date_of_birth) || '—'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => onBookAppointment(p)}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white transition bg-gradient-to-r from-sky-500 to-cyan-400 rounded-lg shadow-sm hover:brightness-110 active:brightness-95"
                            title="Book an appointment"
                          >
                            <IconCalendarPlus size={16} />
                            <span>Book</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
