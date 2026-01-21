import { IconSearch } from '@tabler/icons-react';

type Props = {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
};

export default function SearchBar({ value, onChange, disabled }: Props) {
  return (
    <div className="max-w-lg">
      <label className="sr-only">Search patients</label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 grid place-items-center pl-3 pointer-events-none">
          <IconSearch className="w-5 h-5 text-slate-400" />
        </span>
        <input
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search by UHID, File #, or Name..."
          className="w-full py-2.5 pl-10 pr-3 text-slate-900 bg-white border border-slate-300 rounded-xl outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition disabled:opacity-60"
        />
      </div>
    </div>
  );
}
