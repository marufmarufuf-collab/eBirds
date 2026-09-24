import Link from "next/link";
import Avatar from "@/components/Avatar";
import RoleTag from "@/components/RoleTag";
import { listUsers } from "@/lib/actions/admin";
import { relativeFromNow } from "@/lib/format-date";
import AdminSearch from "./AdminSearch";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const users = await listUsers(q);

  return (
    <>
      <h1 className="display text-2xl mb-1">Admin dashboard</h1>
      <p className="text-[var(--muted)] mb-6">{users.length} account{users.length === 1 ? "" : "s"}</p>

      <AdminSearch defaultValue={q ?? ""} />

      <div className="mt-6 space-y-2">
        {users.map((u) => (
          <Link
            key={u.id}
            href={`/admin/users/${u.id}`}
            className="card enter p-4 flex items-center gap-3 hover-lift"
          >
            <Avatar url={u.avatar_url} name={u.username} size={40} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{u.username}</p>
                <RoleTag role={u.role} />
                {!u.is_active && <span className="tag">Deactivated</span>}
              </div>
              <p className="text-xs text-[var(--muted)]">{u.email}</p>
            </div>
            <p className="text-xs text-[var(--muted)] shrink-0">{relativeFromNow(u.last_seen_at)}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
