import {
  IconLayoutDashboard,
  IconUsers,
  IconCalendarTime,
  IconSettings,
  IconVideoPlus,
  IconBuildingHospital,
  IconShield,
} from "@tabler/icons-react";
import type { ReactNode } from "react";

export type NavItem = {
  label: string;
  to: string;
  icon: (props: { className?: string }) => ReactNode;
  roles?: string[];
};

const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  RECEPTIONIST: 'receptionist',
};

export const NAV_ITEMS: NavItem[] = [
  { 
    label: "Dashboard",
    to: "/dashboard",
    icon: (p) => <IconLayoutDashboard className={`h-4 w-4 ${p.className ?? ""}`} />,
    roles: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST],
  },
  { 
    label: "Clinics",
    to: "/clinics",
    icon: (p) => <IconBuildingHospital className={`h-4 w-4 ${p.className ?? ""}`} />,
    roles: [ROLES.SUPER_ADMIN],
  },
  { 
    label: "Patients",
    to: "/patients",
    icon: (p) => <IconUsers className={`h-4 w-4 ${p.className ?? ""}`} />,
    roles: [ROLES.ADMIN, ROLES.DOCTOR],
  },
  { 
    label: "Appointments",
    to: "/appointments",
    icon: (p) => <IconCalendarTime className={`h-4 w-4 ${p.className ?? ""}`} />,
    roles: [ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.DOCTOR,],
  },
  { 
    label: "Insight Videos",
    to: "/insight-videos",
    icon: (p) => <IconVideoPlus className={`h-4 w-4 ${p.className ?? ""}`} />,
    roles: [ROLES.ADMIN, ROLES.RECEPTIONIST],
  },
  { 
    label: "Settings",
    to: "/settings",
    icon: (p) => <IconSettings className={`h-4 w-4 ${p.className ?? ""}`} />,
    roles: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.SUPER_ADMIN],
  },
];
