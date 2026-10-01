import Link from "next/link";
import { listMyEvents } from "@/lib/actions/events";
import { ACTIVITY_META, formatEventDate } from "@/lib/activity-meta";

const STATUS_LABEL: Record<string, string> = {
  pending: "Requested",
  confirmed: "Confirmed",
  declined: "Declined",
  cancelled: "Cancelled",
};

export default async function MyEventsPage() {
  const { organized, joined } = await listMyEvents();

  return (
    <main className="px-5 py-10 max-w-2xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="display text-2xl">My events</h1>
        <Link href="/events/create" className="btn btn-primary">+ Create event</Link>
      </div>

      <h2 className="text-sm font-medium text-[var(--muted)] mb-2">Organized by me</h2>
      <div className="space-y-2 mb-8">
        {organized.length === 0 && <p className="text-sm text-[var(--muted)]">You haven't organized any events yet.</p>}
        {organized.map((e) => (
          <Link key={e.id} href={`/discover/${e.id}`} className="card p-4 flex items-center gap-3 hover-lift">
            <span className="text-xl">{ACTIVITY_META[e.activity].emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{e.title}</p>
              <p className="text-xs text-[var(--muted)]">{formatEventDate(e.event_date)}</p>
            </div>
            <span className="tag">{e.status}</span>
          </Link>
        ))}
      </div>

      <h2 className="text-sm font-medium text-[var(--muted)] mb-2">Joined</h2>
      <div className="space-y-2">
        {joined.length === 0 && <p className="text-sm text-[var(--muted)]">You haven't joined any events yet — head to Discover.</p>}
        {joined.map((e) => (
          <Link key={e.id} href={`/discover/${e.id}`} className="card p-4 flex items-center gap-3 hover-lift">
            <span className="text-xl">{ACTIVITY_META[e.activity].emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{e.title}</p>
              <p className="text-xs text-[var(--muted)]">{formatEventDate(e.event_date)}</p>
            </div>
            <span className="tag">{STATUS_LABEL[e.myStatus] ?? e.myStatus}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
