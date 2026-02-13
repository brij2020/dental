import  { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../state/useAuth';
import { toast } from 'react-toastify';
import { IconUserCircle, IconCheck, IconTrash } from '@tabler/icons-react';
import SearchBar from './components/SearchBar';
import PatientList from './components/PatientList';
import AddPatientModal from './components/AddPatientModal';
import NewPatientModal from './components/NewPatientModal';
import BookAppointmentModal from './components/BookAppointmentModal';

import { getAllPatients, getAllClinicPanels, getClinicAppointments, deleteAppointment } from '../../lib/apiClient';
import type { ClinicPatientRow } from './types';

export default function Patients() {
  const { user } = useAuth();
  const clinicId = user?.clinic_id ?? null;

  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<ClinicPatientRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'patients' | 'provisional'>('patients');
  const [provisionalAppointments, setProvisionalAppointments] = useState<any[]>([]);
  const [provisionalCurrentPage, setProvisionalCurrentPage] = useState(1);
  const [provisionalPageSize] = useState(10);
  const [provisionalTotalPages, setProvisionalTotalPages] = useState(1);
  const [provisionalTotalCount, setProvisionalTotalCount] = useState(0);
  const [provisionalLoading, setProvisionalLoading] = useState(false);
  const [provisionalQuery, setProvisionalQuery] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number } | null>(null);

  // Menu open handled via React state. Outside clicks are captured by the overlay element rendered when a menu is open.

  const refreshTrigger = useRef(0);

  // modals
  const [addOpen, setAddOpen] = useState(false);
  const [regOpen, setRegOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<ClinicPatientRow | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<any | null>(null);

  // Fetch clinic panels
  useEffect(() => {
    const fetchPanels = async () => {
      if (!clinicId) return;
      try {
        await getAllClinicPanels(clinicId);

      } catch (err) {
        console.error('Error fetching panels:', err);
      }
    };
    fetchPanels();
  }, [clinicId]);

  useEffect(() => {
    if (activeTab !== 'patients') return;
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

  useEffect(() => {
    if (activeTab !== 'provisional') return;
    setProvisionalCurrentPage(1);
  }, [provisionalQuery, activeTab]);

  // Debounced main search (patients_clinic) OR fetch all patients
  useEffect(() => {
    if (activeTab === 'provisional') return; // patients fetch handled below
    const t = setTimeout(() => {
      (async () => {
        if (!clinicId) {
          setPatients([]);
          setError('No clinic selected.');
          return;
        }

        setLoading(true);
        setError(null);
        try {
          const response = await getAllPatients({
            clinic_id: clinicId,
            search: searchTerm.trim() || undefined,
            page: currentPage,
            limit: pageSize,
          });
          const rows = response.data?.data || [];
          const pagination = response.data?.pagination || {};
          const pages = pagination.pages || 1;
          if (currentPage > pages) {
            setCurrentPage(pages);
            return;
          }
          setPatients(rows);
          setTotalPages(pages);
          setTotalPatients(pagination.total || 0);
        } catch (e) {
          console.error(e);
          setError('Failed to fetch patients.');
          toast.error('An error occurred while fetching patients.');
        } finally {
          setLoading(false);
        }
      })();
    }, 300); // Debounce time

    return () => clearTimeout(t);
  }, [activeTab, searchTerm, clinicId, currentPage, pageSize, refreshTrigger.current]);

  // Fetch provisional appointments for clinic when provisional tab active
  useEffect(() => {
    if (activeTab !== 'provisional' || !clinicId) return;
    let mounted = true;
    (async () => {
      try {
        setProvisionalLoading(true);
        const resp = await getClinicAppointments(clinicId, {
          provisional: true,
          page: provisionalCurrentPage,
          limit: provisionalPageSize,
          search: provisionalQuery.trim() || undefined,
        });
        const appts = resp.data?.data || [];
        const pagination = resp.data?.pagination || {};
        const pages = pagination.pages || 1;
        const total = pagination.total || 0;

        // Use backend-provided `doctor_name` when present; otherwise derive from populated `doctor_id` or fallback to placeholder
        const resolved = appts.map((a: any) => {
          if (a.doctor_name) return { ...a, doctor_name: a.doctor_name };
          const doc = a.doctor_id;
          const doctor_name = (doc && typeof doc === 'object' && (doc.full_name || doc.name))
            ? (doc.full_name || doc.name)
            : (doc && typeof doc === 'string' ? doc : '—');
          return { ...a, doctor_name };
        });

        if (mounted) {
          if (provisionalCurrentPage > pages) {
            setProvisionalCurrentPage(pages);
            return;
          }
          setProvisionalAppointments(resolved);
          setProvisionalTotalPages(pages);
          setProvisionalTotalCount(total);
        }
      } catch (e) {
        console.error('Failed to fetch provisional appointments', e);
      } finally {
        if (mounted) setProvisionalLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [activeTab, clinicId, provisionalCurrentPage, provisionalPageSize, provisionalQuery, refreshTrigger.current]);

  const handleSuccess = () => {
    setAddOpen(false);
    setRegOpen(false);
    // Trigger refresh of patient list
    refreshTrigger.current += 1;
  };

  // Handlers for opening and closing the booking modal
  const handleOpenBookAppointmentModal = (patient: ClinicPatientRow) => {
  setSelectedPatient(patient);
  setBookingModalOpen(true);
};

  const handleBookingSuccess = () => {
    setBookingModalOpen(false);
    setSelectedPatient(null);
    setEditingAppointment(null);
    // trigger refresh for lists relying on refreshTrigger
    refreshTrigger.current += 1;
  };

  return (
    <>
    <div className="space-y-6 overflow-visible">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
      <h1 className="text-2xl font-semibold">Patient Management</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* <button
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 font-medium text-white transition bg-gradient-to-r from-indigo-600 to-sky-500 rounded-xl shadow-sm hover:brightness-105 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={() => setAddOpen(true)}
              disabled={!clinicId}
              title={!clinicId ? 'Select a clinic first' : 'Find a patient by UHID and add them to your clinic'}
            >
              <IconUserPlus size={18} />
              Add Registered Patient
            </button> */}
            <button
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 font-medium text-white transition bg-gradient-to-r from-cyan-600 to-teal-500 rounded-xl shadow-sm hover:brightness-105 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={() => setRegOpen(true)}
              disabled={!clinicId}
              title={!clinicId ? 'Select a clinic first' : 'Register a new patient who does not have a UHID'}
            >
              <IconUserCircle size={18} />
              Register New Patient
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-visible">
          <SearchBar value={searchTerm} onChange={setSearchTerm} disabled={!clinicId} />
          
          <div className="mt-6">
            <div className="mb-4">
              <div className="inline-flex rounded-md shadow-sm bg-slate-50 p-1">
                <button
                  onClick={() => setActiveTab('patients')}
                  className={`px-3 py-2 text-sm font-medium rounded ${activeTab === 'patients' ? 'bg-white text-slate-900' : 'text-slate-600'}`}
                >
                  Patients
                </button>
                <button
                  onClick={() => setActiveTab('provisional')}
                  className={`px-3 py-2 text-sm font-medium rounded ${activeTab === 'provisional' ? 'bg-white text-slate-900' : 'text-slate-600'}`}
                >
                  Provisional
                </button>
              </div>
            </div>

            {activeTab === 'patients' && (
              <>
                <PatientList 
                  onBookAppointment={handleOpenBookAppointmentModal} 
                  searchTerm={searchTerm} 
                  loading={loading} 
                  error={error} 
                  patients={patients}
                  totalCount={totalPatients}
                />
                {!loading && !error && (
                  <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-600">
                      Showing page {currentPage} of {totalPages} ({totalPatients} patients)
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'provisional' && (
              <div>
                {provisionalLoading && <p className="text-slate-500">Loading provisional appointments...</p>}
                <div className="mb-3 flex items-center justify-between gap-4">
                  <input
                    type="search"
                    placeholder="Search provisional by name, date or time"
                    value={provisionalQuery}
                    onChange={(e) => setProvisionalQuery(e.target.value)}
                    className="px-3 py-2 border rounded-lg w-full max-w-md"
                  />
                </div>

                {!provisionalLoading && provisionalAppointments.length === 0 && (
                  <p className="text-slate-500">No provisional appointments found.</p>
                )}
                {!provisionalLoading && provisionalAppointments.length > 0 && (
                  <div className="overflow-x-auto overflow-visible rounded-lg border border-slate-200 shadow-sm">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b">
                          <th className="px-4 py-3 text-left">Date</th>
                          <th className="px-4 py-3 text-left">Time</th>
                          <th className="px-4 py-3 text-left">Doctor</th>
                          <th className="px-4 py-3 text-left">Patient</th>
                          <th className="px-4 py-3 text-left">Contact</th>
                          <th className="px-4 py-3 text-left">Status</th>
                          <th className="px-4 py-3 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {provisionalAppointments.map((a: any) => (
                          <tr key={a._id} className="hover:bg-sky-50">
                            <td className="px-4 py-3">{a.appointment_date}</td>
                            <td className="px-4 py-3">{a.appointment_time}</td>
                            <td className="px-4 py-3">{a.doctor_name || (a.doctor_id && (a.doctor_id.full_name || a.doctor_id.name)) || '—'}</td>
                            <td className="px-4 py-3">{a.full_name}</td>
                            <td className="px-4 py-3">{a.contact_number || '—'}</td>
                            <td className="px-4 py-3">{a.provisional ? 'provisional book' : a.status}</td>
                            <td className="px-4 py-3 relative">
                              <div className="flex justify-end">
                                <button
                                  data-menu-btn={a._id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const btn = e.currentTarget as HTMLElement;
                                    const rect = btn.getBoundingClientRect();
                                    const menuWidth = 120; // match rendered menu width
                                    const estimatedHeight = 96;
                                    let top = rect.top - estimatedHeight - 8;
                                    if (top < 8) top = rect.bottom + 8;
                                    // center menu horizontally under the button
                                    let left = rect.left + rect.width / 2 - menuWidth / 2;
                                    if (left < 8) left = 8;
                                    if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8;
                                    setMenuPosition({ left, top });
                                    setMenuOpenId(prev => prev === a._id ? null : a._id);
                                  }}
                                  aria-haspopup="true"
                                  aria-expanded={menuOpenId === a._id}
                                  aria-controls={`menu-${a._id}`}
                                  className="px-2 py-1 text-sm rounded hover:bg-slate-100"
                                  title="Actions"
                                >
                                  ⋯
                                </button>

                                {menuOpenId === a._id && menuPosition && (
                                  <>
                                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpenId(null)} />
                                    <div id={`menu-${a._id}`} data-menu-id={a._id} style={{ left: menuPosition.left, top: menuPosition.top, width: 120 }} className="fixed bg-white border rounded shadow z-[9999] transition ease-out duration-150 opacity-100">
                                    <button
                                      disabled={a.status === 'confirmed' || !!actionLoading[a._id]}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Open the booking modal in edit mode so user can update doctor/slot
                                        setEditingAppointment(a);
                                        // Prepare a lightweight patient object for the modal
                                        const patientForModal: any = {
                                          id: a.patient_id || (a.patient && (a.patient._id || a.patient.id)),
                                          full_name: a.full_name || (a.patient && (a.patient.full_name || a.patient.name)),
                                          contact_number: a.contact_number || (a.patient && a.patient.contact_number) || '',
                                          uhid: a.uhid || ''
                                        };
                                        setSelectedPatient(patientForModal);
                                        setBookingModalOpen(true);
                                        setMenuOpenId(null);
                                      }}
                                      className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-emerald-50 disabled:opacity-60 rounded w-[120px] justify-center text-slate-700"
                                    >
                                      {actionLoading[a._id] ? '...' : (
                                        <>
                                          <IconCheck size={14} className="text-emerald-600" />
                                          <span>Confirm</span>
                                        </>
                                      )}
                                    </button>
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (!confirm('Delete this provisional appointment?')) return;
                                        try {
                                          setActionLoading(prev => ({ ...prev, [a._id]: true }));
                                          await deleteAppointment(a._id);
                                          toast.success('Appointment deleted');
                                          refreshTrigger.current += 1;
                                        } catch (err) {
                                          console.error(err);
                                          toast.error('Failed to delete appointment');
                                        } finally {
                                          setActionLoading(prev => ({ ...prev, [a._id]: false }));
                                          setMenuOpenId(null);
                                        }
                                      }}
                                      className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-rose-50 disabled:opacity-60 rounded w-[120px] justify-center text-slate-700"
                                    >
                                      <IconTrash size={14} className="text-rose-600" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!provisionalLoading && (
                      <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-600">
                          Showing page {provisionalCurrentPage} of {provisionalTotalPages} ({provisionalTotalCount} provisional appointments)
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setProvisionalCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={provisionalCurrentPage <= 1}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Previous
                          </button>
                          <button
                            type="button"
                            onClick={() => setProvisionalCurrentPage((p) => Math.min(provisionalTotalPages, p + 1))}
                            disabled={provisionalCurrentPage >= provisionalTotalPages}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {!searchTerm.trim() && patients.length === 0 && !loading && !error && (
              <div className="text-center py-10">
                <h3 className="text-lg font-medium text-slate-700">No Patients Yet</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Register a new patient or add an existing patient to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddPatientModal
        open={addOpen}
        clinicId={clinicId}
        onClose={() => setAddOpen(false)}
        onSuccess={handleSuccess}
      />
      
      <NewPatientModal
        open={regOpen}
        onClose={() => setRegOpen(false)}
        onSuccess={handleSuccess}
      />

      <BookAppointmentModal
        open={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        onSuccess={handleBookingSuccess}
        patient={selectedPatient}
        clinicId={clinicId}
        appointment={editingAppointment}
        isEditing={!!editingAppointment}
      />
    </>
  );
}
