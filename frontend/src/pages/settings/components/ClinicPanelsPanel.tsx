
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
} from '@tabler/icons-react';
import { useAuth } from '../../../state/useAuth';
import {
  getAllClinicPanels,
  createClinicPanel,
  updateClinicPanel,
  deleteClinicPanel,
  createProcedure,
} from '../../../lib/apiClient';

type ModalMode = 'add' | 'edit';

interface Panel {
  _id?: string;
  id?: string;
  name: string;
  code: string;
  clinic_id: string;
  specialization?: string;
  description?: string;
  is_active?: boolean;
  opening_time?: string;
  closing_time?: string;
}

type ProcedureFormData = {
  panel_id: string;
  name: string;
  procedure_type: string;
  cost: number;
  description: string;
  note: string;
};

const PROCEDURE_TYPES = [
  'General',
  'Cosmetic',
  'Surgical',
  'Diagnostic',
  'Preventive',
  'Restorative',
  'Orthodontic',
  'Prosthodontic',
  'Periodontal',
  'Endodontic',
  'Other',
];

export default function ClinicPanelsPanel() {
  const { user } = useAuth();
  const [panels, setPanels] = useState<Panel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcedureSaving, setIsProcedureSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('add');
  const [editingPanelId, setEditingPanelId] = useState<string | null>(null);
  const [panelName, setPanelName] = useState('');
  const [panelCode, setPanelCode] = useState('');
  const [panelSpecialization, setPanelSpecialization] = useState('');
  const [panelDescription, setPanelDescription] = useState('');
  const [selectedPanelForProcedure, setSelectedPanelForProcedure] = useState('');
  const [isProcedureModalOpen, setIsProcedureModalOpen] = useState(false);
  const [procedureForm, setProcedureForm] = useState<ProcedureFormData>({
    panel_id: '',
    name: '',
    procedure_type: 'General',
    cost: 0,
    description: '',
    note: '',
  });

  const clinicId = user?.clinic_id;

  const fetchPanels = useCallback(async () => {
    if (!clinicId) return;

    setIsLoading(true);
    try {
      const response = await getAllClinicPanels(clinicId, { limit: 100 });
      setPanels(response.data?.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch panels.');
    } finally {
      setIsLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    fetchPanels();
  }, [fetchPanels]);

  const openAddModal = () => {
    setModalMode('add');
    setEditingPanelId(null);
    setPanelName('');
    setPanelCode('');
    setPanelSpecialization('');
    setPanelDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (panel: Panel) => {
    setModalMode('edit');
    setEditingPanelId(panel._id || panel.id || '');
    setPanelName(panel.name || '');
    setPanelCode(panel.code || '');
    setPanelSpecialization(panel.specialization || '');
    setPanelDescription(panel.description || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPanelName('');
    setPanelCode('');
    setPanelSpecialization('');
    setPanelDescription('');
    setEditingPanelId(null);
  };

  const openProcedureModal = () => {
    if (!clinicId) return;
    setProcedureForm({
      panel_id: selectedPanelForProcedure,
      name: '',
      procedure_type: 'General',
      cost: 0,
      description: '',
      note: '',
    });
    setIsProcedureModalOpen(true);
  };

  const closeProcedureModal = () => {
    setIsProcedureModalOpen(false);
  };

  const savePanelToApi = async (panelData: Partial<Panel>) => {
    if (!clinicId) return false;

    setIsSaving(true);
    try {
      if (modalMode === 'add') {
        // Create new panel
        const response = await createClinicPanel({
          ...panelData,
          clinic_id: clinicId,
        });

        setPanels([...panels, response.data?.data]);
        toast.success('Panel created successfully');
        return true;
      } else if (modalMode === 'edit' && editingPanelId) {
        // Update existing panel
        const response = await updateClinicPanel(editingPanelId, panelData);

        setPanels(
          panels.map(p => (p._id === editingPanelId || p.id === editingPanelId ? response.data?.data : p))
        );
        toast.success('Panel updated successfully');
        return true;
      }
    } catch (error: any) {
      console.error(error);
      const errorMsg = error?.response?.data?.message || error.message || 'Failed to save panel';
      toast.error(errorMsg);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = panelName.trim();
    const codeTrimmed = panelCode.trim().toUpperCase();

    if (!trimmed || !codeTrimmed || !clinicId) {
      toast.error('Panel name and code are required');
      return;
    }

    // Check for duplicate code (excluding current panel if editing)
    const isDuplicate = panels.some(
      p =>
        p.code === codeTrimmed &&
        (modalMode === 'add' || (p._id !== editingPanelId && p.id !== editingPanelId))
    );

    if (isDuplicate) {
      toast.error('A panel with this code already exists');
      return;
    }

    const panelData = {
      name: trimmed,
      code: codeTrimmed,
      specialization: panelSpecialization || undefined,
      description: panelDescription || undefined,
      is_active: true,
    };

    const ok = await savePanelToApi(panelData);
    if (ok) {
      closeModal();
    }
  };

  const handleDelete = async (panel: Panel) => {
    const panelId = panel._id || panel.id;
    if (!panelId) return;

    if (
      !window.confirm(
        `Are you sure you want to delete panel "${panel.name}"?`
      )
    ) {
      return;
    }

    try {
      setIsSaving(true);
      await deleteClinicPanel(panelId);

      setPanels(panels.filter(p => (p._id || p.id) !== panelId));
      toast.success('Panel deleted successfully');
    } catch (error: any) {
      console.error(error);
      const errorMsg = error?.response?.data?.message || error.message || 'Failed to delete panel';
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleProcedureSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!clinicId) return;
    if (!procedureForm.name.trim()) {
      toast.error('Procedure name is required');
      return;
    }

    setIsProcedureSaving(true);
    try {
      await createProcedure({
        clinic_id: clinicId,
        panel_id: procedureForm.panel_id || null,
        name: procedureForm.name.trim(),
        procedure_type: procedureForm.procedure_type,
        cost: Number(procedureForm.cost) || 0,
        description: procedureForm.description.trim() || null,
        note: procedureForm.note.trim() || null,
      });
      toast.success('Procedure created successfully.');
      closeProcedureModal();
    } catch (error: any) {
      console.error(error);
      const errorMsg = error?.response?.data?.message || error.message || 'Failed to create procedure';
      toast.error(errorMsg);
    } finally {
      setIsProcedureSaving(false);
    }
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
            <h2 className="text-lg font-semibold text-slate-800">Panels</h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage the list of panels for your clinic.
            </p>
          </div>
          <button
            onClick={openAddModal}
            disabled={isLoading}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-2 font-medium text-white shadow-sm transition hover:brightness-105 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 md:mt-0"
          >
            <IconPlus className="h-5 w-5" />
            Add Panel
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-end">
          <div className="w-full sm:max-w-sm">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Select Panel for Procedure
            </label>
            <select
              value={selectedPanelForProcedure}
              onChange={(e) => setSelectedPanelForProcedure(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-300/40"
            >
              <option value="">No panel</option>
              {panels.map((panel) => (
                <option key={panel._id || panel.id} value={panel._id || panel.id}>
                  {panel.name} ({panel.code})
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={openProcedureModal}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Create Procedure
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
                    Panel Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
                  >
                    Code
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
                  >
                    Specialization
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
                      colSpan={2}
                      className="p-8 text-center text-slate-500"
                    >
                      Loading panels...
                    </td>
                  </tr>
                )}

                {!isLoading && panels.length === 0 && (
                  <tr>
                    <td
                      colSpan={2}
                      className="p-8 text-center text-slate-500"
                    >
                      <IconAlertCircle className="mx-auto h-12 w-12 text-slate-400" />
                      <p className="mt-2 font-medium">No panels found.</p>
                      <p className="text-sm">
                        Click &quot;Add Panel&quot; to get started.
                      </p>
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  panels.map((panel) => (
                    <tr key={panel._id || panel.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                        {panel.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        {panel.code}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        {panel.specialization || '-'}
                      </td>
                      <td className="flex items-center justify-end gap-2 px-6 py-4 text-right text-sm font-medium">
                        <button
                          onClick={() => openEditModal(panel)}
                          title="Edit"
                          className="rounded-md p-1.5 text-slate-500 hover:bg-sky-100 hover:text-sky-600"
                        >
                          <IconPencil className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(panel)}
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
          aria-labelledby="panel-modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-xl">
            <form onSubmit={handleSubmit}>
              {/* Modal Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3
                    id="panel-modal-title"
                    className="text-lg font-semibold text-slate-800"
                  >
                    {modalMode === 'add' ? 'Add Panel' : 'Edit Panel'}
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
                    htmlFor="panel_name"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Panel Name
                  </label>
                  <input
                    type="text"
                    id="panel_name"
                    value={panelName}
                    onChange={e => setPanelName(e.target.value)}
                    required
                    autoFocus
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-300/40"
                    placeholder="e.g., Pediatric Dentistry"
                  />
                </div>

                <div>
                  <label
                    htmlFor="panel_code"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Panel Code
                  </label>
                  <input
                    type="text"
                    id="panel_code"
                    value={panelCode}
                    onChange={e => setPanelCode(e.target.value.toUpperCase())}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-300/40"
                    placeholder="e.g., PED"
                    maxLength={10}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Unique identifier for this panel (e.g., PED, ORTHO, IMPL)
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="panel_specialization"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Specialization (Optional)
                  </label>
                  <select
                    id="panel_specialization"
                    value={panelSpecialization}
                    onChange={e => setPanelSpecialization(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-300/40"
                  >
                    <option value="">-- Select Specialization --</option>
                    <option value="General Dentistry">General Dentistry</option>
                    <option value="Pediatric Dentistry">Pediatric Dentistry</option>
                    <option value="Orthodontics">Orthodontics</option>
                    <option value="Periodontics">Periodontics</option>
                    <option value="Prosthodontics">Prosthodontics</option>
                    <option value="Endodontics">Endodontics</option>
                    <option value="Oral Surgery">Oral Surgery</option>
                    <option value="Implantology">Implantology</option>
                    <option value="Cosmetic Dentistry">Cosmetic Dentistry</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="panel_description"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Description (Optional)
                  </label>
                  <textarea
                    id="panel_description"
                    value={panelDescription}
                    onChange={e => setPanelDescription(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-300/40"
                    placeholder="e.g., Dental care for children ages 2-12"
                    rows={3}
                  />
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

      {/* Create Procedure Modal */}
      {isProcedureModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          aria-labelledby="procedure-modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-xl">
            <form onSubmit={handleProcedureSubmit}>
              <div className="flex items-start justify-between">
                <h3 id="procedure-modal-title" className="text-lg font-semibold text-slate-800">
                  Create Procedure
                </h3>
                <button
                  type="button"
                  onClick={closeProcedureModal}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <IconX className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Panel</label>
                  <select
                    value={procedureForm.panel_id}
                    onChange={(e) => setProcedureForm(prev => ({ ...prev, panel_id: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-300/40"
                  >
                    <option value="">No panel</option>
                    {panels.map((panel) => (
                      <option key={panel._id || panel.id} value={panel._id || panel.id}>
                        {panel.name} ({panel.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Procedure Name</label>
                  <input
                    type="text"
                    required
                    value={procedureForm.name}
                    onChange={(e) => setProcedureForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-300/40"
                    placeholder="e.g., Root Canal Therapy"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
                  <select
                    value={procedureForm.procedure_type}
                    onChange={(e) => setProcedureForm(prev => ({ ...prev, procedure_type: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-300/40"
                  >
                    {PROCEDURE_TYPES.map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Cost</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={procedureForm.cost}
                    onChange={(e) => setProcedureForm(prev => ({ ...prev, cost: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-300/40"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={closeProcedureModal}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcedureSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-5 py-2 font-medium text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <IconDeviceFloppy className="h-5 w-5" />
                  <span>{isProcedureSaving ? 'Saving...' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
