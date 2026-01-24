// src/features/settings/components/ClinicInformationPanel.tsx

import React, { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { getClinicById, updateClinicById } from '../../../lib/apiClient';
import { useAuth } from '../../../state/useAuth';
import { toast } from 'react-toastify';
import {
  IconChevronLeft,
  IconBuilding,
  IconMapPin,
  IconWorld,
  IconMail,
  IconPhone,
  IconUser,
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
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    } finally {
      setFormLoading(false);
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
          <div className="mt-4 space-y-3 text-sm">
            <p><strong>Name:</strong> {clinic?.name}</p>
            <p><strong>Status:</strong> {clinic?.status}</p>
            <p><strong>Branding Moto:</strong> {clinic?.branding_moto}</p>
            <p><strong>Description:</strong> {clinic?.description}</p>
            <p><strong>Phone:</strong> {clinic?.phone}</p>
            <p><strong>Address:</strong> {clinic?.address?.street}, {clinic?.address?.city}, {clinic?.address?.state}, {clinic?.address?.postal_code}, {clinic?.address?.country}</p>
            <p><strong>Location:</strong> Lat: {clinic?.location?.latitude}, Lng: {clinic?.location?.longitude}</p>
            <p><strong>Created At:</strong> {clinic?.createdAt}</p>
            <p><strong>Updated At:</strong> {clinic?.updatedAt}</p>
          </div>
        ) : (
            <form onSubmit={handleUpdateClinic} className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Input id="name" name="name" label="Clinic Name" icon={IconBuilding} value={formData.name || ''} onChange={handleInputChange} required />
            <Input id="status" name="status" label="Status" icon={IconEdit} value={formData.status || ''} onChange={handleInputChange} required />
            <Input id="branding_moto" name="branding_moto" label="Branding Moto" icon={IconEdit} value={formData.branding_moto || ''} onChange={handleInputChange} />
            <Input id="description" name="description" label="Description" icon={IconEdit} value={formData.description || ''} onChange={handleInputChange} />
            <Input id="phone" name="phone" label="Phone" icon={IconPhone} value={formData.phone || ''} onChange={handleInputChange} required />
            <Input id="address.street" name="address.street" label="Street" icon={IconMapPin} value={formData.address?.street || ''} onChange={handleInputChange} required />
            <Input id="address.city" name="address.city" label="City" icon={IconMapPin} value={formData.address?.city || ''} onChange={handleInputChange} required />
            <Input id="address.state" name="address.state" label="State" icon={IconWorld} value={formData.address?.state || ''} onChange={handleInputChange} required />
            <Input id="address.postal_code" name="address.postal_code" label="Postal Code" icon={IconMail} value={formData.address?.postal_code || ''} onChange={handleInputChange} required />
            <Input id="address.country" name="address.country" label="Country" icon={IconWorld} value={formData.address?.country || ''} onChange={handleInputChange} required />
            <Input id="location.latitude" name="location.latitude" label="Latitude" icon={IconMapPin} value={formData.location?.latitude || ''} onChange={handleInputChange} />
            <Input id="location.longitude" name="location.longitude" label="Longitude" icon={IconMapPin} value={formData.location?.longitude || ''} onChange={handleInputChange} />
            <div className="flex justify-end gap-3 pt-4 md:col-span-2">
              <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200">Cancel</button>
              <Button type="submit" loading={formLoading}>Save Changes</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}