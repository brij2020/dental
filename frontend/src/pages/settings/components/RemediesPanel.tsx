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
  IconPill,
  IconNote,
  IconClockHour9,
  IconNumbers,
  IconCalendar,
} from '@tabler/icons-react';
import { remedyAPI } from '../../../lib/remedyAPI';
import { useAuth } from '../../../state/useAuth';
import TablePagination from '../../../components/TablePagination';
import TableOverlayLoader from '../../../components/TableOverlayLoader';

// --- Types ---
type Remedy = {
  _id: string;
  clinic_id: string;
  name: string;
  times: string | null;
  quantity: string | null;
  days: string | null;
  note: string | null;
};

type RemedyFormData = {
  _id: string | null;
  name: string;
  times: string;
  quantity: string;
  days: string;
  note: string;
};

const newFormState = (): RemedyFormData => ({
  _id: null,
  name: '',
  times: '',
  quantity: '',
  days: '',
  note: '',
});

// --- Main Panel Component ---
export default function RemediesPanel() {
  const { user } = useAuth();
  const PAGE_SIZE = 10;
  const [remedies, setRemedies] = useState<Remedy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState<RemedyFormData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const hasFetchedOnceRef = useRef(false);

  // Fetch remedies for the user's clinic
  const fetchRemedies = useCallback(async () => {
    if (!user?.clinic_id) return;

    const useFullPageLoader = !hasFetchedOnceRef.current;
    if (useFullPageLoader) {
      setIsLoading(true);
    } else {
      setIsPageLoading(true);
    }
    try {
      const response = await remedyAPI.getByClinic(user.clinic_id, {
        page: currentPage,
        limit: PAGE_SIZE,
      });
      const pageData = response?.data || [];
      const pagination = response?.pagination;
      setRemedies(pageData);
      setTotalItems(pagination?.total ?? pageData.length);
      setTotalPages(Math.max(1, pagination?.pages ?? 1));
    } catch (error) {
      toast.error('Failed to fetch remedies.');
      console.error(error);
      setRemedies([]);
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
    fetchRemedies();
  }, [fetchRemedies]);

  // --- Modal & Form Handlers ---

  const handleOpenAddModal = () => {
    setFormData(newFormState());
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (remedy: Remedy) => {
    setFormData({
      _id: remedy._id,
      name: remedy.name,
      times: remedy.times || '',
      quantity: remedy.quantity || '',
      days: remedy.days || '',
      note: remedy.note || '',
    });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!formData) return;
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev!, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData || !formData.name || !user?.clinic_id) return;
    setIsSaving(true);

    try {
      const dataToSave = {
        clinic_id: user.clinic_id,
        name: formData.name,
        times: formData.times || null,
        quantity: formData.quantity || null,
        days: formData.days || null,
        note: formData.note || null,
      };

      if (modalMode === 'add') {
        await remedyAPI.create(dataToSave);
      } else {
        await remedyAPI.update(formData._id!, dataToSave);
      }

      toast.success(`Remedy successfully ${modalMode === 'add' ? 'added' : 'updated'}!`);
      await fetchRemedies();
      handleCloseModal();
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error('This remedy already exists in your clinic.');
      } else {
        toast.error(`Failed to save remedy. ${error.response?.data?.message || error.message}`);
      }
    }
    setIsSaving(false);
  };

  const handleDelete = async (remedy: Remedy) => {
    if (!window.confirm(`Are you sure you want to delete "${remedy.name}"?`)) {
      return;
    }

    try {
      await remedyAPI.delete(remedy._id);
      toast.success('Remedy deleted.');
      if (remedies.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      } else {
        await fetchRemedies();
      }
    } catch (error: any) {
      toast.error(`Failed to delete remedy. ${error.response?.data?.message || error.message}`);
    }
  };
  
  const renderCell = (text: string | null) => (
    text || <span className="text-slate-400 italic">N/A</span>
  );

  return (
    <div>
      <Link to="/settings" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-4">
        <IconChevronLeft className="h-5 w-5" />
        Back to Settings
      </Link>
      
      <div className="p-6 bg-white border rounded-2xl">
        {/* --- Header --- */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Remedies</h2>
            <p className="text-sm text-slate-500 mt-1">Manage the list of remedies for your clinic.</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 mt-4 font-medium text-white transition rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 shadow-sm md:mt-0 hover:brightness-105 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <IconPlus className="h-5 w-5" />
            Add Remedy
          </button>
        </div>

        {/* --- Table --- */}
        <div className="mt-6 border border-slate-200 rounded-lg overflow-hidden">
          <div className="relative overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500">Name</th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500">Times</th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500">Quantity</th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500">Days</th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500">Note</th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {isLoading && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">Loading remedies...</td>
                  </tr>
                )}
                {!isLoading && remedies.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      <IconAlertCircle className="w-12 h-12 mx-auto text-slate-400" />
                      <p className="mt-2 font-medium">No remedies found.</p>
                      <p className="text-sm">Click "Add Remedy" to get started.</p>
                    </td>
                  </tr>
                )}
                {!isLoading && remedies.map(remedy => (
                  <tr key={remedy._id}>
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-slate-900">{remedy.name}</td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-slate-600">{renderCell(remedy.times)}</td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-slate-600">{renderCell(remedy.quantity)}</td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-slate-600">{renderCell(remedy.days)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">{renderCell(remedy.note)}</td>
                    <td className="flex items-center justify-end gap-2 px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                      <button onClick={() => handleOpenEditModal(remedy)} title="Edit" className="p-1.5 text-slate-500 hover:text-sky-600 rounded-md hover:bg-sky-100">
                        <IconPencil className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(remedy)} title="Delete" className="p-1.5 text-slate-500 hover:text-rose-600 rounded-md hover:bg-rose-100">
                        <IconTrash className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {isPageLoading && (
              <TableOverlayLoader />
            )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg p-6 bg-white border shadow-xl rounded-2xl">
            <form onSubmit={handleSubmit}>
              {/* Modal Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 id="modal-title" className="text-lg font-semibold text-slate-800">
                    {modalMode === 'add' ? 'Add Remedy' : 'Edit Remedy'}
                  </h3>
                </div>
                <button type="button" onClick={handleCloseModal} className="p-1 text-slate-400 rounded-full hover:bg-slate-100 hover:text-slate-600">
                  <IconX className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="mt-6 space-y-4">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Remedy Name</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <IconPill className="h-5 w-5 text-slate-400" />
                    </span>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      required
                      autoFocus
                      className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
                      placeholder="e.g., Paracetamol 500mg"
                    />
                  </div>
                </div>

                {/* Grid for other fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Times */}
                  <div>
                    <label htmlFor="times" className="block text-sm font-medium text-slate-700 mb-1">Times</label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <IconClockHour9 className="h-5 w-5 text-slate-400" />
                      </span>
                      <input
                        type="text"
                        id="times"
                        name="times"
                        value={formData.times}
                        onChange={handleFormChange}
                        className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
                        placeholder="e.g., 1-0-1"
                      />
                    </div>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <IconNumbers className="h-5 w-5 text-slate-400" />
                      </span>
                      <input
                        type="text"
                        id="quantity"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleFormChange}
                        className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
                        placeholder="e.g., 1 tab"
                      />
                    </div>
                  </div>
                  
                  {/* Days */}
                  <div>
                    <label htmlFor="days" className="block text-sm font-medium text-slate-700 mb-1">Days</label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <IconCalendar className="h-5 w-5 text-slate-400" />
                      </span>
                      <input
                        type="text"
                        id="days"
                        name="days"
                        value={formData.days}
                        onChange={handleFormChange}
                        className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
                        placeholder="e.g., 3 days"
                      />
                    </div>
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label htmlFor="note" className="block text-sm font-medium text-slate-700 mb-1">Note (Optional)</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute top-3 left-0 flex items-center pl-3">
                      <IconNote className="h-5 w-5 text-slate-400" />
                    </span>
                    <textarea
                      id="note"
                      name="note"
                      value={formData.note}
                      onChange={handleFormChange}
                      rows={3}
                      className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
                      placeholder="e.g., 'Take after food'"
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
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-5 py-2 text-white font-medium shadow-sm hover:brightness-105 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  <IconDeviceFloppy className="h-5 w-5"/>
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
