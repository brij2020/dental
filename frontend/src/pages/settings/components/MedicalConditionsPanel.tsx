import  { useState, useEffect, type FormEvent, useCallback } from 'react';
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
  IconHeartbeat,
  IconForms
} from '@tabler/icons-react';
import { useAuth } from '../../../state/useAuth';
import {
  getMedicalConditions,
  createMedicalCondition,
  updateMedicalCondition,
  deleteMedicalCondition,
} from '../../../lib/apiClient';

// --- Types ---
type MedicalCondition = {
  _id: string;
  name: string;
  clinic_id: string;
  has_value: boolean;
  is_active: boolean;
  description?: string;
  sar?: string;
};

type ConditionFormData = {
  id: string | null;
  name: string;
  has_value: boolean;
  sar?: string;
};

// --- Main Panel Component ---
export default function MedicalConditionsPanel() {
  const { user } = useAuth();
  const [conditions, setConditions] = useState<MedicalCondition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState<ConditionFormData | null>(null);

  // Fetch conditions FOR THE USER'S CLINIC

  const fetchConditions = useCallback(async () => {
    setIsLoading(true);
    try {
      let allConditions = [];
      if (user?.role === 'super_admin') {
        // Super admin: only global
        const response = await getMedicalConditions('system');
        allConditions = response.data?.data || [];
      } else {
        // Clinic: fetch both global and clinic-specific
        const [globalRes, clinicRes] = await Promise.all([
          getMedicalConditions('system'),
          user?.clinic_id ? getMedicalConditions(user.clinic_id) : Promise.resolve({ data: { data: [] } })
        ]);
        const global = globalRes.data?.data || [];
        const clinic = clinicRes.data?.data || [];
        // Merge, clinic-specific can override global if needed (by name)
        // Deduplicate by name: if a clinic-specific condition has the same name as a global one, use the clinic-specific
        const clinicNames = new Set(clinic.map((c: MedicalCondition) => c.name.trim().toLowerCase()));
        const dedupedGlobal = global.filter((g: MedicalCondition) => !clinicNames.has(g.name.trim().toLowerCase()));
        const merged = [...dedupedGlobal, ...clinic];
        allConditions = merged;
      }
      setConditions(allConditions);
    } catch (error) {
      toast.error('Failed to fetch medical conditions.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.clinic_id, user?.role]);

  useEffect(() => {
    fetchConditions();
  }, [fetchConditions]);

  // --- Modal & Form Handlers ---

  const handleOpenAddModal = () => {
    setFormData({ id: null, name: '', has_value: false, sar: '' });
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (condition: MedicalCondition) => {
    setFormData({
      id: condition._id,
      name: condition.name,
      has_value: condition.has_value,
      sar: condition.sar || '',
    });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData || !formData.name || !user?.clinic_id) return;
    setIsSaving(true);

    try {
      const conditionData = {
        name: formData.name.trim(),
        has_value: formData.has_value,
        clinic_id: user?.role === 'super_admin' ? 'system' : user.clinic_id,
        sar: formData.sar?.trim() || undefined,
      };

      if (modalMode === 'add') {
        const response = await createMedicalCondition(conditionData);
        setConditions([...conditions, response.data?.data]);
        toast.success('Condition successfully added!');
      } else {
        const response = await updateMedicalCondition(formData.id!, conditionData);
        setConditions(
          conditions.map(c => (c._id === formData.id ? response.data?.data : c))
        );
        toast.success('Condition successfully updated!');
      }

      handleCloseModal();
    } catch (error: any) {
      console.error(error);
      const errorMsg = error?.response?.data?.message || error.message || 'Failed to save condition';
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (condition: MedicalCondition) => {
    if (!window.confirm(`Are you sure you want to delete "${condition.name}"?`)) {
      return;
    }

    try {
      await deleteMedicalCondition(condition._id);
      setConditions(conditions.filter(c => c._id !== condition._id));
      toast.success('Condition deleted successfully.');
    } catch (error: any) {
      console.error(error);
      const errorMsg = error?.response?.data?.message || error.message || 'Failed to delete condition';
      toast.error(errorMsg);
    }
  };
  
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
            <h2 className="text-lg font-semibold text-slate-800">Medical Conditions</h2>
            <p className="text-sm text-slate-500 mt-1">Manage the list of medical conditions for your clinic.</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 mt-4 font-medium text-white transition rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 shadow-sm md:mt-0 hover:brightness-105 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <IconPlus className="h-5 w-5" />
            Add Condition
          </button>
        </div>

        {/* --- Table --- */}
        <div className="mt-6 border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500">Condition Name</th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {isLoading && (
                  <tr>
                    <td colSpan={2} className="p-8 text-center text-slate-500">Loading conditions...</td>
                  </tr>
                )}
                {!isLoading && conditions.length === 0 && (
                  <tr>
                    <td colSpan={2} className="p-8 text-center text-slate-500">
                      <IconAlertCircle className="w-12 h-12 mx-auto text-slate-400" />
                      <p className="mt-2 font-medium">No conditions found.</p>
                      <p className="text-sm">Click "Add Condition" to get started.</p>
                    </td>
                  </tr>
                )}
                {!isLoading && conditions.map(condition => (
                  <tr key={condition._id}>
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-slate-900">
                      <div className="flex items-center gap-3">
                        <span>{condition.name}</span>
                        {condition.has_value && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                            <IconForms className="w-3 h-3" />
                            Input Required
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="flex items-center justify-end gap-2 px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                      <button onClick={() => handleOpenEditModal(condition)} title="Edit" className="p-1.5 text-slate-500 hover:text-sky-600 rounded-md hover:bg-sky-100">
                        <IconPencil className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(condition)} title="Delete" className="p-1.5 text-slate-500 hover:text-rose-600 rounded-md hover:bg-rose-100">
                        <IconTrash className="w-5 h-5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg p-6 bg-white border shadow-xl rounded-2xl">
            <form onSubmit={handleSubmit}>
              {/* Modal Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 id="modal-title" className="text-lg font-semibold text-slate-800">
                    {modalMode === 'add' ? 'Add Medical Condition' : 'Edit Medical Condition'}
                  </h3>
                </div>
                <button type="button" onClick={handleCloseModal} className="p-1 text-slate-400 rounded-full hover:bg-slate-100 hover:text-slate-600">
                  <IconX className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="mt-6 space-y-5">
                {/* Condition Name Input */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Condition Name</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <IconHeartbeat className="h-5 w-5 text-slate-400" />
                    </span>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      autoFocus
                      className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
                      placeholder="e.g., Gingivitis, Fever"
                    />
                  </div>
                </div>

                {/* SAR Field */}
                <div>
                  <label htmlFor="sar" className="block text-sm font-medium text-slate-700 mb-1">SAR</label>
                  <input
                    type="text"
                    id="sar"
                    name="sar"
                    value={formData.sar || ''}
                    onChange={(e) => setFormData({ ...formData, sar: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
                    placeholder="SAR value (optional)"
                  />
                </div>

                {/* Has Value Checkbox */}
                <div className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50/50">
                  <div className="flex items-center h-5">
                    <input
                      id="has_value"
                      name="has_value"
                      type="checkbox"
                      checked={formData.has_value}
                      onChange={(e) => setFormData({ ...formData, has_value: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                    />
                  </div>
                  <div className="text-sm">
                    <label htmlFor="has_value" className="font-medium text-slate-900 cursor-pointer">
                      Requires Input Value?
                    </label>
                    <p className="text-slate-500 mt-0.5">
                      Enable this if you need to record a specific value (e.g., "102F", "120/80") when this condition is selected.
                    </p>
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