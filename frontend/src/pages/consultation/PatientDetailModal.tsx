import React, { useEffect, useState } from 'react';
import { Modal } from '../../components/Modal';
import { getPatientById } from '../../lib/apiClient';
import {
    IconUser,
    IconId,
    IconCalendar,
    IconGenderIntergender,
    IconPhone,
    IconMail,
    IconMapPin,
    IconFileDescription,
    IconClipboardList,
} from '@tabler/icons-react';

type Patient = Record<string, any> | null;

const DetailItem = ({ icon, label, value }: { icon?: React.ReactNode; label: string; value?: string | null }) => (
    <div>
        <label className="block text-sm font-medium text-slate-500 mb-1">{label}</label>
        <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                {icon}
            </span>
            <div className="w-full min-h-[42px] flex items-center rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-2.5 text-slate-800 font-medium text-sm">{value ?? <span className="text-slate-400 italic">—</span>}</div>
        </div>
    </div>
);

export default function PatientDetailModal({ isOpen, onClose, patient, loading, patientId }: { isOpen: boolean; onClose: () => void; patient?: Patient; loading?: boolean; patientId?: string }) {
    const formatDate = (d?: string | null) => {
        if (!d) return '—';
        try {
            const dt = new Date(d);
            return dt.toLocaleDateString();
        } catch { return String(d); }
    };
    const [localPatient, setLocalPatient] = useState<Patient | null>(patient ?? null);
    const [localLoading, setLocalLoading] = useState<boolean>(!!loading);

    useEffect(() => {
        setLocalPatient(patient ?? null);
        if (typeof loading === 'boolean') setLocalLoading(loading);
    }, [patient, loading]);

    useEffect(() => {
        if (!isOpen) return;
        if (!patientId) return;

        // if we already have the same patient loaded, skip fetch
        if (localPatient && (String(localPatient.id) === String(patientId) || String(localPatient.patient_id) === String(patientId))) {
            return;
        }

        let mounted = true;
        setLocalLoading(true);
        (async () => {
            try {
                // fetch patient details
                const resp = await getPatientById(patientId);
                const payload = resp?.data ?? resp;
                const extractPatient = (obj: any): any | null => {
                    if (!obj) return null;
                    if (obj.success && obj.data) return obj.data;
                    if (obj.data) return obj.data;
                    if (obj._id || obj.id || obj.patient_id) return obj;
                    return null;
                };
                const p = extractPatient(payload);
                if (p && mounted) {
                    const flat = {
                        id: p._id || p.id,
                        patient_id: p._id || p.id,
                        clinic_id: p.clinic_id || null,
                        file_number: p.file_number || null,
                        full_name: p.full_name || p.name || null,
                        date_of_birth: p.date_of_birth || null,
                        gender: p.gender || null,
                        address: p.address || null,
                        city: p.city || null,
                        state: p.state || null,
                        contact_number: p.contact_number || p.phone || null,
                        email: p.email || null,
                        uhid: p.uhid || null,
                        pincode: p.pincode || null,
                        avatar: p.avatar || null,
                        registration_type: p.registration_type || null,
                        createdAt: p.createdAt || p.created_at || null,
                        updatedAt: p.updatedAt || p.updated_at || null,
                    };
                    setLocalPatient(flat);
                }
            } catch (err) {

            } finally {

                if (mounted) setLocalLoading(false);
            }
        })();

        return () => { mounted = false; };
    }, [isOpen, patientId]);

    const effectivePatient = localPatient;
    const effectiveLoading = localLoading;
    const hasDisplayFields = Boolean(effectivePatient && Object.keys(effectivePatient).length > 0);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Patient Details">
            {effectiveLoading ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500" /></div>
            ) : hasDisplayFields ? (
                <div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                            {effectivePatient?.avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={effectivePatient.avatar} alt="avatar" className="h-full w-full object-cover" />
                            ) : (
                                <IconUser className="h-8 w-8 text-slate-400" />
                            )}
                        </div>
                        <div>
                            <div className="text-lg font-semibold text-slate-800">{effectivePatient?.full_name || effectivePatient?.name || '—'}</div>
                            <div className="text-sm text-slate-500">UHID: {effectivePatient?.uhid || '—'} • ID: {effectivePatient?.id || effectivePatient?.patient_id || '—'}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <DetailItem icon={<IconId />} label="File Number" value={effectivePatient?.file_number || '—'} />
                        <DetailItem icon={<IconCalendar />} label="Date of Birth" value={formatDate(effectivePatient?.date_of_birth)} />
                        <DetailItem icon={<IconGenderIntergender />} label="Gender" value={effectivePatient?.gender || '—'} />
                        <DetailItem icon={<IconPhone />} label="Contact" value={effectivePatient?.contact_number || effectivePatient?.phone || '—'} />
                        <DetailItem icon={<IconMail />} label="Email" value={effectivePatient?.email || '—'} />
                        <DetailItem icon={<IconMapPin />} label="Address" value={effectivePatient?.address || '—'} />
                        <DetailItem icon={<IconMapPin />} label="City" value={effectivePatient?.city || '—'} />
                        <DetailItem icon={<IconMapPin />} label="State" value={effectivePatient?.state || '—'} />
                        <DetailItem icon={<IconMapPin />} label="Pincode" value={effectivePatient?.pincode || '—'} />
                        <DetailItem icon={<IconMapPin />} label="Clinic ID" value={effectivePatient?.clinic_id || '—'} />
                        <DetailItem icon={<IconFileDescription />} label="Registration Type" value={effectivePatient?.registration_type || '—'} />
                        <DetailItem icon={<IconClipboardList />} label="Created" value={formatDate(effectivePatient?.createdAt)} />
                        <DetailItem icon={<IconClipboardList />} label="Updated" value={formatDate(effectivePatient?.updatedAt)} />
                    </div>
                </div>
            ) : effectivePatient ? (
                <div>
                    <p className="text-sm text-slate-600">Patient details are available but fields are different than expected. Showing raw data for debugging:</p>
                    <pre className="mt-3 text-xs text-slate-500 bg-slate-50 p-2 rounded max-h-80 overflow-auto">{JSON.stringify(effectivePatient, null, 2)}</pre>
                </div>
            ) : (
                <div>
                    <p className="text-sm text-slate-600">Patient details could not be loaded.</p>
                </div>
            )}
        </Modal>
    );
}
