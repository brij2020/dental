// src/features/settings/Settings.tsx

import { Outlet } from 'react-router-dom';

export default function Settings() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
            <Outlet />
    </div>
  );
}