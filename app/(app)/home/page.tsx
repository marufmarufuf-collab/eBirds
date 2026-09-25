import Link from "next/link";
import RoleTag from "@/components/RoleTag";
import { MessagesIcon, AdminIcon, SettingsIcon } from "@/components/icons";
import { getCurrentProfile } from "@/lib/current-user";

export default async function HomePage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  return (
    <main className="px-5 py-10 max-w-4xl">
      <div className="flex items-center gap-2 mb-1">
        <h1 className="display text-2xl">Welcome, {profile.full_name || profile.username}</h1>
        <RoleTag role={profile.role} />
      </div>
      <p className="text-[var(--muted)] mb-8">This is your home base. More modules will show up here over time.</p>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/messages" className="card p-5 hover-lift enter flex items-start gap-3">
          <span className="w-10 h-10 rounded-[10px] bg-[var(--accent-soft)] text-[var(--accent-dark)] flex items-center justify-center shrink-0">
            <MessagesIcon />
          </span>
          <div>
            <h2 className="font-medium mb-1">Messages</h2>
            <p className="text-sm text-[var(--muted)]">Find people and start a conversation.</p>
          </div>
        </Link>
        <Link href="/profile" className="card p-5 hover-lift enter flex items-start gap-3">
          <span className="w-10 h-10 rounded-[10px] bg-[var(--accent-soft)] text-[var(--accent-dark)] flex items-center justify-center shrink-0">
            <SettingsIcon />
          </span>
          <div>
            <h2 className="font-medium mb-1">Your profile</h2>
            <p className="text-sm text-[var(--muted)]">Update your photo, username, and bio.</p>
          </div>
        </Link>
        {profile.role === "super_admin" && (
          <Link href="/admin" className="card p-5 hover-lift enter sm:col-span-2 flex items-start gap-3">
            <span className="w-10 h-10 rounded-[10px] bg-[var(--accent-soft)] text-[var(--accent-dark)] flex items-center justify-center shrink-0">
              <AdminIcon />
            </span>
            <div>
              <h2 className="font-medium mb-1">Admin dashboard</h2>
              <p className="text-sm text-[var(--muted)]">Manage every account on the platform.</p>
            </div>
          </Link>
        )}
      </div>
    </main>
  );
}
