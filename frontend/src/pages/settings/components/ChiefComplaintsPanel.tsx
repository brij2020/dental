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
} from '@tabler/icons-react';
import {
  getChiefComplaints,
  createChiefComplaint,
  updateChiefComplaint,
  deleteChiefComplaint,
} from '../../../lib/apiClient';
import { useAuth } from '../../../state/useAuth';

type ChiefComplaint = {
  _id: string;
  clinic_id: string;
  name: string;
  value: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type ChiefComplaintFormData = {
  id: string | null;
  name: string;
  value: string;
};

const newFormState = (): ChiefComplaintFormData => ({
  id: null,
  name: '',
  value: '',
});

export default function ChiefComplaintsPanel() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<ChiefComplaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState<ChiefComplaintFormData | null>(null);

  const fetchComplaints = useCallback(async () => {
    if (!user?.clinic_id) return;

    setIsLoading(true);
    try {
      const response = await getChiefComplaints();
      if (response.data.status === 'success') {
        setComplaints(response.data.data || []);
      } else {
        toast.error('Failed to fetch chief complaints.');
      }
    } catch (error) {
      toast.error('Failed to fetch chief complaints.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.clinic_id]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const handleOpenAddModal = () => {
    setFormData(newFormState());
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (complaint: ChiefComplaint) => {
    setFormData({
      id: complaint._id,
      name: complaint.name,
      value: complaint.value,
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
    if (!formData) return;

    if (!formData.name.trim() || !formData.value.trim()) {
      toast.error('Name and value are required.');
      return;
    }

    setIsSaving(true);

    const dataToSave = {
      name: formData.name.trim(),
      value: formData.value.trim(),
    };

    try {
      let response;
      if (modalMode === 'add') {
        response = await createChiefComplaint(dataToSave);
      } else {
        response = await updateChiefComplaint(formData.id!, dataToSave);
      }

      if (response.data.status === 'success') {
        toast.success(`Chief complaint ${modalMode === 'add' ? 'created' : 'updated'} successfully.`);
        await fetchComplaints();
        handleCloseModal();
      } else {
        toast.error(response.data.message || 'Failed to save chief complaint.');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || error.message || 'Failed to save chief complaint.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (complaint: ChiefComplaint) => {
    if (!window.confirm(`Are you sure you want to delete "${complaint.name}"?`)) {
      return;
    }

    try {
      const response = await deleteChiefComplaint(complaint._id);
      if (response.data.status === 'success') {
        setComplaints(complaints.filter(c => c._id !== complaint._id));
        toast.success('Chief complaint deleted successfully.');
      } else {
        toast.error(response.data.message || 'Failed to delete chief complaint.');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || error.message || 'Failed to delete chief complaint.');
    }
  };

  return (
    <div>
      <Link to="/settings" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-4">
        <IconChevronLeft className="h-5 w-5" />
        Back to Settings
      </Link>

      <div className="p-6 bg-white border rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Chief Complaints</h2>
            <p className="text-sm text-slate-500 mt-1">Manage the list of chief complaints for your clinic.</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 mt-4 font-medium text-white transition rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 shadow-sm md:mt-0 hover:brightness-105 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <IconPlus className="h-5 w-5" />
            Add Chief Complaint
          </button>
        </div>

        <div className="mt-6 border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500">Name</th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500">Value</th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {isLoading && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-500">Loading chief complaints...</td>
                  </tr>
                )}
                {!isLoading && complaints.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-500">
                      <IconAlertCircle className="w-12 h-12 mx-auto text-slate-400" />
                      <p className="mt-2 font-medium">No chief complaints found.</p>
                      <p className="text-sm">Click "Add Chief Complaint" to get started.</p>
                    </td>
                  </tr>
                )}
                {!isLoading && complaints.map(complaint => (
                  <tr key={complaint._id}>
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-slate-900">{complaint.name}</td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-slate-600">{complaint.value}</td>
                    <td className="px-6 py-4 text-sm text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEditModal(complaint)}
                        className="p-1.5 text-slate-500 hover:text-sky-600 rounded-md hover:bg-sky-100"
                        title="Edit"
                      >
                        <IconPencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(complaint)}
                        className="p-1.5 ml-2 text-slate-500 hover:text-rose-600 rounded-md hover:bg-rose-100"
                        title="Delete"
                      >
                        <IconTrash className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-slate-800">
                {modalMode === 'add' ? 'Add Chief Complaint' : 'Edit Chief Complaint'}
              </h3>
              <button onClick={handleCloseModal} className="p-1 rounded-md hover:bg-slate-100">
                <IconX className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData?.name || ''}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Toothache"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Value</label>
                <input
                  type="text"
                  name="value"
                  value={formData?.value || ''}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., PAIN_TOOTH"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border rounded-xl hover:bg-slate-50"
                >
                  <IconX className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
                >
                  <IconDeviceFloppy className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
