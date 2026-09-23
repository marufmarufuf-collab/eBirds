import Spinner from "./Spinner";

export default function PageLoading() {
  return (
    <div className="flex items-center justify-center py-24 text-[var(--muted)] gap-2">
      <Spinner className="text-[var(--accent)]" />
      <span className="text-sm">Loading…</span>
    </div>
  );
}
