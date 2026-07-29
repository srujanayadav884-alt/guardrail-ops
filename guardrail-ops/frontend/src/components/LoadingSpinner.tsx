export default function LoadingSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-6 text-sm text-guard-slate">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-guard-blue border-t-transparent" />
      {label}
    </div>
  );
}
