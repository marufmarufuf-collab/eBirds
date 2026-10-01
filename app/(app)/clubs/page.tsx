import Link from "next/link";
import { listClubs } from "@/lib/actions/clubs";
import Avatar from "@/components/Avatar";

export default async function ClubsPage() {
  const clubs = await listClubs();

  return (
    <main className="px-5 py-10 max-w-2xl">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h1 className="display text-2xl">Clubs</h1>
        <Link href="/clubs/create" className="btn btn-primary">+ Create club</Link>
      </div>
      <p className="text-[var(--muted)] mb-6">Communities that stay connected between events.</p>

      {clubs.length === 0 && <p className="text-sm text-[var(--muted)]">No clubs yet — start one.</p>}

      <div className="space-y-2">
        {clubs.map((c, i) => (
          <Link key={c.id} href={`/clubs/${c.id}`} style={{ animationDelay: `${Math.min(i, 8) * 25}ms` }} className="card enter p-4 flex items-center gap-3 hover-lift">
            <Avatar url={c.avatar_url} name={c.name} size={44} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{c.name}</p>
              {c.description && <p className="text-xs text-[var(--muted)] truncate">{c.description}</p>}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
