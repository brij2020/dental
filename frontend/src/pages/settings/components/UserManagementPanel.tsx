import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../state/useAuth';
import { createProfile, getAllProfiles, deleteProfile } from '../../../lib/apiClient';
import { Modal } from '../../../components/Modal';
import {
  IconChevronLeft,
  IconUserPlus,
  IconKey,
  IconMail,
  IconUser
} from '@tabler/icons-react';
import { toast } from 'react-toastify';

// --- Helper Components ---
const Input = ({ id, label, type, icon: Icon, ...props }: any) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Icon className="h-5 w-5 text-slate-400" />
      </span>
      <input id={id} type={type} className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition" {...props} />
    </div>
  </div>
);

const Button = ({ children, loading, ...props }: any) => (
  <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-2.5 text-white font-medium shadow-sm hover:brightness-105 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed transition" disabled={loading} {...props}>
    {loading ? 'Submitting...' : children}
  </button>
);

// --- Main Component ---
type StaffProfile = { _id: string; full_name: string; email: string; role: string; };

export default function UserManagementPanel() {
  const { user: adminUser } = useAuth();
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('doctor');


  useEffect(() => {
    fetchStaff();
  }, [adminUser]);

  const fetchStaff = async () => {
    if (!adminUser?.clinic_id) return;
    setLoading(true);
    try {
      console.log('Fetching staff for clinic:', adminUser.clinic_id);
      const response = await getAllProfiles();
      setStaff(response.data);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching staff:", err);
      setError("Failed to load staff members.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);

    // capture the form BEFORE any await
    const formEl = e.currentTarget;

    try {
      if (!adminUser?.clinic_id) {
        toast.error('Missing clinic. Please select a clinic and try again.');
        return;
      }

      const formData = new FormData(formEl);
      const newUserPayload: any = {
        email: (formData.get('email') as string)?.trim(),
        password: formData.get('password') as string,
        full_name: (formData.get('full_name') as string)?.trim(),
        mobile_number: (formData.get('mobile_number') as string)?.trim(),
        role: (formData.get('role') as string)?.trim(),
        clinic_id: adminUser.clinic_id
      };

      // Add qualification and specialization if doctor role
      const qualification = (formData.get('qualification') as string)?.trim();
      const specialization = (formData.get('specialization') as string)?.trim();
      
      if (newUserPayload.role === 'doctor') {
        if (qualification) newUserPayload.qualification = qualification;
        if (specialization) newUserPayload.specialization = specialization;
      } else {
        // For non-doctor roles, send empty strings to avoid array validation errors
        newUserPayload.qualification = '';
        newUserPayload.specialization = '';
      }

      const newUser = async () => {
        const response = await createProfile(newUserPayload);
        return response.data;
      };

      // Show pending/success/error toasts automatically
      await toast.promise(
        newUser(),
        {
          pending: 'Creating user...',
          success: 'User created successfully!',
          error: {
            render({ data }: any) {
              return `Failed to create user: ${data?.message ?? 'Unknown error'}`;
            },
          },
        }
      );

      // Success: reset, close, refresh
      formEl.reset();
      setIsModalOpen(false);
      void fetchStaff();
    } catch (err) {
      // toast.promise already showed the error toast
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Delete this user? This action cannot be undone.')) return;

    const run = async () => {
      const response = await deleteProfile(userId);
      return response.data;
    };

    try {
      await toast.promise(run(), {
        pending: 'Deleting user...',
        success: 'User deleted successfully!',
        error: {
          render({ data }: any) {
            return `Failed to delete: ${data?.message ?? 'Unknown error'}`;
          },
        },
      });
      void fetchStaff();
    } catch (e) {
      console.error(e);
    }
  };


  const handleResetPassword = async (userId: string) => {
    // const newPass = prompt('Enter a new password (min 8 chars)');
    // if (!newPass) return;

    // const run = () =>
    //   supabase.functions.invoke('admin-reset-password', {
    //     body: { user_id: userId, new_password: newPass, enforceSameClinic: true },
    //   }).then((res) => {
    //     if (res.error) {
    //       const msg = (res.data as any)?.error ?? res.error.message;
    //       throw new Error(msg);
    //     }
    //     return res.data;
    //   });

    // try {
    //   await toast.promise(run(), {
    //     pending: 'Resetting password...',
    //     success: 'Password reset',
    //     error: {
    //       render({ data }: any) {
    //         return `Failed to reset: ${data?.message ?? 'Unknown error'}`;
    //       },
    //     },
    //   });
    // } catch (e) {
    //   console.error(e);
    // }
  };


  return (
    <>
      <div>
        <Link to="/settings" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-4">
          <IconChevronLeft className="h-5 w-5" />
          Back to Settings
        </Link>
        <div className="p-6 bg-white border rounded-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Staff Management</h2>
            <Button onClick={() => setIsModalOpen(true)}>
              <IconUserPlus className="h-5 w-5" />
              <span>Add New Staff</span>
            </Button>
          </div>
          <div className="mt-6">
            {loading ? <p>Loading staff...</p> : error ? <p className="text-rose-500">{error}</p> : (
              <ul className="space-y-3">
                {staff.map(member => (
                
                  <li key={member._id} className="flex flex-col items-start justify-between gap-3 p-4 border rounded-xl sm:flex-row sm:items-center">
                    <div>
                      
                      <p className="font-medium text-slate-800">{member.full_name}</p>
                      <p className="text-sm text-slate-500">{member.email} - <span className="font-medium capitalize">{member.role}</span></p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button className="text-xs font-medium text-indigo-600 hover:underline"
                        onClick={() => handleResetPassword(member._id)}>
                        Reset Password
                      </button>

                      <button 
                        className={`text-xs font-medium ${member.role === 'admin' ? 'text-slate-400 cursor-not-allowed' : 'text-rose-600 hover:underline'}`}
                        onClick={() => handleDeleteUser(member._id)}
                        disabled={member.role === 'admin'}
                        title={member.role === 'admin' ? 'Cannot delete admin users' : 'Delete user'}>
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Staff Member">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input id="full_name" name="full_name" label="Full Name" type="text" icon={IconUser} placeholder="Dr. John Doe" required />
          <Input id="email" name="email" label="Email" type="email" icon={IconMail} placeholder="john.doe@clinic.com" required />
          <Input id="mobile_number" name="mobile_number" label="Mobile Number" type="tel" icon={IconUser} placeholder="9876543210" required />
          <Input id="password" name="password" label="Password" type="password" icon={IconKey} placeholder="Minimum 8 characters" required />
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select 
              id="role" 
              name="role" 
              required 
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                const doctorFields = document.getElementById('doctorFields');
                if (e.target.value === 'doctor') {
                  doctorFields?.classList.remove('hidden');
                } else {
                  doctorFields?.classList.add('hidden');
                }
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition">
              <option value="doctor">Doctor</option>
              <option value="receptionist">Receptionist</option>
            </select>
          </div>

          <div id="doctorFields" className="space-y-4">
            <div>
              <label htmlFor="qualification" className="block text-sm font-medium text-slate-700 mb-1">Qualification</label>
              <select id="qualification" name="qualification" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition">
                <option value="">Select Qualification</option>
                <option value="BDS">BDS (Bachelor of Dental Surgery)</option>
                <option value="MDS">MDS (Master of Dental Surgery)</option>
                <option value="PhD">PhD in Dentistry</option>
                <option value="PGDIP">PGDIP (Post Graduate Diploma)</option>
              </select>
            </div>

            <div>
              <label htmlFor="specialization" className="block text-sm font-medium text-slate-700 mb-1">Specialization</label>
              <select id="specialization" name="specialization" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition">
                <option value="">Select Specialization</option>
                <option value="General Dentistry">General Dentistry</option>
                <option value="Orthodontics">Orthodontics</option>
                <option value="Periodontics">Periodontics</option>
                <option value="Endodontics">Endodontics</option>
                <option value="Prosthodontics">Prosthodontics</option>
                <option value="Oral Surgery">Oral Surgery</option>
                <option value="Pediatric Dentistry">Pediatric Dentistry</option>
                <option value="Cosmetic Dentistry">Cosmetic Dentistry</option>
                <option value="Implantology">Implantology</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200">Cancel</button>
            <Button type="submit" loading={formLoading}>Create User</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}