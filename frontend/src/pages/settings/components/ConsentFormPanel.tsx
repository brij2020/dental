import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { IconChevronLeft, IconDownload, IconPlus, IconTrash, IconDeviceFloppy } from '@tabler/icons-react';

type ConsentField = {
  id: string;
  label: string;
  type: 'text' | 'date' | 'signature';
  required: boolean;
  placeholder?: string;
};

type ConsentTemplate = {
  title: string;
  body: string;
  fields: ConsentField[];
  updatedAt: string;
};

const STORAGE_KEY = 'settings:consent-template:v1';
const DEFAULT_CONSENT_TITLE = 'INFORMED CONSENT FORM FOR GENERAL DENTAL TREATMENT';

const defaultFields = (): ConsentField[] => [
  { id: 'patient_name', label: 'Patient Name', type: 'text', required: true },
  { id: 'date_of_birth', label: 'Date of Birth', type: 'date', required: true },
  { id: 'visit_date', label: 'Date', type: 'date', required: true },
  { id: 'dentist_name', label: 'Dentist', type: 'text', required: true },
  { id: 'practice_name', label: 'Practice Name', type: 'text', required: true },
  { id: 'patient_signature', label: 'Patient / Guardian Signature', type: 'signature', required: true },
  { id: 'dentist_signature', label: 'Dentist Signature', type: 'signature', required: true },
];

const extractTemplateFromHtml = (html: string): { title: string; body: string } => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const nodes = Array.from(doc.querySelectorAll('p, li'));
    const lines = nodes
      .map((n) => (n.textContent || '').replace(/\s+/g, ' ').trim())
      .filter((line) => line.length > 0)
      .filter((line) => !/^Consent Form for Online Video Consultation:?$/i.test(line))
      .filter((line) => !/^Consent Form for oral photographs:?$/i.test(line));

    const title = lines[0] || DEFAULT_CONSENT_TITLE;
    const body = lines.slice(1).join('\n');
    return { title, body };
  } catch {
    return { title: DEFAULT_CONSENT_TITLE, body: '' };
  }
};

export default function ConsentFormPanel() {
  const [title, setTitle] = useState(DEFAULT_CONSENT_TITLE);
  const [body, setBody] = useState('');
  const [fields, setFields] = useState<ConsentField[]>(defaultFields());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadTemplate = async () => {
      try {
        const local = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
        if (local) {
          const parsed = JSON.parse(local) as ConsentTemplate;
          if (!mounted) return;
          setTitle(parsed.title || DEFAULT_CONSENT_TITLE);
          setBody(parsed.body || '');
          setFields(Array.isArray(parsed.fields) && parsed.fields.length > 0 ? parsed.fields : defaultFields());
          return;
        }

        const resp = await fetch('/docs/Consent_form.html');
        const html = await resp.text();
        if (!mounted) return;
        const extracted = extractTemplateFromHtml(html);
        setTitle(extracted.title);
        setBody(extracted.body);
        setFields(defaultFields());
      } catch {
        if (!mounted) return;
        setTitle(DEFAULT_CONSENT_TITLE);
        setBody('');
        setFields(defaultFields());
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadTemplate();
    return () => {
      mounted = false;
    };
  }, []);

  const addField = () => {
    setFields((prev) => [
      ...prev,
      {
        id: `custom_${Date.now()}`,
        label: 'Custom Field',
        type: 'text',
        required: false,
        placeholder: '',
      },
    ]);
  };

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const updateField = (id: string, patch: Partial<ConsentField>) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const handleSave = () => {
    setSaving(true);
    try {
      const payload: ConsentTemplate = {
        title: title.trim() || DEFAULT_CONSENT_TITLE,
        body: body.trim(),
        fields,
        updatedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      toast.success('Consent template saved.');
    } catch {
      toast.error('Failed to save consent template.');
    } finally {
      setSaving(false);
    }
  };

  const bodyPreviewLines = useMemo(
    () =>
      body
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0),
    [body],
  );

  return (
    <div>
      <Link to="/settings" className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
        <IconChevronLeft className="h-5 w-5" />
        Back to Settings
      </Link>

      <div className="rounded-2xl border bg-white p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Consent Form Template</h2>
            <p className="mt-1 text-sm text-slate-500">
              Dynamic consent form generated from uploaded doc. Edit content and fields used during consultation.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/docs/Consent_form.docx"
              download="Consent_form.docx"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <IconDownload className="h-4 w-4" />
              Download Source
            </a>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <IconDeviceFloppy className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Loading consent template...</div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Form Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-300/40"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Consent Body</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={14}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-300/40"
                  placeholder="Consent content..."
                />
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">Dynamic Fields</h3>
                  <button
                    type="button"
                    onClick={addField}
                    className="inline-flex items-center gap-1 rounded-lg bg-sky-100 px-2.5 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-200"
                  >
                    <IconPlus className="h-3.5 w-3.5" />
                    Add Field
                  </button>
                </div>
                <div className="space-y-2">
                  {fields.map((field) => (
                    <div key={field.id} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 sm:grid-cols-[1fr_120px_90px_36px]">
                      <input
                        value={field.label}
                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                        className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                      />
                      <select
                        value={field.type}
                        onChange={(e) => updateField(field.id, { type: e.target.value as ConsentField['type'] })}
                        className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                      >
                        <option value="text">Text</option>
                        <option value="date">Date</option>
                        <option value="signature">Signature</option>
                      </select>
                      <label className="flex items-center gap-2 text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(field.id, { required: e.target.checked })}
                        />
                        Required
                      </label>
                      <button
                        type="button"
                        onClick={() => removeField(field.id)}
                        className="inline-flex items-center justify-center rounded-md text-slate-500 hover:bg-rose-100 hover:text-rose-600"
                        title="Remove field"
                      >
                        <IconTrash className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-800">Live Preview</h3>
              <div className="mt-3 max-h-[72vh] overflow-y-auto rounded-lg border border-slate-300 bg-white p-4">
                <h4 className="mb-3 text-center text-base font-semibold text-slate-900">{title || DEFAULT_CONSENT_TITLE}</h4>
                <div className="space-y-2 text-sm text-slate-700">
                  {bodyPreviewLines.map((line, idx) => (
                    <p key={`consent-line-${idx}`}>{line}</p>
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {fields.map((field) => (
                    <label key={`preview-${field.id}`} className="text-xs text-slate-600">
                      <span className="mb-1 block font-medium">
                        {field.label} {field.required ? '*' : ''}
                      </span>
                      <input
                        type={field.type === 'date' ? 'date' : 'text'}
                        disabled
                        placeholder={field.placeholder || ''}
                        className="w-full rounded-lg border border-slate-300 bg-slate-100 px-2 py-1.5 text-sm"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
