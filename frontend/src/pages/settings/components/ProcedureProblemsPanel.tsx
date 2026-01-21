import React, { useState, useEffect, type FormEvent, useCallback } from 'react';
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
  IconNote,
} from '@tabler/icons-react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../state/useAuth';

// --- Types ---
type ProcedureProblem = {
  id: string;
  clinic_id: string;
  problem_name: string;
  note: string | null;
};

type ProcedureProblemFormData = {
  id: string | null;
  problem_name: string;
  note: string;
};

const newFormState = (): ProcedureProblemFormData => ({
  id: null,
  problem_name: '',
  note: '',
});

// --- Main Panel Component ---
export default function ProcedureProblemsPanel() {
  const { user } = useAuth();
  const [problems, setProblems] = useState<ProcedureProblem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState<ProcedureProblemFormData | null>(null);

  // Fetch problems for the user's clinic
  const fetchProblems = useCallback(async () => {
    if (!user?.clinic_id) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('procedure_problems')
      .select('*')
      .eq('clinic_id', user.clinic_id)
      .order('problem_name', { ascending: true });

    if (error) {
      toast.error('Failed to fetch procedure problems.');
      console.error(error);
    } else {
      setProblems(data);
    }
    setIsLoading(false);
  }, [user?.clinic_id]);

  // Initial data fetch
  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  // --- Modal & Form Handlers ---

  const handleOpenAddModal = () => {
    setFormData(newFormState());
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (problem: ProcedureProblem) => {
    setFormData({
      id: problem.id,
      problem_name: problem.problem_name,
      note: problem.note || '',
    });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData(null);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!formData) return;
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev!, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData || !formData.problem_name || !user?.clinic_id) return;
    setIsSaving(true);

    const dataToSave = {
      clinic_id: user.clinic_id,
      problem_name: formData.problem_name,
      note: formData.note || null,
    };

    let error;

    if (modalMode === 'add') {
      // --- ADD NEW ---
      ({ error } = await supabase.from('procedure_problems').insert(dataToSave));
    } else {
      // --- UPDATE EXISTING ---
      ({ error } = await supabase
        .from('procedure_problems')
        .update(dataToSave)
        .eq('id', formData.id!));
    }

    if (error) {
      if (error.message.includes('unique_clinic_procedure_problem')) {
        toast.error('This procedure problem already exists in your clinic.');
      } else {
        toast.error(`Failed to save procedure problem. ${error.message}`);
      }
    } else {
      toast.success(
        `Procedure problem successfully ${
          modalMode === 'add' ? 'added' : 'updated'
        }!`
      );
      fetchProblems(); // Refetch the list
      handleCloseModal();
    }
    setIsSaving(false);
  };

  const handleDelete = async (problem: ProcedureProblem) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${problem.problem_name}"?`
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from('procedure_problems')
      .delete()
      .eq('id', problem.id);

    if (error) {
      toast.error(`Failed to delete procedure problem. ${error.message}`);
    } else {
      toast.success('Procedure problem deleted.');
      fetchProblems(); // Refetch the list
    }
  };

  const renderCell = (text: string | null) =>
    text || <span className="text-slate-400 italic">N/A</span>;

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
              Procedure Problems
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage the list of procedure problems for your clinic.
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
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
                  >
                    Problem
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
                  >
                    Note
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {isLoading && (
                  <tr>
                    <td
                      colSpan={3}
                      className="p-8 text-center text-slate-500"
                    >
                      Loading procedure problems...
                    </td>
                  </tr>
                )}
                {!isLoading && problems.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="p-8 text-center text-slate-500"
                    >
                      <IconAlertCircle className="mx-auto h-12 w-12 text-slate-400" />
                      <p className="mt-2 font-medium">
                        No procedure problems found.
                      </p>
                      <p className="text-sm">
                        Click &quot;Add Problem&quot; to get started.
                      </p>
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  problems.map(problem => (
                    <tr key={problem.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                        {problem.problem_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-xl truncate">
                        {renderCell(problem.note)}
                      </td>
                      <td className="flex items-center justify-end gap-2 px-6 py-4 text-right text-sm font-medium">
                        <button
                          onClick={() => handleOpenEditModal(problem)}
                          title="Edit"
                          className="rounded-md p-1.5 text-slate-500 hover:bg-sky-100 hover:text-sky-600"
                        >
                          <IconPencil className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(problem)}
                          title="Delete"
                          className="rounded-md p-1.5 text-slate-500 hover:bg-rose-100 hover:text-rose-600"
                        >
                          <IconTrash className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- Add/Edit Modal --- */}
      {isModalOpen && formData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-xl">
            <form onSubmit={handleSubmit}>
              {/* Modal Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3
                    id="modal-title"
                    className="text-lg font-semibold text-slate-800"
                  >
                    {modalMode === 'add'
                      ? 'Add Procedure Problem'
                      : 'Edit Procedure Problem'}
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
              <div className="mt-6 space-y-4">
                {/* Problem Name */}
                <div>
                  <label
                    htmlFor="problem_name"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Problem Name
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <IconAlertCircle className="h-5 w-5 text-slate-400" />
                    </span>
                    <input
                      type="text"
                      id="problem_name"
                      name="problem_name"
                      value={formData.problem_name}
                      onChange={handleFormChange}
                      required
                      autoFocus
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-300/40"
                      placeholder="e.g., Bleeding during procedure"
                    />
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label
                    htmlFor="note"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Note (Optional)
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-0 top-3 flex items-center pl-3">
                      <IconNote className="h-5 w-5 text-slate-400" />
                    </span>
                    <textarea
                      id="note"
                      name="note"
                      value={formData.note}
                      onChange={handleFormChange}
                      rows={3}
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-300/40"
                      placeholder="Add any instructions or context related to this problem..."
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-8 flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50 active:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-5 py-2 font-medium text-white shadow-sm transition hover:brightness-105 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <IconDeviceFloppy className="h-5 w-5" />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
