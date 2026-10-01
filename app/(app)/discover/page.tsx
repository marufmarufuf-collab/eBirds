import Link from "next/link";
import { listEvents } from "@/lib/actions/events";
import { ACTIVITY_META, formatEventDate, formatPrice } from "@/lib/activity-meta";
import { ACTIVITIES } from "@/types/database";
import type { Activity } from "@/types/database";

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<{ activity?: string }> }) {
  const { activity } = await searchParams;
  const filter = (ACTIVITIES as readonly string[]).includes(activity ?? "") ? (activity as Activity) : "all";
  const events = await listEvents(filter);

  return (
    <main className="px-5 py-10 max-w-4xl">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h1 className="display text-2xl">Discover</h1>
        <Link href="/events/create" className="btn btn-primary">+ Create event</Link>
      </div>
      <p className="text-[var(--muted)] mb-6">Find people doing the same thing at the same time — join in.</p>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        <Link
          href="/discover"
          className={`tag !text-sm !px-3 !py-1.5 shrink-0 ${filter === "all" ? "!bg-[var(--ink)] !text-white !border-transparent" : ""}`}
        >
          All
        </Link>
        {ACTIVITIES.map((a) => (
          <Link
            key={a}
            href={`/discover?activity=${a}`}
            className={`tag !text-sm !px-3 !py-1.5 shrink-0 ${filter === a ? "!bg-[var(--ink)] !text-white !border-transparent" : ""}`}
          >
            {ACTIVITY_META[a].emoji} {ACTIVITY_META[a].label}
          </Link>
        ))}
      </div>

      {events.length === 0 && (
        <p className="text-sm text-[var(--muted)]">No events yet — be the first to create one.</p>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {events.map((e, i) => (
          <Link
            key={e.id}
            href={`/discover/${e.id}`}
            style={{ animationDelay: `${Math.min(i, 8) * 25}ms` }}
            className="card enter p-5 hover-lift"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="tag">{ACTIVITY_META[e.activity].emoji} {ACTIVITY_META[e.activity].label}</span>
              <span className={`tag ${e.is_paid ? "" : "!bg-[var(--accent-soft)] !text-[var(--accent-dark)] !border-transparent"}`}>
                {formatPrice(e.is_paid ? e.price : null, e.currency)}
              </span>
            </div>
            <h2 className="font-medium mb-1">{e.title}</h2>
            <p className="text-sm text-[var(--muted)] mb-1">{formatEventDate(e.event_date)}</p>
            <p className="text-sm text-[var(--muted)]">📍 {e.location_area}</p>
            {e.status === "full" && <span className="tag mt-2 inline-block">Full</span>}
          </Link>
        ))}
      </div>
    </main>
  );
}
