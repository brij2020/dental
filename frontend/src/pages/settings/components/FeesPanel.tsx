import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from 'react';
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
  IconNumbers,
  IconReceiptTax,
  IconNote,
  IconUser,
} from '@tabler/icons-react';
import { useAuth } from '../../../state/useAuth';
import {
  getAllFeesByClinicId,
  createFee,
  updateFee,
  deleteFee,
} from '../../../lib/apiClient';
import { getAllProfiles } from '../../../lib/apiClient';

type ModalMode = 'add' | 'edit';

interface Fee {
  _id?: string;
  id?: string;
  clinic_id: string;
  doctor_id?: string | null;
  cost_fees: number;
  gst_number?: string | null;
  note?: string | null;
}

interface Doctor {
  _id: string;
  full_name: string;
  role: string;
}

export default function FeesPanel() {
  const { user } = useAuth();
  const [fees, setFees] = useState<Fee[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('add');
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [costFees, setCostFees] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [note, setNote] = useState('');

  const clinicId = user?.clinic_id;

  const fetchFees = useCallback(async () => {
    if (!clinicId) return;

    setIsLoading(true);
    try {
      const response = await getAllFeesByClinicId(clinicId);
      setFees(response.data?.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch fees.');
    } finally {
      setIsLoading(false);
    }
  }, [clinicId]);

  const fetchDoctors = useCallback(async () => {
    if (!clinicId) return;

    try {
      const response = await getAllProfiles();
      if (response.status === 200 && response.data) {
        const profileData = response.data.data || response.data;
        const profiles = Array.isArray(profileData) ? profileData : [profileData];
        
        const mappedDoctors = profiles
          .filter((doc: any) => doc.role === 'doctor' || doc.role === 'admin')
          .map((doc: any) => ({
            _id: doc._id || doc.id,
            full_name: doc.full_name,
            role: doc.role,
          }));
        
        setDoctors(mappedDoctors);
      }
    } catch (error: any) {
      console.error('Error fetching doctors:', error);
    }
  }, [clinicId]);

  useEffect(() => {
    fetchFees();
    fetchDoctors();
  }, [fetchFees, fetchDoctors]);

  const openAddModal = () => {
    setModalMode('add');
    setEditingFeeId(null);
    setSelectedDoctorId('');
    setCostFees('');
    setGstNumber('');
    setNote('');
    setIsModalOpen(true);
  };

  const openEditModal = (fee: Fee) => {
    setModalMode('edit');
    setEditingFeeId(fee._id || fee.id || '');
    setSelectedDoctorId(fee.doctor_id || '');
    setCostFees(fee.cost_fees?.toString() ?? '');
    setGstNumber(fee.gst_number ?? '');
    setNote(fee.note ?? '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDoctorId('');
    setCostFees('');
    setGstNumber('');
    setNote('');
    setEditingFeeId(null);
  };

  const saveFeeToApi = async (feeData: Partial<Fee>) => {
    if (!clinicId) return false;

    setIsSaving(true);
    try {
      if (modalMode === 'add') {
        const response = await createFee({
          ...feeData,
          clinic_id: clinicId,
        });

        setFees([...fees, response.data?.data]);
        toast.success('Fee created successfully');
        return true;
      } else if (modalMode === 'edit' && editingFeeId) {
        const response = await updateFee(editingFeeId, feeData);

        setFees(
          fees.map(f => (f._id === editingFeeId || f.id === editingFeeId ? response.data?.data : f))
        );
        toast.success('Fee updated successfully');
        return true;
      }
    } catch (error: any) {
      console.error(error);
      const errorMsg = error?.response?.data?.message || error.message || 'Failed to save fee';
      toast.error(errorMsg);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!clinicId) return;

    const parsedCost = parseFloat(costFees);
    if (Number.isNaN(parsedCost) || parsedCost < 0) {
      toast.error('Please enter a valid fee amount.');
      return;
    }

    // Check for duplicate doctor (excluding current fee if editing)
    const isDuplicate = fees.some(
      f =>
        (f.doctor_id || null) === (selectedDoctorId || null) &&
        (modalMode === 'add' || (f._id !== editingFeeId && f.id !== editingFeeId))
    );

    if (isDuplicate) {
      toast.error('A fee already exists for this doctor');
      return;
    }

    const feeData = {
      doctor_id: selectedDoctorId || null,
      cost_fees: parsedCost,
      gst_number: gstNumber || null,
      note: note || null,
    };

    const ok = await saveFeeToApi(feeData);
    if (ok) {
      closeModal();
      fetchFees();
    }
  };

  const handleDelete = async (fee: Fee) => {
    const feeId = fee._id || fee.id;
    if (!feeId) return;

    if (
      !window.confirm(
        `Are you sure you want to delete this fee${fee.doctor_id ? ' for this doctor' : ''}?`
      )
    ) {
      return;
    }

    try {
      setIsSaving(true);
      await deleteFee(feeId);

      setFees(fees.filter(f => (f._id || f.id) !== feeId));
      toast.success('Fee deleted successfully');
    } catch (error: any) {
      console.error(error);
      const errorMsg = error?.response?.data?.message || error.message || 'Failed to delete fee';
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const getDoctorName = (doctorId: string | null | undefined) => {
    if (!doctorId) return 'Clinic-wide (All Doctors)';
    const doctor = doctors.find(d => d._id === doctorId);
    return doctor ? doctor.full_name : 'Unknown Doctor';
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
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Fees</h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage consultation fees for your clinic. Create clinic-wide fees or set fees per doctor.
            </p>
          </div>
          <button
            onClick={openAddModal}
            disabled={isLoading}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-2 font-medium text-white shadow-sm transition hover:brightness-105 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 md:mt-0"
          >
            <IconPlus className="h-5 w-5" />
            Add Fee
          </button>
        </div>

        {/* Table */}
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
                  >
                    Doctor
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
                  >
                    Cost / Fees
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
                  >
                    GST Number
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
                      colSpan={4}
                      className="p-8 text-center text-slate-500"
                    >
                      Loading fees...
                    </td>
                  </tr>
                )}

                {!isLoading && fees.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-8 text-center text-slate-500"
                    >
                      <IconAlertCircle className="mx-auto h-12 w-12 text-slate-400" />
                      <p className="mt-2 font-medium">No fees found.</p>
                      <p className="text-sm">
                        Click &quot;Add Fee&quot; to get started.
                      </p>
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  fees.map((fee) => (
                    <tr key={fee._id || fee.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                        {getDoctorName(fee.doctor_id)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        ₹{fee.cost_fees?.toLocaleString('en-IN') || '0'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        {fee.gst_number || '-'}
                      </td>
                      <td className="flex items-center justify-end gap-2 px-6 py-4 text-right text-sm font-medium">
                        <button
                          onClick={() => openEditModal(fee)}
                          title="Edit"
                          className="rounded-md p-1.5 text-slate-500 hover:bg-sky-100 hover:text-sky-600"
                        >
                          <IconPencil className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(fee)}
                          title="Delete"
                          disabled={isSaving}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-rose-100 hover:text-rose-600 disabled:opacity-50"
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          aria-labelledby="fee-modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-xl">
            <form onSubmit={handleSubmit}>
              {/* Modal Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3
                    id="fee-modal-title"
                    className="text-lg font-semibold text-slate-800"
                  >
                    {modalMode === 'add' ? 'Add Fee' : 'Edit Fee'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <IconX className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="doctor_id"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Doctor (Optional)
                  </label>
                  <div className="relative">
                    <IconUser className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    <select
                      id="doctor_id"
                      value={selectedDoctorId}
                      onChange={e => setSelectedDoctorId(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-300/40"
                    >
                      <option value="">Clinic-wide (All Doctors)</option>
                      {doctors.map((doctor) => (
                        <option key={doctor._id} value={doctor._id}>
                          {doctor.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Leave empty for clinic-wide fee, or select a specific doctor
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="cost_fees"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Cost / Fees <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <IconNumbers className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    <input
                      type="number"
                      id="cost_fees"
                      min="0"
                      step="0.01"
                      value={costFees}
                      onChange={e => setCostFees(e.target.value)}
                      required
                      autoFocus
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-300/40"
                      placeholder="500"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="gst_number"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    GST Number (Optional)
                  </label>
                  <div className="relative">
                    <IconReceiptTax className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      id="gst_number"
                      value={gstNumber}
                      onChange={e => setGstNumber(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-300/40"
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="note"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Note (Optional)
                  </label>
                  <div className="relative">
                    <IconNote className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <textarea
                      id="note"
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-300/40"
                      placeholder="Any extra notes..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-8 flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={closeModal}
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
