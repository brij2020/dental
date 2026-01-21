import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "../config/navigation";
import { IconHelpCircle } from "@tabler/icons-react";
import { useAuth } from "../state/useAuth"; 
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import fallbackLogo from "../assets/spai.jpeg";

type Props = { onNavigate?: () => void };

const base =
  "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all " +
  "before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r-full " +
  "before:bg-gradient-to-b before:from-sky-300/80 before:to-indigo-300/80 before:opacity-0";
const active =
  "text-white bg-white/10 ring-1 ring-white/15 backdrop-blur before:opacity-100";
const inactive = "text-white/80 hover:text-white hover:bg-white/5";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `${base} ${isActive ? active : inactive}`;

export default function Sidebar({ onNavigate }: Props) {
  const { user } = useAuth();
  const [clinicName, setClinicName] = useState<string | null>(null);
  const [clinicLogoUrl, setClinicLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      setClinicName(null);
      setClinicLogoUrl(null);

      if (!user?.clinic_id) return;

      const { data: clinic, error } = await supabase
        .from("clinics")
        .select("name, clinic_logo_path")
        .eq("id", user.clinic_id)
        .single();

      if (!alive || error || !clinic) return;

      setClinicName(clinic.name ?? "Clinic");

      if (clinic.clinic_logo_path) {
        const { data: signed, error: signErr } = await supabase
          .storage
          .from("clinic-logos")
          .createSignedUrl(clinic.clinic_logo_path, 60 * 60);

        if (!alive || signErr) return;
        setClinicLogoUrl(signed?.signedUrl ?? null);
      }
    })();

    return () => { alive = false; };
  }, [user?.clinic_id]);

  const accessibleNavItems = useMemo(() => {
    if (!user) return [];
    return NAV_ITEMS.filter(item => {
      if (!item.roles) return true;
      return item.roles.includes(user.role);
    });
  }, [user]);

  return (
    <div className="relative flex h-full flex-col text-white">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-700 via-indigo-600 to-sky-600" />
      <div className="absolute inset-0 -z-10 bg-[url('/noise.svg')] opacity-[0.03]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.1),transparent_40%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.1),transparent_40%)]" />

      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img
            src={clinicLogoUrl ?? fallbackLogo}
            alt={clinicName ?? "Clinic"}
            className="h-9 w-9 rounded-lg ring-1 ring-white/25 shadow-sm object-cover"
          />
          <div>
            <div className="text-base font-semibold">
              {clinicName ?? "Loading…"}
            </div>
            <div className="text-xs text-white/70 capitalize">
              {user?.role ?? "Guest"}
            </div>
          </div>
        </div>
      </div>

      <nav className="p-4 flex-1 space-y-2 overflow-y-auto">
        {accessibleNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={linkClass}
            onClick={onNavigate}
          >
            <span className="shrink-0 opacity-90 group-hover:opacity-100">
              {item.icon({})}
            </span>
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <a
          href="#"
          className="flex items-center gap-2 text-sm text-white/85 hover:text-white transition-colors"
          onClick={onNavigate}
        >
          <IconHelpCircle className="h-4 w-4" />
          Support
        </a>
        <div className="mt-2 text-xs text-white/70">v0.1.0</div>

        {/* Powered By Section */}
        <a 
          href="https://www.stoma.ai" 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-6 flex items-center gap-2 group/powered"
        >
          <span className="text-[10px] uppercase tracking-wider text-white/40 group-hover/powered:text-white/80 transition-colors">
            Powered by
          </span>
          <img 
            src={fallbackLogo} 
            alt="Stoma.ai" 
            className="h-5 w-5 rounded object-cover opacity-60 grayscale group-hover/powered:opacity-100 group-hover/powered:grayscale-0 transition-all duration-300"
          />
        </a>
      </div>
    </div>
  );
}