import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../state/useAuth';
import { createProfile, getAllProfiles, deleteProfile, adminResetPassword, updateProfile, uploadProfilePic, getActiveClinicSubscription } from '../../../lib/apiClient';
import { Modal } from '../../../components/Modal';
import { environment } from '../../../config/environment';
import {
  IconChevronLeft,
  IconUserPlus,
  IconKey,
  IconMail,
  IconUser,
  IconEdit
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

const Button = ({ children, loading, disabled, ...props }: any) => (
  <button
    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-2.5 text-white font-medium shadow-sm hover:brightness-105 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed transition"
    disabled={loading || disabled}
    {...props}
  >
    {loading ? 'Submitting...' : children}
  </button>
);

// --- Main Component ---
type StaffProfile = {
  _id: string;
  full_name: string;
  email: string;
  role: string;
  mobile_number?: string;
  status?: 'Active' | 'Inactive';
  qualification?: string;
  specialization?: string;
  profile_pic?: string;
};

export default function UserManagementPanel() {
  const { user: adminUser } = useAuth();
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('doctor');
  const [fieldErrors, setFieldErrors] = useState<{ [k: string]: string }>({});
  // Reset-password modal state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  // Edit user modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<'doctor' | 'receptionist' | ''>('');
  const [editLoading, setEditLoading] = useState(false);
  const [editImageUploading, setEditImageUploading] = useState(false);
  const [editFieldErrors, setEditFieldErrors] = useState<{ [k: string]: string }>({});
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    email: '',
    mobile_number: '',
    status: 'Active',
    qualification: '',
    specialization: '',
    profile_pic: '',
  });


  const fetchActivePlan = useCallback(async () => {
    if (!adminUser?.clinic_id) return;
    try {
      const response = await getActiveClinicSubscription(adminUser.clinic_id);
      setActivePlan(response.data?.data || null);
    } catch (err) {
      console.error("Error fetching subscription info:", err);
    }
  }, [adminUser?.clinic_id]);

  useEffect(() => {
    fetchStaff();
    fetchActivePlan();
  }, [adminUser, fetchActivePlan]);

  const fetchStaff = async () => {
    if (!adminUser?.clinic_id) return;
    setLoading(true);
    try {
      console.log('Fetching staff for clinic:', adminUser.clinic_id);
      const response = await getAllProfiles({page: 'staff'});
      // Filter to show only doctors and admins (exclude receptionist)
      const filteredStaff = response.data.filter((member: any) => member);
      setStaff(filteredStaff);
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

      // Client-side validation
      const errors: { [k: string]: string } = {};
      const validateEmail = (email?: string) => !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      const validateMobile = (m?: string) => !!m && /^[6-9]\d{9}$/.test(m);

      if (!newUserPayload.full_name) errors.full_name = 'Full name is required.';
      if (!newUserPayload.email || !validateEmail(newUserPayload.email)) errors.email = 'Valid email required.';
      if (!newUserPayload.mobile_number || !validateMobile(newUserPayload.mobile_number)) errors.mobile_number = 'Valid 10-digit mobile required.';
      if (!newUserPayload.password || String(newUserPayload.password).length < 8) errors.password = 'Password must be at least 8 characters.';
      if (!newUserPayload.role) errors.role = 'Role is required.';

      // If doctor, optionally require qualification/specialization (here we require qualification)
      const qualification = (formData.get('qualification') as string)?.trim();
      const specialization = (formData.get('specialization') as string)?.trim();
      if (newUserPayload.role === 'doctor' && !qualification) {
        errors.qualification = 'Qualification is required for doctors.';
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setFormLoading(false);
        return;
      }

      // clear errors
      setFieldErrors({});

      const staffLimit = activePlan?.limits_snapshot?.max_staff ?? 0;
      if (staffLimit > 0 && staff.length >= staffLimit) {
        toast.error('Staff limit reached for your current subscription. Upgrade to add more users.');
        setFormLoading(false);
        return;
      }

      // Add qualification and specialization if doctor role
      // assign qualification & specialization
      const qualificationVal = qualification || '';
      const specializationVal = specialization || '';
      newUserPayload.qualification = newUserPayload.role === 'doctor' ? qualificationVal : '';
      newUserPayload.specialization = newUserPayload.role === 'doctor' ? specializationVal : '';

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


  const handleResetPassword = (userId: string) => {
    setResetUserId(userId);
    setIsResetModalOpen(true);
  };

  const handleEditUser = (member: StaffProfile) => {
    if (member.role === 'admin') return;

    setEditUserId(member._id);
    setEditRole(member.role === 'doctor' ? 'doctor' : 'receptionist');
    setEditFormData({
      full_name: member.full_name || '',
      email: member.email || '',
      mobile_number: member.mobile_number || '',
      status: member.status || 'Active',
      qualification: member.qualification || '',
      specialization: member.specialization || '',
      profile_pic: member.profile_pic || '',
    });
    setEditFieldErrors({});
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditUserId(null);
    setEditRole('');
    setEditFieldErrors({});
  };

  const toAbsoluteAssetUrl = (rawUrl?: string) => {
    if (!rawUrl) return '';
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:')) return rawUrl;
    return rawUrl.startsWith('/') ? `${environment.getApiUrl()}${rawUrl}` : `${environment.getApiUrl()}/${rawUrl}`;
  };

  const handleEditProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editUserId) return;

    setEditImageUploading(true);
    try {
      const response = await uploadProfilePic(editUserId, file);
      const uploadedPath = response?.data?.data?.profile_pic as string | undefined;
      if (!uploadedPath) {
        throw new Error('Profile image URL missing in upload response');
      }

      setEditFormData((prev) => ({ ...prev, profile_pic: uploadedPath }));
      setStaff((prev) => prev.map((member) => (
        member._id === editUserId ? { ...member, profile_pic: uploadedPath } : member
      )));
      toast.success('Profile image uploaded successfully.');
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to upload profile image.';
      toast.error(message);
    } finally {
      setEditImageUploading(false);
      e.target.value = '';
    }
  };

  const submitEditUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editUserId) return;

    setEditLoading(true);

    try {
      const errors: { [k: string]: string } = {};
      const validateEmail = (email?: string) => !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      const validateMobile = (m?: string) => !!m && /^[6-9]\d{9}$/.test(m);

      if (!editFormData.full_name.trim()) errors.full_name = 'Full name is required.';
      if (!validateEmail(editFormData.email)) errors.email = 'Valid email required.';
      if (!validateMobile(editFormData.mobile_number)) errors.mobile_number = 'Valid 10-digit mobile required.';
      if (editRole === 'doctor' && !editFormData.qualification) errors.qualification = 'Qualification is required for doctors.';

      if (Object.keys(errors).length > 0) {
        setEditFieldErrors(errors);
        setEditLoading(false);
        return;
      }

      setEditFieldErrors({});

      const payload: any = {
        full_name: editFormData.full_name.trim(),
        email: editFormData.email.trim(),
        mobile_number: editFormData.mobile_number.trim(),
        status: editFormData.status,
      };

      if (editRole === 'doctor') {
        payload.qualification = editFormData.qualification;
        payload.specialization = editFormData.specialization.trim();
      }

      await toast.promise(
        updateProfile(editUserId, payload),
        {
          pending: 'Updating user...',
          success: 'User updated successfully!',
          error: {
            render({ data }: any) {
              return `Failed to update user: ${data?.message ?? 'Unknown error'}`;
            },
          },
        }
      );

      closeEditModal();
      void fetchStaff();
    } catch (err) {
      console.error(err);
    } finally {
      setEditLoading(false);
    }
  };

  const submitResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage(null);
    const fd = new FormData(e.currentTarget);
    const adminCurrent = fd.get('admin_current_password') as string;
    const newPassword = fd.get('new_password') as string;
    const confirmPassword = fd.get('confirm_password') as string;

    if (!adminCurrent || !newPassword || !confirmPassword) {
      setResetMessage({ type: 'error', text: 'All fields are required.' });
      setResetLoading(false);
      return;
    }
    if (newPassword.length < 8) {
      setResetMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      setResetLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetMessage({ type: 'error', text: 'New password and confirm do not match.' });
      setResetLoading(false);
      return;
    }

    try {
      if (!resetUserId) throw new Error('No user selected');
      await toast.promise(
        adminResetPassword(resetUserId, adminCurrent, newPassword),
        {
          pending: 'Updating password...',
          success: 'Password updated successfully',
          error: {
            render({ data }: any) {
              return `Failed: ${data?.message ?? 'Unknown error'}`;
            }
          }
        }
      );
      setIsResetModalOpen(false);
      setResetUserId(null);
      void fetchStaff();
    } catch (err) {
      console.error(err);
    } finally {
      setResetLoading(false);
    }
  };


  const staffLimit = activePlan?.limits_snapshot?.max_staff ?? 0;
  const staffRemaining = staffLimit > 0 ? Math.max(0, staffLimit - staff.length) : null;
  const isStaffLimitReached = staffLimit > 0 && staff.length >= staffLimit;

  return (
    <>
      <div>
        <Link to="/settings" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-4">
          <IconChevronLeft className="h-5 w-5" />
          Back to Settings
        </Link>
        <div className="p-6 bg-white border rounded-2xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Staff Management</h2>
              <p className="text-sm text-slate-500">Create doctors and receptionists for your clinic.</p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
                <span>
                  Active plan: <span className="font-semibold text-slate-800">{activePlan?.name_snapshot ?? 'Free Plan'}</span>
                </span>
                {staffLimit > 0 && (
                  <span>
                    Staff: <span className="font-semibold text-slate-800">{staff.length}/{staffLimit}</span>
                    {staffRemaining !== null && staffRemaining >= 0 && ` (${staffRemaining} slots left)`}
                  </span>
                )}
                {isStaffLimitReached && (
                  <span className="text-rose-500">Staff limit reached. Upgrade to add more users.</span>
                )}
              </div>
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              disabled={formLoading || isStaffLimitReached}
            >
              <IconUserPlus className="h-5 w-5" />
              <span>Add New Staff</span>
            </Button>
          </div>
          <div className="mt-6">
            {loading ? <p>Loading staff...</p> : error ? <p className="text-rose-500">{error}</p> : (
              <ul className="space-y-3">
                {staff.map(member => (
                
                  <li key={member._id} className="flex flex-col items-start justify-between gap-3 p-4 border rounded-xl sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-slate-100 shrink-0">
                        {member.profile_pic ? (
                          <img
                            src={toAbsoluteAssetUrl(member.profile_pic)}
                            alt={member.full_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-600">
                            {(member.full_name || 'U').trim().charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{member.full_name}</p>
                        <p className="text-sm text-slate-500">{member.email} - <span className="font-medium capitalize">{member.role}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        className={`text-xs font-medium ${member.role === 'admin' ? 'text-slate-400 cursor-not-allowed' : 'text-sky-700 hover:underline'}`}
                        onClick={() => handleEditUser(member)}
                        disabled={member.role === 'admin'}
                        title={member.role === 'admin' ? 'Admin cannot be edited here' : 'Edit user'}
                      >
                        Edit
                      </button>
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
          <div>
            <Input id="full_name" name="full_name" label="Full Name" type="text" icon={IconUser} placeholder="Dr. John Doe" required />
            {fieldErrors.full_name && <p className="text-xs text-rose-500 mt-1">{fieldErrors.full_name}</p>}
          </div>

          <div>
            <Input id="email" name="email" label="Email" type="email" icon={IconMail} placeholder="john.doe@clinic.com" required />
            {fieldErrors.email && <p className="text-xs text-rose-500 mt-1">{fieldErrors.email}</p>}
          </div>

          <div>
            <Input id="mobile_number" name="mobile_number" label="Mobile Number" type="tel" icon={IconUser} placeholder="9876543210" required />
            {fieldErrors.mobile_number && <p className="text-xs text-rose-500 mt-1">{fieldErrors.mobile_number}</p>}
          </div>

          <div>
            <Input id="password" name="password" label="Password" type="password" icon={IconKey} placeholder="Minimum 8 characters" required />
            {fieldErrors.password && <p className="text-xs text-rose-500 mt-1">{fieldErrors.password}</p>}
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select 
              id="role" 
              name="role" 
              required 
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition">
              <option value="doctor">Doctor</option>
              <option value="receptionist">Receptionist</option>
            </select>
            {fieldErrors.role && <p className="text-xs text-rose-500 mt-1">{fieldErrors.role}</p>}
          </div>

          {selectedRole === 'doctor' && (
            <div className="space-y-4 border-t pt-4">
              <p className="text-sm font-medium text-slate-700">Doctor Qualifications</p>
              <div>
                <label htmlFor="qualification" className="block text-sm font-medium text-slate-700 mb-1">Qualification</label>
                <select id="qualification" name="qualification" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition">
                  <option value="">Select Qualification</option>
                  <option value="BDS">BDS (Bachelor of Dental Surgery)</option>
                  <option value="MDS">MDS (Master of Dental Surgery)</option>
                  <option value="PhD">PhD in Dentistry</option>
                  <option value="PGDIP">PGDIP (Post Graduate Diploma)</option>
                </select>
                {fieldErrors.qualification && <p className="text-xs text-rose-500 mt-1">{fieldErrors.qualification}</p>}
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
                {fieldErrors.specialization && <p className="text-xs text-rose-500 mt-1">{fieldErrors.specialization}</p>}
              </div>
            </div>
          )}

          {selectedRole === 'receptionist' && (
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-700">Receptionist role selected. Doctor-specific fields are not required.</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200">Cancel</button>
            <Button type="submit" loading={formLoading}>Create User</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={closeEditModal} title="Edit Staff Member">
        <form onSubmit={submitEditUser} className="space-y-4">
          <div className="flex flex-col items-center gap-3 border-b border-slate-200 pb-4">
            <div className="h-24 w-24 overflow-hidden rounded-full border border-slate-300 bg-slate-100">
              {editFormData.profile_pic ? (
                <img
                  src={toAbsoluteAssetUrl(editFormData.profile_pic)}
                  alt={editFormData.full_name || 'Profile'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-500">
                  <IconUser className="h-10 w-10" />
                </div>
              )}
            </div>
            <label htmlFor="edit-profile-pic" className="cursor-pointer rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
              {editImageUploading ? 'Uploading...' : 'Upload Image'}
            </label>
            <input
              id="edit-profile-pic"
              type="file"
              accept="image/*"
              onChange={handleEditProfilePicUpload}
              disabled={editImageUploading}
              className="hidden"
            />
            <p className="text-xs text-slate-500">JPG, PNG, WebP, GIF up to 10MB</p>
          </div>

          <div>
            <Input
              id="edit_full_name"
              name="full_name"
              label="Full Name"
              type="text"
              icon={IconUser}
              value={editFormData.full_name}
              onChange={(e: any) => setEditFormData((prev) => ({ ...prev, full_name: e.target.value }))}
              required
            />
            {editFieldErrors.full_name && <p className="text-xs text-rose-500 mt-1">{editFieldErrors.full_name}</p>}
          </div>

          <div>
            <Input
              id="edit_email"
              name="email"
              label="Email"
              type="email"
              icon={IconMail}
              value={editFormData.email}
              onChange={(e: any) => setEditFormData((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
            {editFieldErrors.email && <p className="text-xs text-rose-500 mt-1">{editFieldErrors.email}</p>}
          </div>

          <div>
            <Input
              id="edit_mobile_number"
              name="mobile_number"
              label="Mobile Number"
              type="tel"
              icon={IconUser}
              value={editFormData.mobile_number}
              onChange={(e: any) => setEditFormData((prev) => ({ ...prev, mobile_number: e.target.value }))}
              required
            />
            {editFieldErrors.mobile_number && <p className="text-xs text-rose-500 mt-1">{editFieldErrors.mobile_number}</p>}
          </div>

          <div>
            <label htmlFor="edit_status" className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              id="edit_status"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
              value={editFormData.status}
              onChange={(e) => setEditFormData((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {editRole === 'doctor' && (
            <div className="space-y-4 border-t pt-4">
              <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <IconEdit className="h-4 w-4" />
                Doctor Details
              </p>
              <div>
                <label htmlFor="edit_qualification" className="block text-sm font-medium text-slate-700 mb-1">Qualification</label>
                <select
                  id="edit_qualification"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
                  value={editFormData.qualification}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, qualification: e.target.value }))}
                >
                  <option value="">Select Qualification</option>
                  <option value="BDS">BDS (Bachelor of Dental Surgery)</option>
                  <option value="MDS">MDS (Master of Dental Surgery)</option>
                  <option value="PhD">PhD in Dentistry</option>
                  <option value="PGDIP">PGDIP (Post Graduate Diploma)</option>
                </select>
                {editFieldErrors.qualification && <p className="text-xs text-rose-500 mt-1">{editFieldErrors.qualification}</p>}
              </div>

              <div>
                <label htmlFor="edit_specialization" className="block text-sm font-medium text-slate-700 mb-1">Specialization</label>
                <input
                  id="edit_specialization"
                  type="text"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
                  value={editFormData.specialization}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, specialization: e.target.value }))}
                  placeholder="e.g. Orthodontics"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={closeEditModal} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200">Cancel</button>
            <Button loading={editLoading} type="submit">Save Changes</Button>
          </div>
        </form>
      </Modal>

        <Modal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} title="Reset User Password">
          <form onSubmit={submitResetPassword} className="space-y-4">
            <div>
            <label htmlFor="admin_current_password" className="block text-sm font-medium text-slate-700 mb-1">Your Admin Password (to verify)</label>
              <input id="admin_current_password" name="admin_current_password" type="password" className="w-full rounded-xl border border-slate-300 px-3 py-2.5" required />
            </div>

            <div>
              <label htmlFor="new_password" className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
              <input id="new_password" name="new_password" type="password" className="w-full rounded-xl border border-slate-300 px-3 py-2.5" required />
            </div>

            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
              <input id="confirm_password" name="confirm_password" type="password" className="w-full rounded-xl border border-slate-300 px-3 py-2.5" required />
            </div>

            {resetMessage && (
              <div className={`p-3 rounded text-sm ${resetMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                {resetMessage.text}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setIsResetModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200">Cancel</button>
              <Button loading={resetLoading} type="submit">Update Password</Button>
            </div>
          </form>
        </Modal>
    </>
  );
}
