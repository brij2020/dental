import React, { useState, useEffect, type FormEvent, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  IconChevronLeft,
  IconStethoscope,
  IconPlus,
  IconPencil,
  IconTrash,
  IconX,
  IconAlertCircle,
  IconDeviceFloppy,
  IconCash,
  IconNote,
  IconTag,
  IconArrowUp,
  IconArrowDown,
} from '@tabler/icons-react';
import {
  getProcedures,
  getAllClinicPanels,
  createProcedure,
  updateProcedure,
  deleteProcedure,
} from '../../../lib/apiClient';
import { useAuth } from '../../../state/useAuth';
import TablePagination from '../../../components/TablePagination';
import TableOverlayLoader from '../../../components/TableOverlayLoader';

// --- Types ---

type Procedure = {
  _id: string;
  clinic_id: string;
  panel_id?: string | null;
  name: string;
  procedure_type: string;
  description: string | null;
  cost: number;
  note: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type ProcedureFormData = {
  _id: string | null;
  panel_id: string;
  name: string;
  procedure_type: string;
  description: string;
  cost: number;
  note: string;
};
type ClinicPanelOption = {
  _id: string;
  name: string;
  code: string;
};

const PROCEDURE_TYPES = [
  'General',
  'Cosmetic',
  'Surgical',
  'Diagnostic',
  'Preventive',
  'Restorative',
  'Orthodontic',
  'Prosthodontic',
  'Periodontal',
  'Endodontic',
  'Other',
];

const newFormState = (): ProcedureFormData => ({
  _id: null,
  panel_id: '',
  name: '',
  procedure_type: 'General',
  description: '',
  cost: 0,
  note: '',
});

// --- Main Panel Component ---
export default function ProcedurePanel() {
  const { user } = useAuth();
  const PAGE_SIZE = 10;
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState<ProcedureFormData | null>(null);
  const [clinicPanels, setClinicPanels] = useState<ClinicPanelOption[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const hasFetchedOnceRef = useRef(false);
  
  // Sorting state
  const [sortColumn, setSortColumn] = useState<'name' | 'procedure_type' | 'cost' | 'description' | 'note'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Fetch all procedures for this clinic
  const fetchProcedures = useCallback(async () => {
    if (!user?.clinic_id) return;
    const useFullPageLoader = !hasFetchedOnceRef.current;
    if (useFullPageLoader) {
      setIsLoading(true);
    } else {
      setIsPageLoading(true);
    }

    try {
      const response = await getProcedures(user.clinic_id, {
        page: currentPage,
        limit: PAGE_SIZE,
      });
      const pageData = response.data?.data || [];
      const pagination = response.data?.pagination;
      setProcedures(pageData);
      setTotalItems(pagination?.total ?? pageData.length);
      setTotalPages(Math.max(1, pagination?.pages ?? 1));
    } catch (error) {
      console.error('Error fetching procedures:', error);
      toast.error('Failed to load procedures.');
      setProcedures([]);
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
    fetchProcedures();
  }, [fetchProcedures]);

  useEffect(() => {
    const fetchClinicPanels = async () => {
      if (!user?.clinic_id) return;
      try {
        const response = await getAllClinicPanels(user.clinic_id, { limit: 200 });
        setClinicPanels(response.data?.data || []);
      } catch (error) {
        console.error('Error fetching clinic panels for procedures:', error);
      }
    };

    fetchClinicPanels();
  }, [user?.clinic_id]);

  // --- Sorting Handler ---
  const handleSort = (column: 'name' | 'procedure_type' | 'cost' | 'description' | 'note') => {
    if (sortColumn === column) {
      // Toggle direction if same column clicked
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, start with ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sorted procedures
  const sortedProcedures = [...procedures].sort((a, b) => {
    let aVal: any = a[sortColumn];
    let bVal: any = b[sortColumn];

    // Handle case-insensitive string comparison
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Helper to render sort icon
  const renderSortIcon = (column: 'name' | 'procedure_type' | 'cost' | 'description' | 'note') => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? (
      <IconArrowUp className="w-4 h-4 inline ml-1" />
    ) : (
      <IconArrowDown className="w-4 h-4 inline ml-1" />
    );
  };

  // --- Modal & Form Handlers ---

  const handleOpenAddModal = () => {
    setFormData(newFormState());
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (proc: Procedure) => {
    setFormData({
      _id: proc._id,
      panel_id: typeof proc.panel_id === 'string' ? proc.panel_id : '',
      name: proc.name,
      procedure_type: proc.procedure_type,
      description: proc.description || '',
      cost: proc.cost,
      note: proc.note || '',
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
    const { name, value } = e.target;
    if (!formData) return;

    setFormData(prev => ({
      ...prev!,
      [name]: name === 'cost' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData || !user?.clinic_id) return;

    setIsSaving(true);

    try {
      const payload = {
        clinic_id: user.clinic_id,
        panel_id: formData.panel_id || null,
        name: formData.name.trim(),
        procedure_type: formData.procedure_type,
        description: formData.description.trim() || null,
        cost: formData.cost,
        note: formData.note.trim() || null,
      };

      if (modalMode === 'add') {
        await createProcedure(payload);
        toast.success('Procedure created successfully!');
      } else {
        await updateProcedure(formData._id!, payload);
        toast.success('Procedure updated successfully!');
      }

      await fetchProcedures();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving procedure:', error);
      toast.error(error?.response?.data?.message || 'Failed to save procedure.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (proc: Procedure) => {
    if (!window.confirm(`Delete "${proc.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteProcedure(proc._id);
      toast.success('Procedure deleted successfully!');
      if (procedures.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      } else {
        await fetchProcedures();
      }
    } catch (error: any) {
      console.error('Error deleting procedure:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete procedure.');
    }
  };


  return (
    <div>
      <Link
        to="/settings"
        className="flex items-center gap-2 mb-4 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <IconChevronLeft className="h-5 w-5" />
        Back to Settings
      </Link>

      <div className="p-6 bg-white border rounded-2xl">
        {/* --- Header --- */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Clinic Procedures</h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage the procedures offered at your clinic with their types, descriptions, and costs.
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 mt-4 font-medium text-white transition rounded-xl md:mt-0 bg-gradient-to-r from-indigo-600 to-sky-500 shadow-sm hover:brightness-105 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <IconPlus className="h-5 w-5" />
            Add Procedure
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
                    className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500"
                  >
                    Panel
                  </th>
                  <th
                    scope="col"
                    onClick={() => handleSort('name')}
                    className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500 cursor-pointer hover:bg-slate-100 transition"
                  >
                    Procedure Name {renderSortIcon('name')}
                  </th>
                  <th
                    scope="col"
                    onClick={() => handleSort('procedure_type')}
                    className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500 cursor-pointer hover:bg-slate-100 transition"
                  >
                    Type {renderSortIcon('procedure_type')}
                  </th>
                  <th
                    scope="col"
                    onClick={() => handleSort('cost')}
                    className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500 cursor-pointer hover:bg-slate-100 transition"
                  >
                    Cost {renderSortIcon('cost')}
                  </th>
                  <th
                    scope="col"
                    onClick={() => handleSort('description')}
                    className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500 cursor-pointer hover:bg-slate-100 transition"
                  >
                    Description {renderSortIcon('description')}
                  </th>
                  <th
                    scope="col"
                    onClick={() => handleSort('note')}
                    className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500 cursor-pointer hover:bg-slate-100 transition"
                  >
                    Note {renderSortIcon('note')}
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Loading procedures...
                    </td>
                  </tr>
                )}
                {!isLoading && procedures.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      <IconAlertCircle className="w-12 h-12 mx-auto text-slate-400" />
                      <p className="mt-2 font-medium">No procedures found.</p>
                      <p className="text-sm">Click &quot;Add Procedure&quot; to get started.</p>
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  sortedProcedures.map(proc => (
                    <tr key={proc._id}>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-slate-600">
                        {clinicPanels.find(p => p._id === proc.panel_id)?.name || <span className="italic text-slate-400">—</span>}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-slate-900">
                        {proc.name}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-slate-600">
                        {proc.procedure_type || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-slate-600">
                        ₹{proc.cost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm max-w-xs truncate text-slate-600">
                        {proc.description || <span className="italic text-slate-400">—</span>}
                      </td>
                      <td className="px-6 py-4 text-sm max-w-xs truncate text-slate-600">
                        {proc.note || <span className="italic text-slate-400">—</span>}
                      </td>
                      <td className="flex items-center justify-end gap-2 px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEditModal(proc)}
                          title="Edit"
                          className="p-1.5 text-slate-500 hover:text-sky-600 rounded-md hover:bg-sky-100"
                        >
                          <IconPencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(proc)}
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg max-h-[90vh] p-6 bg-white border shadow-xl rounded-2xl overflow-hidden">
            <form onSubmit={handleSubmit} className="flex h-full flex-col">
              {/* Modal Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 id="modal-title" className="text-lg font-semibold text-slate-800">
                    {modalMode === 'add' ? 'Add Procedure' : 'Edit Procedure'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="p-1 text-slate-400 rounded-full hover:bg-slate-100 hover:text-slate-600"
                >
                  <IconX className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="mt-6 space-y-4 overflow-y-auto pr-1">
                {/* Panel */}
                <div>
                  <label
                    htmlFor="panel_id"
                    className="block mb-1 text-sm font-medium text-slate-700"
                  >
                    Panel
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <IconTag className="w-5 h-5 text-slate-400" />
                    </span>
                    <select
                      id="panel_id"
                      name="panel_id"
                      value={formData.panel_id}
                      onChange={handleFormChange}
                      className="w-full py-2.5 pl-10 pr-3 text-slate-900 bg-white border border-slate-300 rounded-xl outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
                    >
                      <option value="">No panel</option>
                      {clinicPanels.map(panel => (
                        <option key={panel._id} value={panel._id}>
                          {panel.name} ({panel.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Procedure Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block mb-1 text-sm font-medium text-slate-700"
                  >
                    Procedure Name *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <IconStethoscope className="w-5 h-5 text-slate-400" />
                    </span>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      required
                      className="w-full py-2.5 pl-10 pr-3 text-slate-900 bg-white border border-slate-300 rounded-xl outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
                      placeholder="e.g., Root Canal Therapy"
                    />
                  </div>
                </div>

                {/* Procedure Type */}
                <div>
                  <label
                    htmlFor="procedure_type"
                    className="block mb-1 text-sm font-medium text-slate-700"
                  >
                    Procedure Type *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <IconTag className="w-5 h-5 text-slate-400" />
                    </span>
                    <select
                      id="procedure_type"
                      name="procedure_type"
                      value={formData.procedure_type}
                      onChange={handleFormChange}
                      required
                      className="w-full py-2.5 pl-10 pr-3 text-slate-900 bg-white border border-slate-300 rounded-xl outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition appearance-none"
                    >
                      {PROCEDURE_TYPES.map(type => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Cost */}
                <div>
                  <label
                    htmlFor="cost"
                    className="block mb-1 text-sm font-medium text-slate-700"
                  >
                    Cost (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <IconCash className="w-5 h-5 text-slate-400" />
                    </span>
                    <input
                      type="number"
                      id="cost"
                      name="cost"
                      value={formData.cost}
                      onChange={handleFormChange}
                      min="0"
                      step="0.01"
                      required
                      className="w-full py-2.5 pl-10 pr-3 text-slate-900 bg-white border border-slate-300 rounded-xl outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
                      placeholder="e.g., 500"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="description"
                    className="block mb-1 text-sm font-medium text-slate-700"
                  >
                    Description
                  </label>
                  <div className="relative">
                    <span className="absolute top-3 left-0 flex items-center pl-3 pointer-events-none">
                      <IconNote className="w-5 h-5 text-slate-400" />
                    </span>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleFormChange}
                      rows={2}
                      className="w-full py-2.5 pl-10 pr-3 text-slate-900 bg-white border border-slate-300 rounded-xl outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition resize-none"
                      placeholder="Describe the procedure details..."
                    />
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label
                    htmlFor="note"
                    className="block mb-1 text-sm font-medium text-slate-700"
                  >
                    Additional Note
                  </label>
                  <div className="relative">
                    <span className="absolute top-3 left-0 flex items-center pl-3 pointer-events-none">
                      <IconNote className="w-5 h-5 text-slate-400" />
                    </span>
                    <textarea
                      id="note"
                      name="note"
                      value={formData.note}
                      onChange={handleFormChange}
                      rows={2}
                      className="w-full py-2.5 pl-10 pr-3 text-slate-900 bg-white border border-slate-300 rounded-xl outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition resize-none"
                      placeholder="e.g., Includes follow-up consultation"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 active:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 font-medium text-white transition rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 shadow-sm hover:brightness-105 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <IconDeviceFloppy className="w-5 h-5" />
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
