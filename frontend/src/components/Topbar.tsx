import {
  IconMenu2, IconBell, IconChevronDown, IconLogout,
} from "@tabler/icons-react";
import { useAuth } from "../state/useAuth";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient"; // 👈 add this

type Props = { onMenuClick: () => void };

function useClickOutside<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);
  return ref;
}

export default function Topbar({ onMenuClick }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // 👇 new: get full_name from profiles
  const [fullName, setFullName] = useState<string | null>(null);
console.log('Auth User in Topbar:', user);
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user?.id) { setFullName(null); return; }
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      if (!alive) return;
      if (error) {
        console.error("profiles select error:", error);
        setFullName(null);
        return;
      }
      setFullName((data?.full_name ?? "").trim() || null);
    })();
    return () => { alive = false; };
  }, [user?.id]);

  // prefer full_name; fall back to email; then "Guest"
  const display = fullName || user?.email || "Guest";
  const initial = (display?.[0] ?? "U").toUpperCase();

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useClickOutside<HTMLDivElement>(profileOpen, () => setProfileOpen(false));

  return (
    <header className="sticky top-0 z-30 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="relative h-18 flex items-center gap-3 px-4">
        {/* mobile menu */}
        <button className="lg:hidden p-2 rounded-xl hover:bg-slate-100 active:bg-slate-200"
                onClick={onMenuClick} aria-label="Open navigation">
          <IconMenu2 className="h-5 w-5 text-slate-700" />
        </button>

        {/* LEFT: welcome text */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Welcome,</span>
          <span className="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-sky-500">
            {display}
          </span>
        </div>

        {/* RIGHT: actions */}
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {/* notifications */}
          <button
            className="relative p-2 rounded-xl hover:bg-slate-100 active:bg-slate-200"
            aria-label="Notifications"
          >
            <IconBell className="h-5 w-5 text-slate-700" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-sky-500 ring-2 ring-white" />
          </button>

          {/* profile menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white pl-1 pr-2 py-1 shadow-sm hover:bg-slate-50"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
            >
              <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-indigo-600 to-sky-500 text-white text-xs font-semibold">
                {initial}
              </div>
              <IconChevronDown className="h-4 w-4 text-slate-500" />
            </button>

            {profileOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
              >
                <MenuItem onClick={() => navigate("/settings")}>
                  Profile
                </MenuItem>
                <MenuItem onClick={() => navigate("/settings")}>
                  Settings
                </MenuItem>
                <MenuDivider />
                <MenuItem
                  onClick={logout}
                  icon={<IconLogout className="h-4 w-4" />}
                >
                  Logout
                </MenuItem>
              </div>
            )}
          </div>
        </div>

        {/* soft hairline (no heavy border) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent" />
      </div>
    </header>
  );
}

function MenuItem({
  children,
  onClick,
  icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
    >
      {icon ? <span className="text-slate-500">{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
}

function MenuDivider() {
  return <div className="my-1 h-px bg-slate-200" />;
}
