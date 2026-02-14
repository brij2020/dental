import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../state/useAuth';
import { toast } from 'react-toastify';
import {
  IconSearch,
  IconTrash,
  IconEdit,
  IconDownload,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';
import {
  getAllPatients,
  updatePatient,
  deletePatient,
  bulkDeletePatients,
} from '../../../lib/apiClient';

interface Patient {
  _id: string;
  full_name: string;
  email: string;
  phone: string;
  contact_number?: string;
  dob?: string;
  date_of_birth?: string;
  gender?: string;
  uhid?: string;
  registration_type?: string;
  clinic_id?: string;
  subscription?: string;
  subscription_plan?: string;
  plan_name?: string;
  createdAt?: string;
  created_at?: string;
}

const ITEMS_PER_PAGE = 25;
const formatDate = (value?: string) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('en-IN');
};

const escapeCsvValue = (value?: string | null) => {
  if (!value) return '';
  return `"${value.replace(/"/g, '""')}"`;
};

export default function PatientPanel() {
  const { user } = useAuth();
  const clinicId = user?.clinic_id ?? null;

  const [patients, setPatients] = useState<Patient[]>([]);
  const [globalSearch, setGlobalSearch] = useState('');
  const [registeredFrom, setRegisteredFrom] = useState('');
  const [registeredTo, setRegisteredTo] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    search: '',
    from: '',
    to: '',
  });
  const [paginationMeta, setPaginationMeta] = useState({
    page: 1,
    total: 0,
    pages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set());
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState<Partial<Patient>>({});
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchPatients = useCallback(
    async (
      page = 1,
      searchTermValue?: string,
      registeredFromValue?: string,
      registeredToValue?: string
    ) => {
      setLoading(true);
      try {
        const params: Record<string, any> = {
          page,
          limit: ITEMS_PER_PAGE,
        };

      if (clinicId) {
        params.clinic_id = clinicId;
      }

      const search = (searchTermValue || '').trim();
      if (search) {
        params.search = search;
      }
      if (registeredFromValue) {
        params.registered_from = registeredFromValue;
      }
      if (registeredToValue) {
        params.registered_to = registeredToValue;
      }

        const response = await getAllPatients(params);
        const payload = response.data;
        const total = payload?.pagination?.total ?? payload?.data?.length ?? 0;
        const limit = payload?.pagination?.limit || ITEMS_PER_PAGE;
        const computedPages = Math.max(1, Math.ceil(total / Math.max(1, limit)));

        setPatients(payload?.data || []);
        setPaginationMeta({
          page: payload?.pagination?.page || page,
          total,
          pages: payload?.pagination?.pages || computedPages,
        });
        setSelectedPatients(new Set());
      } catch (error) {
        console.error('Error fetching patients:', error);
        toast.error('Failed to load patients');
      } finally {
        setLoading(false);
      }
    },
    [clinicId]
  );

  useEffect(() => {
    fetchPatients(1, activeFilters.search, activeFilters.from, activeFilters.to);
  }, [clinicId, fetchPatients, activeFilters]);

  const togglePatientSelection = (patientId: string) => {
    const newSelected = new Set(selectedPatients);
    if (newSelected.has(patientId)) {
      newSelected.delete(patientId);
    } else {
      newSelected.add(patientId);
    }
    setSelectedPatients(newSelected);
  };

  const toggleAllSelection = () => {
    if (selectedPatients.size === patients.length && patients.length > 0) {
      setSelectedPatients(new Set());
      return;
    }
    setSelectedPatients(new Set(patients.map((p) => p._id)));
  };

  const handleDownloadPatients = () => {
    if (patients.length === 0) {
      toast.info('No patients to download');
      return;
    }

    const headers = ['Name', 'Gender', 'DOB', 'UHID', 'Contact', 'Registered On', 'Subscription', 'Email'];
    const rows = patients.map((patient) => [
      escapeCsvValue(patient.full_name),
      escapeCsvValue(patient.gender || '-'),
      escapeCsvValue(patient.date_of_birth || patient.dob || '-'),
      escapeCsvValue(patient.uhid || '-'),
      escapeCsvValue(patient.phone || patient.contact_number),
      escapeCsvValue(patient.createdAt || patient.created_at || '-'),
      escapeCsvValue(
        patient.subscription_plan?.trim() ||
          patient.subscription?.trim() ||
          patient.plan_name?.trim() ||
          'Free Plan'
      ),
      escapeCsvValue(patient.email),
    ]);

    const csvContent = [headers.map((header) => `"${header}"`).join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const blobUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = `patients_${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    window.URL.revokeObjectURL(blobUrl);
  };

  const handleDelete = async (patientId: string) => {
    if (!window.confirm('Are you sure you want to delete this patient?')) return;

    try {
      await deletePatient(patientId);
      toast.success('Patient deleted successfully');
      await fetchPatients(
        paginationMeta.page,
        activeFilters.search,
        activeFilters.from,
        activeFilters.to
      );
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast.error('Failed to delete patient');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPatients.size === 0) {
      toast.error('No patients selected');
      return;
    }
    if (!window.confirm(`Delete ${selectedPatients.size} selected patient(s)?`)) return;

    try {
      await bulkDeletePatients(Array.from(selectedPatients));
      toast.success('Patients deleted successfully');
      await fetchPatients(
        paginationMeta.page,
        activeFilters.search,
        activeFilters.from,
        activeFilters.to
      );
    } catch (error) {
      console.error('Bulk delete failed:', error);
      toast.error('Failed to delete selected patients');
    }
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData(patient);
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editingPatient) return;
    try {
      await updatePatient(editingPatient._id, formData);
      toast.success('Patient updated');
      setShowEditModal(false);
      setEditingPatient(null);
      await fetchPatients(
        paginationMeta.page,
        activeFilters.search,
        activeFilters.from,
        activeFilters.to
      );
    } catch (error) {
      console.error('Error updating patient:', error);
      toast.error('Failed to update patient');
    }
  };

  const goToPage = (direction: 'prev' | 'next') => {
    const targetPage =
      direction === 'prev'
        ? Math.max(1, paginationMeta.page - 1)
        : Math.min(paginationMeta.pages, paginationMeta.page + 1);
    if (targetPage === paginationMeta.page) return;
    fetchPatients(targetPage, activeFilters.search, activeFilters.from, activeFilters.to);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold text-gray-900">Patient Management</h2>
        <p className="text-sm text-gray-500">
          Showing {patients.length} of {paginationMeta.total} patient{paginationMeta.total !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            setActiveFilters({
              search: globalSearch,
              from: registeredFrom,
              to: registeredTo,
            });
          }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="relative flex-1">
              <IconSearch size={18} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Search by name, UHID, contact, age, or DOB"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-full hover:bg-indigo-700 transition"
            >
              <IconSearch size={14} />
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setGlobalSearch('');
                setRegisteredFrom('');
                setRegisteredTo('');
                setActiveFilters({ search: '', from: '', to: '' });
              }}
              className="inline-flex items-center gap-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition"
            >
              Clear filters
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-2">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Registered from</label>
              <input
                type="date"
                value={registeredFrom}
                onChange={(e) => setRegisteredFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Registered to</label>
              <input
                type="date"
                value={registeredTo}
                onChange={(e) => setRegisteredTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRegisteredFrom('');
                  setRegisteredTo('');
                  fetchPatients(1, globalSearch, '', '');
                }}
                className="px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded-full hover:bg-gray-200 transition"
              >
                Clear dates
              </button>
            </div>
          </div>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleDownloadPatients}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <IconDownload size={16} />
            Download Excel
          </button>
          {selectedPatients.size > 0 && (
            <button
              type="button"
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
            >
              <IconTrash size={16} />
              Delete {selectedPatients.size}
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="text-gray-500 mt-2">Loading patients...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No patients found</div>
        ) : (
          <table className="min-w-full table-fixed text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-12">
                  <input
                    type="checkbox"
                    checked={selectedPatients.size === patients.length && patients.length > 0}
                    onChange={toggleAllSelection}
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Name</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Gender</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">DOB</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">UHID</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Contact</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Registered On</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Subscription Plan</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Email</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.map((patient, index) => (
                <tr
                  key={patient._id}
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'} hover:bg-slate-100/60 transition-colors`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedPatients.has(patient._id)}
                      onChange={() => togglePatientSelection(patient._id)}
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{patient.full_name}</td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{patient.gender || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(patient.date_of_birth || patient.dob)}</td>
                  <td className="px-4 py-3 text-slate-600">{patient.uhid || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{patient.phone || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(patient.createdAt || patient.created_at)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {(patient.subscription_plan?.trim() ||
                      patient.subscription?.trim() ||
                      patient.plan_name?.trim() ||
                      'Free Plan')}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{patient.email || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(patient)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit patient"
                      >
                        <IconEdit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(patient._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete patient"
                      >
                        <IconTrash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {paginationMeta.pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => goToPage('prev')}
            disabled={paginationMeta.page === 1}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <IconChevronLeft size={18} />
          </button>
          <span className="text-sm text-gray-600">Page {paginationMeta.page} of {paginationMeta.pages}</span>
          <button
            onClick={() => goToPage('next')}
            disabled={paginationMeta.page === paginationMeta.pages}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <IconChevronRight size={18} />
          </button>
        </div>
      )}

      {showEditModal && editingPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Edit Patient</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name || ''}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={formData.gender || ''}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer not to say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={(formData.date_of_birth || formData.dob || '').split('T')[0]}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="flex-1 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
