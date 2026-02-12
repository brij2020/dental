// src/features/settings/components/ClinicInformationPanel.tsx

import React, { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { getClinicById, updateClinicById, uploadClinicLogo } from '../../../lib/apiClient';
import { useAuth } from '../../../state/useAuth';
import { toast } from 'react-toastify';
import {
  IconChevronLeft,
  IconBuilding,
  IconMapPin,
  IconWorld,
  IconMail,
  IconPhone,
  IconEdit,
} from '@tabler/icons-react';

// Reusable Input component from your other files
const Input = ({ id, label, icon: Icon, ...props }: any) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Icon className="h-5 w-5 text-slate-400" />
      </span>
      <input id={id} className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition" {...props} />
    </div>
  </div>
);

// Reusable Button component
const Button = ({ children, loading, ...props }: any) => (
  <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-2.5 text-white font-medium shadow-sm hover:brightness-105 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed transition" disabled={loading} {...props}>
    {loading ? 'Saving...' : children}
  </button>
);


// Type for our clinic data
type ClinicProfile = {
  _id: string;
  name: string;
  logo?: string;
  address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  location: {
    latitude: number;
    longitude: number;
  };
  phone: string;
  clinic_id: string;
  status: string;
  branding_moto: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function ClinicInformationPanel() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [clinic, setClinic] = useState<ClinicProfile | null>(null);
  const [formData, setFormData] = useState<Partial<ClinicProfile>>({});
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchClinicInfo = async () => {
      if (!user?.clinic_id) return;
      setLoading(true);
      try {
        const response = await getClinicById();
        setClinic(response.data);
        setFormData(response.data);
      } catch (error) {
        toast.error('Failed to fetch clinic information.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchClinicInfo();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData(prev => {
      if (!name.includes('.')) {
        return { ...prev, [name]: value };
      }

      const keys = name.split('.');
      const updated: any = { ...prev };
      let currentLevel = updated;

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        const existingValue = currentLevel[key];
        currentLevel[key] = typeof existingValue === 'object' && existingValue !== null
          ? { ...existingValue }
          : {};
        currentLevel = currentLevel[key];
      }

      currentLevel[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const handleUpdateClinic = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const clinicId = user?.clinic_id;
    if (!clinicId || typeof clinicId !== 'string') {
      toast.error('Clinic ID is missing or invalid.');
      return;
    }
    setFormLoading(true);
    try {
      const updatePromise = async () => {
        const response = await updateClinicById(clinicId, { ...formData, id: undefined });
        return response.data;
      };
      const updatedData = await toast.promise(updatePromise(), {
        pending: 'Updating clinic details...',
        success: 'Information updated successfully!',
        error: 'Failed to update details.',
      });
      setClinic(updatedData);
      window.dispatchEvent(new Event('clinic-profile-updated'));
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const clinicId = user?.clinic_id;

    if (!file || !clinicId) return;

    setLogoUploading(true);
    try {
      const response = await uploadClinicLogo(clinicId, file);
      const logoUrl = response?.data?.data?.logo;

      if (!logoUrl) {
        throw new Error('Logo URL missing in upload response');
      }

      setFormData(prev => ({ ...prev, logo: logoUrl }));
      setClinic(prev => (prev ? { ...prev, logo: logoUrl } : prev));
      window.dispatchEvent(new Event('clinic-profile-updated'));
      toast.success('Clinic image uploaded successfully.');
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to upload clinic image.';
      toast.error(message);
    } finally {
      setLogoUploading(false);
      e.target.value = '';
    }
  };

  if (loading) return <p>Loading clinic information...</p>;

  return (
    <div>
      <Link to="/settings" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-4">
        <IconChevronLeft className="h-5 w-5" />
        Back to Settings
      </Link>
      <div className="p-6 bg-white border rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Clinic Information</h2>
          {isAdmin && !isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center justify-center gap-2 text-sm font-medium text-indigo-600 transition hover:text-indigo-800">
                <IconEdit className="h-4 w-4" />
                Edit
            </button>
          )}
        </div>

        {!isEditing ? (
          <div className="mt-6 space-y-6">
            {/* Basic Information Card */}
            <div className="border rounded-xl p-5 bg-gradient-to-br from-slate-50 to-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <IconBuilding className="h-4 w-4 text-indigo-600" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Clinic Name</p>
                  <p className="text-base font-semibold text-slate-800 mt-1">{clinic?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Status</p>
                  <p className="mt-1">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${clinic?.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                      {clinic?.status}
                    </span>
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Branding Motto</p>
                  <p className="text-base text-slate-800 mt-1">{clinic?.branding_moto || '—'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Clinic Image</p>
                </div>
                {clinic?.logo && (
                  <div className="md:col-span-2">
                    <img
                      src={clinic.logo}
                      alt={clinic?.name || 'Clinic'}
                      className="h-20 w-20 rounded-full border border-slate-200 object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                {!clinic?.logo && (
                  <div className="md:col-span-2">
                    <p className="text-base text-slate-800 mt-1">—</p>
                  </div>
                )}
                <div className="md:col-span-2">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Description</p>
                  <p className="text-base text-slate-800 mt-1">{clinic?.description || '—'}</p>
                </div>
              </div>
            </div>

            {/* Contact Information Card */}
            <div className="border rounded-xl p-5 bg-gradient-to-br from-slate-50 to-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <IconPhone className="h-4 w-4 text-indigo-600" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Phone</p>
                  <p className="text-base font-semibold text-slate-800 mt-1">{clinic?.phone}</p>
                </div>
              </div>
            </div>

            {/* Address Card */}
            <div className="border rounded-xl p-5 bg-gradient-to-br from-slate-50 to-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <IconMapPin className="h-4 w-4 text-indigo-600" />
                Address
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Street</p>
                  <p className="text-base text-slate-800 mt-1">{clinic?.address?.street}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">City</p>
                  <p className="text-base text-slate-800 mt-1">{clinic?.address?.city}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">State</p>
                  <p className="text-base text-slate-800 mt-1">{clinic?.address?.state}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Postal Code</p>
                  <p className="text-base text-slate-800 mt-1">{clinic?.address?.postal_code}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Country</p>
                  <p className="text-base text-slate-800 mt-1">{clinic?.address?.country}</p>
                </div>
              </div>
            </div>

            {/* Location Card */}
            <div className="border rounded-xl p-5 bg-gradient-to-br from-slate-50 to-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <IconWorld className="h-4 w-4 text-indigo-600" />
                Location Coordinates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Latitude</p>
                  <p className="text-base font-mono text-slate-800 mt-1">{clinic?.location?.latitude}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Longitude</p>
                  <p className="text-base font-mono text-slate-800 mt-1">{clinic?.location?.longitude}</p>
                </div>
              </div>
            </div>

            {/* Metadata Card */}
            <div className="border rounded-xl p-5 bg-slate-100 border-slate-200">
              <h3 className="text-xs font-semibold text-slate-600 mb-4 uppercase tracking-wide">Metadata</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
                <div>
                  <p className="text-slate-500 font-medium">Created</p>
                  <p className="mt-1 font-mono">{new Date(clinic?.createdAt || '').toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Last Updated</p>
                  <p className="mt-1 font-mono">{new Date(clinic?.updatedAt || '').toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
            <form onSubmit={handleUpdateClinic} className="mt-6 space-y-6">
              {/* Basic Information Card */}
              <div className="border rounded-xl p-5 bg-gradient-to-br from-slate-50 to-slate-100">
                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <IconBuilding className="h-4 w-4 text-indigo-600" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input id="name" name="name" label="Clinic Name" icon={IconBuilding} value={formData.name || ''} onChange={handleInputChange} required />
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select 
                      id="status" 
                      name="status" 
                      value={formData.status || ''} 
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
                      required>
                      <option value="">Select Status</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="logo-file" className="block text-sm font-medium text-slate-700 mb-1">
                      Upload Clinic Image
                    </label>
                    <input
                      id="logo-file"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileChange}
                      disabled={logoUploading}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition disabled:opacity-60"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      {logoUploading ? 'Uploading image...' : 'Choose an image from your device (max 10MB). Last uploaded or new image is shown below.'}
                    </p>
                  </div>
                  <Input id="branding_moto" name="branding_moto" label="Branding Motto" icon={IconEdit} value={formData.branding_moto || ''} onChange={handleInputChange} />
                  <Input id="description" name="description" label="Description" icon={IconEdit} value={formData.description || ''} onChange={handleInputChange} />
                </div>
                {formData.logo && (
                  <div className="mt-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-2">Image Preview</p>
                    <img
                      src={formData.logo}
                      alt={formData.name || 'Clinic'}
                      className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Contact Information Card */}
              <div className="border rounded-xl p-5 bg-gradient-to-br from-slate-50 to-slate-100">
                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <IconPhone className="h-4 w-4 text-indigo-600" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input id="phone" name="phone" label="Phone" icon={IconPhone} value={formData.phone || ''} onChange={handleInputChange} required />
                </div>
              </div>

              {/* Address Card */}
              <div className="border rounded-xl p-5 bg-gradient-to-br from-slate-50 to-slate-100">
                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <IconMapPin className="h-4 w-4 text-indigo-600" />
                  Address
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input id="address.street" name="address.street" label="Street" icon={IconMapPin} value={formData.address?.street || ''} onChange={handleInputChange} required />
                  </div>
                  <Input id="address.city" name="address.city" label="City" icon={IconMapPin} value={formData.address?.city || ''} onChange={handleInputChange} required />
                  <Input id="address.state" name="address.state" label="State" icon={IconWorld} value={formData.address?.state || ''} onChange={handleInputChange} required />
                  <Input id="address.postal_code" name="address.postal_code" label="Postal Code" icon={IconMail} value={formData.address?.postal_code || ''} onChange={handleInputChange} required />
                  <Input id="address.country" name="address.country" label="Country" icon={IconWorld} value={formData.address?.country || ''} onChange={handleInputChange} required />
                </div>
              </div>

              {/* Location Card */}
              <div className="border rounded-xl p-5 bg-gradient-to-br from-slate-50 to-slate-100">
                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <IconWorld className="h-4 w-4 text-indigo-600" />
                  Location Coordinates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input id="location.latitude" name="location.latitude" label="Latitude" icon={IconMapPin} value={formData.location?.latitude || ''} onChange={handleInputChange} />
                  <Input id="location.longitude" name="location.longitude" label="Longitude" icon={IconMapPin} value={formData.location?.longitude || ''} onChange={handleInputChange} />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)} 
                  className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition">
                  Cancel
                </button>
                <Button type="submit" loading={formLoading}>Save Changes</Button>
              </div>
            </form>
        )}
      </div>
    </div>
  );
}
