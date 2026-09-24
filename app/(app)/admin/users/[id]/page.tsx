import { getUser, getLoginHistory } from "@/lib/actions/admin";
import { relativeFromNow } from "@/lib/format-date";
import { notFound } from "next/navigation";
import UserAdminForm from "./UserAdminForm";

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, history] = await Promise.all([getUser(id), getLoginHistory(id)]);
  if (!user) notFound();

  return (
    <>
      <h1 className="display text-2xl mb-1">Manage {user.username}</h1>
      <p className="text-sm text-[var(--muted)] mb-6">Last seen: {relativeFromNow(user.last_seen_at)}</p>

      <UserAdminForm user={user} />

      <div className="card p-6 mt-6">
        <h2 className="text-sm font-medium text-[var(--muted)] mb-3">Recent logins</h2>
        {history.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No recorded logins yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {history.map((h) => (
              <li key={h.id} className="flex justify-between gap-3 text-[var(--muted)]">
                <span className="text-[var(--ink)]">{new Date(h.created_at).toLocaleString()}</span>
                <span className="truncate max-w-[55%]" title={h.user_agent ?? ""}>{h.user_agent ?? "Unknown device"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
