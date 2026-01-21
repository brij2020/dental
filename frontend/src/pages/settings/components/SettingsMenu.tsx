// src/features/settings/components/SettingsMenu.tsx

import {
  IconUsersGroup,
  IconLock,
  IconBuildingHospital,
  IconCash,
  IconClock,
  IconFileCheck,
  IconStethoscope,
  IconHeartbeat,
  IconPill,
  IconVideo,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../state/useAuth';
import type { ElementType } from 'react';

type MenuItemProps = {
  title: string;
  description: string;
  icon: ElementType;
  to: string;
};

// --- UPDATED MenuItem COMPONENT ---
// Now a card-based layout for the grid view
const MenuItem = ({ title, description, icon: Icon, to }: MenuItemProps) => (
  <Link
    to={to}
    className="flex flex-col items-center gap-4 p-6 text-center transition-colors bg-white border rounded-2xl hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
  >
    <div className="grid w-16 h-16 text-indigo-600 bg-indigo-100 rounded-full place-items-center">
      <Icon className="w-8 h-8" />
    </div>
    <div>
      <h3 className="font-semibold text-slate-800">{title}</h3>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  </Link>
);


// --- UPDATED SettingsMenu COMPONENT ---
// Uses a responsive grid layout
export const SettingsMenu = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
      {isAdmin && (
        <MenuItem
          title="Staff Management"
          description="Add & manage staff members."
          icon={IconUsersGroup}
          to="/settings/users"
        />
      )}
      <MenuItem
        title="Profile & Security"
        description="Update your password."
        icon={IconLock}
        to="/settings/profile"
      />
      {!isSuperAdmin && (
        <MenuItem
          title="Clinic Information"
          description="Manage address & contact details."
          icon={IconBuildingHospital}
          to="/settings/clinic"
        />
      )}
      {!isSuperAdmin && (
        <MenuItem
          title="Fees"
          description="Manage consultation & procedure fees."
          icon={IconCash}
          to="/settings/fees"
        />
      )}
      {!isSuperAdmin && (
        <MenuItem
          title="Clinic Appointment Timing"
          description="Configure available slots."
          icon={IconClock}
          to="/settings/timings"
        />
      )}
      {!isSuperAdmin && (
        <MenuItem
          title="Leave Settings"
          description="Configure leave ."
          icon={IconClock}
          to="/settings/leaves"
        />
      )}
      <MenuItem
        title="Consent Forms"
        description="Customize patient consent forms."
        icon={IconFileCheck}
        to="/settings/consent"
      />
      <MenuItem
        title="Clinical Procedures"
        description="Define medical procedures offered."
        icon={IconStethoscope}
        to="/settings/procedures"
      />
      <MenuItem
        title="Medical Conditions"
        description="Manage a list of common conditions."
        icon={IconHeartbeat}
        to="/settings/conditions"
      />
      <MenuItem
        title="Remedies"
        description="Manage prescribed remedies."
        icon={IconPill}
        to="/settings/remedies"
      />
      <MenuItem
        title="Clinical Findings"
        description="Manage procedure-related problems."
        icon={IconPill}
        to="/settings/problems"
      />
      <MenuItem
        title="Video Consultation Timings"
        description="Configure video call schedules."
        icon={IconVideo}
        to="/settings/video-consultation-timings"
      />
      {!isSuperAdmin && (
        <MenuItem
          title="Clinic Panels"
          description="Manage clinic panel associations."
          icon={IconBuildingHospital}
          to="/settings/clinic-panels"
        />
      )}
    </div>
  );
};

export default SettingsMenu;