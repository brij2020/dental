import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  IconChevronLeft,
  IconUserCog,
  IconDeviceFloppy,
} from '@tabler/icons-react';
import dayjs, { type Dayjs } from "dayjs";
import {getAllProfiles, updateProfile, getDoctorLeavesByClinic} from '../../../lib/apiClient';
import { useAuth } from '../../../state/useAuth';
import { DatePicker, Space } from 'antd';
// --- Types ---
type DoctorProfile = {
  _id: string;
  full_name: string;
  role?: string;
};


type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

type LeaveType = "FULL_DAY" | "HALF_DAY";

type LeaveItem = {
  day: string;
  date: string;
  type: LeaveType;
  is_recurring: boolean;
};

type LeavePayload = {
  doctor_id: string;
  leave: LeaveItem[];
};


// --- Main Panel Component ---
export default function AppointmentTimingsPanel() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [clinicLeaves, setClinicLeaves] = useState<any[]>([]);

  
  const { RangePicker } = DatePicker;

  const [isListLoading, setIsListLoading] = useState(true);
 
  const [saving, setSaving] = useState(false);

  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
 
  // Effect to fetch the list of doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      if (!user?.clinic_id) return;
      setIsListLoading(true);
      try {
        const response = await getAllProfiles({ clinic_id: user.clinic_id, page: 'staff' });

        if (response.status === 200 && response.data) {
          const profileData = response.data.data || response.data;
          const doctorsArr = Array.isArray(profileData) ? profileData : [profileData];

          const mappedDoctors = doctorsArr
            .map((doc: any) => ({
              _id: doc._id || doc.id,
              full_name: doc.full_name,
              role: doc.role,
            }));

          setDoctors(mappedDoctors);
          if (mappedDoctors.length > 0) setSelectedDoctorId(mappedDoctors[0]._id);
        }
      } catch (error: any) {
        toast.error('Failed to fetch doctors list.');
        console.error('Error fetching doctors:', error);
      } finally {
        setIsListLoading(false);
      }
    };

    const fetchClinicLeaves = async () => {
      if (!user?.clinic_id) return;
      try {
        const resp = await getDoctorLeavesByClinic(user.clinic_id);
        const leaves = resp?.data?.data || resp?.data || [];
        setClinicLeaves(Array.isArray(leaves) ? leaves : []);
      } catch (err) {
        console.error('Failed to fetch clinic leaves', err);
      }
    };

    fetchDoctors();
    fetchClinicLeaves();
  }, [user]);


  ;
    const [payload, setPayload] = useState<LeavePayload>({
    doctor_id: "DOC_123",
    leave: [],
  });

  



  // Submit Handler
  const handleSubmit = async (e: FormEvent) => {
    try {
      e.preventDefault();
      if (!selectedDoctorId) return;
      setSaving(true);

      console.log('Payload to save:', payload, selectedDoctorId);

      const response = await updateProfile(selectedDoctorId, payload);

      if (response.status === 200) {
        toast.success('Leave has been updated!');
      }
    } catch (error: any) {
      toast.error('Failed to save leave. Please try again.');
      console.error('Error in handleSubmit:', error?.response?.data || error.message);
    } finally {
      setSaving(false);
    }
  };

  const refreshLeaves = async () => {
    if (!user?.clinic_id) return;
    try {
      const resp = await getDoctorLeavesByClinic(user.clinic_id);
      const leaves = resp?.data?.data || resp?.data || [];
      setClinicLeaves(Array.isArray(leaves) ? leaves : []);
    } catch (err) {
      console.error('Failed to refresh leaves', err);
    }
  };

  const isLoading = isListLoading;
  
  type LeaveItem = {
    day: Day;
    date: string;
    type: LeaveType;
    is_recurring: boolean;
  };

  const handleDateChange = (
    dates: [Dayjs | null, Dayjs | null] | null
  ): void => {
    setDateRange(dates);
    
    if (!dates || !dates[0] || !dates[1]) {
      setPayload((prev) => ({ ...prev, leave: [] }));
      return;
    }

    const [start, end] = dates;
    const leaveArr: LeaveItem[] = [];

    let current = start.clone();

    while (!current.isAfter(end, "day")) {
      leaveArr.push({
        day: current.format("dddd") as Day,
        date: current.format("YYYY-MM-DD"),
        type: "FULL_DAY",
        is_recurring: false,
      });

      current = current.add(1, "day");
    }

    setPayload((prev) => ({
      ...prev,
      leave: leaveArr,
    }));
  };

  // Disable past dates in DatePicker
  const disabledDate = (current: Dayjs): boolean => {
    return current && current.isBefore(dayjs().startOf('day'));
  };





  return (
    <div>
      <Link
        to="/settings"
        className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-4"
      >
        <IconChevronLeft className="h-5 w-5" />
        Back to Settings
      </Link>

      <div className="p-6 bg-white border rounded-2xl">
        <h2 className="text-lg font-semibold text-slate-800">Leave Management</h2>
        <p className="text-sm text-slate-500 mt-1">
          Set the weekly consultation hours and appointment duration for each doctor.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            {/* Doctor Selection */}
            <div>
              <label
                htmlFor="doctor-select"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Select Staff Member
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <IconUserCog className="h-5 w-5 text-slate-400" />
                </span>

                <select
                  id="doctor-select"
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  disabled={isListLoading || doctors.length === 0}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-slate-900 outline-none 
                             focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
                >
                  {isListLoading ? (
                    <option>Loading staff...</option>
                  ) : doctors.length > 0 ? (
                    doctors.map((doc) => (
                      <option key={doc._id} value={doc._id}>
                        {doc.full_name} {doc?.role ? `(${doc.role})` : ''}
                      </option>
                    ))
                  ) : (
                    <option>No staff found</option>
                  )}
                </select>
              </div>
            </div>

            {/* Slot Duration */}
            <div>


            </div>
          </div>

          <div className="space-y-4">
            <Space vertical size={12}>
              <RangePicker 
                onChange={handleDateChange} 
                disabledDate={disabledDate}
                value={dateRange}
              />
            </Space>
          </div>

          {/* Clinic leave list */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-700">Clinic Leaves</h3>
              <button
                type="button"
                onClick={refreshLeaves}
                className="inline-flex items-center gap-2 text-xs text-sky-600 hover:text-sky-700"
              >
                Refresh
              </button>
            </div>

            <div className="mt-3">
              {clinicLeaves.length === 0 ? (
                <div className="py-6 text-center">
                  <div className="text-sm text-slate-500">No clinic leaves found.</div>
                  <div className="mt-2 text-xs text-slate-400">Click refresh after adding leaves.</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-2">
                  {clinicLeaves.map((l: any) => {
                    const staff = doctors.find(d => d._id === (l.doctor_id || l.doctorId));
                    const name = staff?.full_name || l.doctor_name || l.doctor_id || 'Staff';
                    const role = staff?.role;
                    return (
                      <div key={l._id || l.id} className="flex gap-3 p-3 border rounded-lg bg-white shadow-sm items-start">
                        <div className="flex-none">
                          <img
                            src={ (l.doctor_pic) ? l.doctor_pic : undefined }
                            onError={(e) => { (e.target as HTMLImageElement).src = '/assets/spai.jpeg'; }}
                            alt={name}
                            className="w-12 h-12 rounded-full object-cover bg-slate-100"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-sm font-semibold text-slate-800">{name}</div>
                              {role && <div className="text-xs text-slate-500">{role}</div>}
                            </div>
                            <div className="text-xs text-slate-500 text-right">
                              <div className="inline-block px-2 py-1 rounded bg-slate-100 text-slate-700">{l.leave_start_date}{l.leave_end_date && l.leave_end_date !== l.leave_start_date ? ` → ${l.leave_end_date}` : ''}</div>
                            </div>
                          </div>
                          {l.reason ? <div className="mt-2 text-xs text-slate-500 line-clamp-2">{l.reason}</div> : <div className="mt-2 text-xs text-slate-400">No reason provided</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end mt-8 pt-4 border-t">
            <button
              type="submit"
              disabled={saving || isLoading || !selectedDoctorId}
              className="inline-flex items-center justify-center gap-2 rounded-xl 
                         bg-gradient-to-r from-indigo-600 to-sky-500 px-5 py-2.5 
                         text-white font-medium shadow-sm hover:brightness-105 
                         active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              <IconDeviceFloppy className="h-5 w-5" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>


    </div>
  )
}