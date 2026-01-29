import { useEffect, useState } from 'react';
import { useAuth } from '../../../state/useAuth';
import { toast } from 'react-toastify';
import {
  IconSearch,
  IconTrash,
  IconEdit,
  IconDownload,
  IconChevronLeft,
  IconChevronRight,
  IconArrowUp,
  IconArrowDown,
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
  dob?: string;
  gender?: string;
  uhid?: string;
  clinic_id?: string;
  registration_type?: string;
  createdAt?: string;
}

export default function PatientPanel() {
  const { user } = useAuth();
  const clinicId = user?.clinic_id ?? null;

  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<'age' | 'name' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Modal states
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState<Partial<Patient>>({});
  const [showEditModal, setShowEditModal] = useState(false);

  // Fetch patients
  useEffect(() => {
    const fetchPatients = async () => {
      if (!clinicId) return;

      setLoading(true);
      try {
        const response = await getAllPatients({
          clinic_id: clinicId,
          limit: 1000, // Get all patients
        });
        setPatients(response.data?.data || []);
      } catch (error) {
        console.error('Error fetching patients:', error);
        toast.error('Failed to fetch patients');
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [clinicId]);

  // Calculate age from DOB
  const calculateAge = (dob?: string): number | null => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  };

  // Filter and sort patients
  useEffect(() => {
    let filtered = patients.filter((patient) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        patient.full_name?.toLowerCase().includes(searchLower) ||
        patient.email?.toLowerCase().includes(searchLower) ||
        patient.phone?.includes(searchTerm) ||
        patient.uhid?.toLowerCase().includes(searchLower)
      );
    });

    // Apply sorting
    if (sortColumn === 'age') {
      filtered.sort((a, b) => {
        const ageA = calculateAge(a.dob) ?? -1;
        const ageB = calculateAge(b.dob) ?? -1;
        return sortDirection === 'asc' ? ageA - ageB : ageB - ageA;
      });
    } else if (sortColumn === 'name') {
      filtered.sort((a, b) => {
        const nameA = a.full_name?.toLowerCase() ?? '';
        const nameB = b.full_name?.toLowerCase() ?? '';
        return sortDirection === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      });
    }

    setFilteredPatients(filtered);
    setCurrentPage(1);
  }, [searchTerm, patients, sortColumn, sortDirection]);

  // Handle sort click
  const handleSort = (column: 'age' | 'name') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Handle edit patient
  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData(patient);
    setShowEditModal(true);
  };

  // Handle update patient
  const handleUpdate = async () => {
    if (!editingPatient) return;

    try {
      await updatePatient(editingPatient._id, formData);
      setPatients(
        patients.map((p) => (p._id === editingPatient._id ? { ...p, ...formData } : p))
      );
      setShowEditModal(false);
      setEditingPatient(null);
      toast.success('Patient updated successfully');
    } catch (error) {
      console.error('Error updating patient:', error);
      toast.error('Failed to update patient');
    }
  };

  // Handle delete patient
  const handleDelete = async (patientId: string) => {
    if (!window.confirm('Are you sure you want to delete this patient?')) return;

    try {
      await deletePatient(patientId);
      setPatients(patients.filter((p) => p._id !== patientId));
      toast.success('Patient deleted successfully');
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast.error('Failed to delete patient');
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedPatients.size === 0) {
      toast.error('No patients selected');
      return;
    }

    if (!window.confirm(`Delete ${selectedPatients.size} patient(s)?`)) return;

    try {
      await bulkDeletePatients(Array.from(selectedPatients));
      setPatients(patients.filter((p) => !selectedPatients.has(p._id)));
      setSelectedPatients(new Set());
      toast.success('Patients deleted successfully');
    } catch (error) {
      console.error('Error deleting patients:', error);
      toast.error('Failed to delete patients');
    }
  };

  // Toggle patient selection
  const togglePatientSelection = (patientId: string) => {
    const newSelected = new Set(selectedPatients);
    if (newSelected.has(patientId)) {
      newSelected.delete(patientId);
    } else {
      newSelected.add(patientId);
    }
    setSelectedPatients(newSelected);
  };

  // Toggle all selection
  const toggleAllSelection = () => {
    if (selectedPatients.size === paginatedPatients.length) {
      setSelectedPatients(new Set());
    } else {
      const newSelected = new Set(paginatedPatients.map((p) => p._id));
      setSelectedPatients(newSelected);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'UHID', 'Gender', 'DOB'];
    const rows = filteredPatients.map((p) => [
      p.full_name,
      p.email,
      p.phone,
      p.uhid || '',
      p.gender || '',
      p.dob || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patients_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!clinicId) {
    return (
      <div className="flex items-center justify-center p-8 text-center">
        <div className="text-gray-500">Please select a clinic first</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Patient Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            Total: {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <IconDownload size={18} />
            Export CSV
          </button>
          {selectedPatients.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              <IconTrash size={18} />
              Delete {selectedPatients.size}
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <IconSearch
          size={20}
          className="absolute left-3 top-3 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search by name, email, phone, or UHID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="text-gray-500 mt-2">Loading patients...</p>
        </div>
      ) : paginatedPatients.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? 'No patients found matching your search' : 'No patients found'}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">
                    <input
                      type="checkbox"
                      checked={
                        selectedPatients.size === paginatedPatients.length &&
                        paginatedPatients.length > 0
                      }
                      onChange={toggleAllSelection}
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                    />
                  </th>
                  <th 
                    className="px-6 py-3 font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Name
                      {sortColumn === 'name' && (
                        sortDirection === 'asc' ? <IconArrowUp size={16} /> : <IconArrowDown size={16} />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-3 font-semibold text-gray-900">Phone</th>
                  <th className="px-6 py-3 font-semibold text-gray-900">UHID</th>
                  <th className="px-6 py-3 font-semibold text-gray-900">Gender</th>
                  <th 
                    className="px-6 py-3 font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('age')}
                  >
                    <div className="flex items-center gap-2">
                      Age
                      {sortColumn === 'age' && (
                        sortDirection === 'asc' ? <IconArrowUp size={16} /> : <IconArrowDown size={16} />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedPatients.map((patient) => (
                  <tr
                    key={patient._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedPatients.has(patient._id)}
                        onChange={() => togglePatientSelection(patient._id)}
                        className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {patient.full_name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{patient.email}</td>
                    <td className="px-6 py-4 text-gray-600">{patient.phone}</td>
                    <td className="px-6 py-4 text-gray-600">{patient.uhid || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{patient.gender || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{calculateAge(patient.dob) !== null ? `${calculateAge(patient.dob)} years` : '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
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
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IconChevronLeft size={18} />
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IconChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      {showEditModal && editingPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Edit Patient</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.full_name || ''}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  value={formData.gender || ''}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dob ? formData.dob.split('T')[0] : ''}
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
