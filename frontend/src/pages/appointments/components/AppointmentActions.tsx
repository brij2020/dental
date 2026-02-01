// features/appointments/components/AppointmentActions.tsx
import React from 'react';
import { IconDotsVertical, IconTrash, IconPencil, IconBrandWhatsapp } from '@tabler/icons-react';

export default function AppointmentActions() {
  const [open, setOpen] = React.useState(false);
  const [coords, setCoords] = React.useState<{ top: number; left: number } | null>(null);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  const handleAction = (action: string) => {
    setOpen(false);
    console.log(`${action} clicked. This functionality is not yet implemented.`);
  };

  const toggle = () => {
    if (!btnRef.current) return;
    if (!open) {
      const rect = btnRef.current.getBoundingClientRect();
      const menuWidth = 224; // w-56 =~ 224px
      const padding = 8;
      let left = rect.right - menuWidth;
      if (left < padding) left = rect.left;
      if (left + menuWidth > window.innerWidth - padding) left = window.innerWidth - menuWidth - padding;
      const top = rect.bottom + window.scrollY + 6;
      setCoords({ top, left });
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  // Close on outside click or Escape
  React.useEffect(() => {
    if (!open) return;
    const onMousedown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current && menuRef.current.contains(target)) return;
      if (btnRef.current && btnRef.current.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('mousedown', onMousedown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onMousedown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative inline-block text-left">
      <button
        ref={btnRef}
        onClick={toggle}
        aria-haspopup="true"
        aria-expanded={open}
        className="p-2 text-slate-500 rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
      >
        <IconDotsVertical size={20} />
      </button>

      {open && coords && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Appointment actions"
          style={{ position: 'fixed', top: coords.top, left: coords.left, width: 224 }}
          className="bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[9999]"
        >
          <div className="p-2">
            <button
              onClick={() => handleAction('Edit')}
              className="group flex rounded-lg items-center w-full px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <IconPencil className="w-5 h-5 mr-3 text-slate-500" />
              Edit Appointment
            </button>
            <button
              onClick={() => handleAction('WhatsApp')}
              className="group flex rounded-lg items-center w-full px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <IconBrandWhatsapp className="w-5 h-5 mr-3 text-green-500" />
              Send Reminder
            </button>
          </div>
          <div className="border-t border-slate-100 p-2">
            <button
              onClick={() => handleAction('Delete')}
              className="group flex rounded-lg items-center w-full px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
            >
              <IconTrash className="w-5 h-5 mr-3" />
              Cancel Appointment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}