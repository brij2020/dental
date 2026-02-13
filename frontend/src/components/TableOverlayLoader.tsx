import { IconLoader2 } from '@tabler/icons-react';

type TableOverlayLoaderProps = {
  label?: string;
};

export default function TableOverlayLoader({ label = 'Loading...' }: TableOverlayLoaderProps) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
      <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
        <IconLoader2 className="h-4 w-4 animate-spin" />
        {label}
      </div>
    </div>
  );
}
