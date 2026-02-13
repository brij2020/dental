import React, { useState, useEffect, type FormEvent, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  IconChevronLeft,
  IconPlus,
  IconPencil,
  IconTrash,
  IconX,
  IconAlertCircle,
  IconDeviceFloppy,
  IconArrowUp,
  IconArrowDown,
} from '@tabler/icons-react';
import {
  getProblems,
  createProblem,
  updateProblem,
  deleteProblem,
} from '../../../lib/apiClient';
import { useAuth } from '../../../state/useAuth';
import TablePagination from '../../../components/TablePagination';
import TableOverlayLoader from '../../../components/TableOverlayLoader';

// --- Types ---
type Problem = {
  _id: string;
  clinic_id: string;
  clinical_findings: string;
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Critical';
  brief_description: string;
  treatment_plan: string;
  icd10_code: string;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type ProblemFormData = {
  id: string | null;
  clinical_findings: string;
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Critical';
  brief_description: string;
  treatment_plan: string;
  icd10_code: string;
  notes: string;
};

const newFormState = (): ProblemFormData => ({
  id: null,
  clinical_findings: '',
  severity: 'Moderate',
  brief_description: '',
  treatment_plan: '',
  icd10_code: '',
  notes: '',
});

// --- Main Panel Component ---
export default function ProblemsPanel() {
  const { user } = useAuth();
  const PAGE_SIZE = 10;
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState<ProblemFormData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const hasFetchedOnceRef = useRef(false);

  // Sorting state
  const [sortColumn, setSortColumn] = useState<'clinical_findings' | 'severity' | 'icd10_code'>('clinical_findings');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Fetch problems for the user's clinic
  const fetchProblems = useCallback(async () => {
    if (!user?.clinic_id) return;

    const useFullPageLoader = !hasFetchedOnceRef.current;
    if (useFullPageLoader) {
      setIsLoading(true);
    } else {
      setIsPageLoading(true);
    }
    try {
      const response = await getProblems({ page: currentPage, limit: PAGE_SIZE });
      if (response.data.status === 'success') {
        const pageData = response.data.data || [];
        const pagination = response.data.pagination;
        setProblems(pageData);
        setTotalItems(pagination?.total ?? pageData.length);
        setTotalPages(Math.max(1, pagination?.pages ?? 1));
      } else {
        toast.error('Failed to fetch problems.');
      }
    } catch (error) {
      toast.error('Failed to fetch problems.');
      console.error(error);
      setProblems([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      if (useFullPageLoader) {
        setIsLoading(false);
      } else {
        setIsPageLoading(false);
      }
      hasFetchedOnceRef.current = true;
    }
  }, [PAGE_SIZE, currentPage, user?.clinic_id]);

  // Initial data fetch
  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  // --- Sorting Handler ---
  const handleSort = (column: 'clinical_findings' | 'severity' | 'icd10_code') => {
    return () => {
      if (sortColumn === column) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setSortColumn(column);
        setSortDirection('asc');
      }
    };
  };

  // --- Sorted Problems ---
  const sortedProblems = [...problems].sort((a, b) => {
    let compareA: any = a[sortColumn];
    let compareB: any = b[sortColumn];

    if (typeof compareA === 'string') {
      compareA = compareA.toLowerCase();
      compareB = (compareB as string).toLowerCase();
    }

    if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
    if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Helper to render sort icon
  const renderSortIcon = (column: 'clinical_findings' | 'severity' | 'icd10_code') => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? (
      <IconArrowUp className="inline w-4 h-4 ml-1" />
    ) : (
      <IconArrowDown className="inline w-4 h-4 ml-1" />
    );
  };

  // --- Modal & Form Handlers ---

  const handleOpenAddModal = () => {
    setFormData(newFormState());
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (problem: Problem) => {
    setFormData({
      id: problem._id,
      clinical_findings: problem.clinical_findings,
      severity: problem.severity,
      brief_description: problem.brief_description,
      treatment_plan: problem.treatment_plan,
      icd10_code: problem.icd10_code,
      notes: problem.notes || '',
    });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData(null);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (!formData) return;
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev!, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    // Validation
    if (!formData.clinical_findings.trim() || !formData.brief_description.trim() || 
        !formData.treatment_plan.trim() || !formData.icd10_code.trim()) {
      toast.error('All fields are required.');
      return;
    }

    setIsSaving(true);

    const dataToSave = {
      clinical_findings: formData.clinical_findings.trim(),
      severity: formData.severity,
      brief_description: formData.brief_description.trim(),
      treatment_plan: formData.treatment_plan.trim(),
      icd10_code: formData.icd10_code.trim(),
      notes: formData.notes.trim() || null,
    };

    try {
      let response;

      if (modalMode === 'add') {
        response = await createProblem(dataToSave);
      } else {
        response = await updateProblem(formData.id!, dataToSave);
      }

      if (response.data.status === 'success') {
        toast.success(
          `Problem successfully ${modalMode === 'add' ? 'added' : 'updated'}!`
        );
        await fetchProblems();
        handleCloseModal();
      } else {
        toast.error(`Failed to save problem. ${response.data.message}`);
      }
    } catch (error: any) {
      toast.error(`Failed to save problem. ${error.response?.data?.message || error.message}`);
    }
    setIsSaving(false);
  };

  const handleDelete = async (problem: Problem) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${problem.clinical_findings}"?`
      )
    ) {
      return;
    }

    try {
      const response = await deleteProblem(problem._id);
      if (response.data.status === 'success') {
        toast.success('Problem deleted successfully.');
        if (problems.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        } else {
          await fetchProblems();
        }
      } else {
        toast.error(`Failed to delete problem. ${response.data.message}`);
      }
    } catch (error: any) {
      toast.error(`Failed to delete problem. ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div>
      <Link
        to="/settings"
        className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <IconChevronLeft className="h-5 w-5" />
        Back to Settings
      </Link>

      <div className="rounded-2xl border bg-white p-6">
        {/* --- Header --- */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Clinical Problems
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage clinical findings, diagnoses, and treatment plans for your clinic.
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            disabled={isLoading}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-2 font-medium text-white shadow-sm transition hover:brightness-105 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 md:mt-0"
          >
            <IconPlus className="h-5 w-5" />
            Add Problem
          </button>
        </div>

        {/* --- Table --- */}
        <div className="mt-6 border border-slate-200 rounded-lg overflow-hidden">
          <div className="relative overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th
                    scope="col"
                    onClick={handleSort('clinical_findings')}
                    className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500 cursor-pointer hover:bg-slate-100 transition"
                  >
                    Clinical Findings {renderSortIcon('clinical_findings')}
                  </th>
                  <th
                    scope="col"
                    onClick={handleSort('severity')}
                    className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500 cursor-pointer hover:bg-slate-100 transition"
                  >
                    Severity {renderSortIcon('severity')}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500"
                  >
                    Description
                  </th>
                  <th
                    scope="col"
                    onClick={handleSort('icd10_code')}
                    className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500 cursor-pointer hover:bg-slate-100 transition"
                  >
                    ICD-10-CM Code {renderSortIcon('icd10_code')}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500"
                  >
                    Notes
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {isLoading && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Loading problems...
                    </td>
                  </tr>
                )}
                {!isLoading && problems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      <IconAlertCircle className="w-12 h-12 mx-auto text-slate-400" />
                      <p className="mt-2 font-medium">No problems found.</p>
                      <p className="text-sm">Click &quot;Add Problem&quot; to get started.</p>
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  sortedProblems.map(problem => (
                    <tr key={problem._id}>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {problem.clinical_findings}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          problem.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                          problem.severity === 'Severe' ? 'bg-orange-100 text-orange-700' :
                          problem.severity === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {problem.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm max-w-xs truncate text-slate-600">
                        {problem.brief_description}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono font-medium text-slate-700">
                        {problem.icd10_code}
                      </td>
                      <td className="px-6 py-4 text-sm max-w-xs truncate text-slate-600">
                        {problem.notes || <span className="italic text-slate-400">—</span>}
                      </td>
                      <td className="flex items-center justify-end gap-2 px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEditModal(problem)}
                          title="Edit"
                          className="p-1.5 text-slate-500 hover:text-sky-600 rounded-md hover:bg-sky-100"
                        >
                          <IconPencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(problem)}
                          title="Delete"
                          className="p-1.5 text-slate-500 hover:text-rose-600 rounded-md hover:bg-rose-100"
                        >
                          <IconTrash className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {isPageLoading && <TableOverlayLoader />}
          </div>
        </div>
        {!isLoading && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            isLoading={isPageLoading}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* --- Add/Edit Modal --- */}
      {isModalOpen && formData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl rounded-2xl border bg-white p-6 shadow-xl overflow-y-auto max-h-[90vh]">
            <form onSubmit={handleSubmit}>
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 id="modal-title" className="text-lg font-semibold text-slate-800">
                    {modalMode === 'add' ? 'Add Clinical Problem' : 'Edit Clinical Problem'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <IconX className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="space-y-4">
                {/* Clinical Findings */}
                <div>
                  <label htmlFor="clinical_findings" className="block text-sm font-medium text-slate-700 mb-1">
                    Clinical Findings *
                  </label>
                  <input
                    type="text"
                    id="clinical_findings"
                    name="clinical_findings"
                    value={formData.clinical_findings}
                    onChange={handleFormChange}
                    required
                    autoFocus
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-300"
                    placeholder="e.g., Chronic periodontitis"
                  />
                </div>

                {/* Severity */}
                <div>
                  <label htmlFor="severity" className="block text-sm font-medium text-slate-700 mb-1">
                    Severity *
                  </label>
                  <select
                    id="severity"
                    name="severity"
                    value={formData.severity}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-300"
                  >
                    <option value="Mild">Mild</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Severe">Severe</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                {/* Brief Description */}
                <div>
                  <label htmlFor="brief_description" className="block text-sm font-medium text-slate-700 mb-1">
                    Brief Description *
                  </label>
                  <textarea
                    id="brief_description"
                    name="brief_description"
                    value={formData.brief_description}
                    onChange={handleFormChange}
                    required
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-300"
                    placeholder="Brief description of the clinical problem..."
                  />
                </div>

                {/* Treatment Plan */}
                <div>
                  <label htmlFor="treatment_plan" className="block text-sm font-medium text-slate-700 mb-1">
                    Treatment Plan *
                  </label>
                  <textarea
                    id="treatment_plan"
                    name="treatment_plan"
                    value={formData.treatment_plan}
                    onChange={handleFormChange}
                    required
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-300"
                    placeholder="Detailed treatment plan and recommendations..."
                  />
                </div>

                {/* ICD-10-CM Code */}
                <div>
                  <label htmlFor="icd10_code" className="block text-sm font-medium text-slate-700 mb-1">
                    ICD-10-CM Code *
                  </label>
                  <input
                    type="text"
                    id="icd10_code"
                    name="icd10_code"
                    value={formData.icd10_code}
                    onChange={handleFormChange}
                    required
                    maxLength={10}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-300 font-mono"
                    placeholder="e.g., K05.90"
                  />
                  <p className="mt-1 text-xs text-slate-500">ICD-10-CM diagnostic code for billing and records</p>
                </div>

                {/* Notes */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleFormChange}
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-300"
                    placeholder="Additional notes or observations about this problem..."
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-8 flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-sky-500 px-5 py-2 font-medium text-white transition hover:brightness-105 disabled:opacity-60"
                >
                  <IconDeviceFloppy className="h-5 w-5" />
                  <span>{isSaving ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
