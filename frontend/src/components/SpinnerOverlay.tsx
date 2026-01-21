export default function SpinnerOverlay() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-white/70 backdrop-blur">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-transparent"
        role="status"
        aria-live="polite"
      >
        <span className="sr-only">Loading</span>
      </div>
    </div>
  );
}
