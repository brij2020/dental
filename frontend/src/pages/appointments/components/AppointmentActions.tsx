// features/appointments/components/AppointmentActions.tsx
import React from 'react';
import { Menu, Transition } from '@headlessui/react';
import { IconDotsVertical, IconTrash, IconPencil, IconBrandWhatsapp } from '@tabler/icons-react';

export default function AppointmentActions() {
  const handleAction = (action: string) => {
    console.log(`${action} clicked. This functionality is not yet implemented.`);
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="p-2 text-slate-500 rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors">
          <IconDotsVertical size={20} />
        </Menu.Button>
      </div>
      <Transition
        as={React.Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        {/* The z-index has been increased from z-10 to z-30 */}
        <Menu.Items className="absolute right-0 w-56 mt-2 origin-top-right bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-30">
          <div className="p-2">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => handleAction('Edit')}
                  className={`
                    ${active ? 'bg-slate-100 text-slate-900' : 'text-slate-700'}
                    group flex rounded-lg items-center w-full px-3 py-2 text-sm font-medium transition-colors
                  `}
                >
                  <IconPencil className="w-5 h-5 mr-3 text-slate-500" />
                  Edit Appointment
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => handleAction('WhatsApp')}
                  className={`
                    ${active ? 'bg-slate-100 text-slate-900' : 'text-slate-700'}
                    group flex rounded-lg items-center w-full px-3 py-2 text-sm font-medium transition-colors
                  `}
                >
                  <IconBrandWhatsapp className="w-5 h-5 mr-3 text-green-500" />
                  Send Reminder
                </button>
              )}
            </Menu.Item>
          </div>
          <div className="border-t border-slate-100 p-2">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => handleAction('Delete')}
                  className={`
                    ${active ? 'bg-rose-50 text-rose-600' : 'text-rose-600'}
                    group flex rounded-lg items-center w-full px-3 py-2 text-sm font-medium transition-colors
                  `}
                >
                  <IconTrash className="w-5 h-5 mr-3" />
                  Cancel Appointment
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}