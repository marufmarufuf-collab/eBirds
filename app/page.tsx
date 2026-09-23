import Link from "next/link";
import AppShell from "@/components/AppShell";
import RoleTag from "@/components/RoleTag";
import { getCurrentProfile } from "@/lib/current-user";

export default async function HomePage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <main className="min-h-screen flex items-center justify-center px-5 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(700px circle at 15% 10%, #ffd9b3 0%, transparent 60%), radial-gradient(600px circle at 85% 85%, #ffb37a 0%, transparent 55%)",
          }}
        />
        <div className="max-w-md text-center enter">
          <h1 className="display text-4xl mb-3 gradient-text font-semibold">eBirds</h1>
          <p className="text-lg mb-1">A place for your people</p>
          <p className="text-[var(--muted)] mb-6">
            Accounts, profiles, and messaging — built as one platform, not a chat app with extras bolted on.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/signup" className="btn btn-primary">Get started</Link>
            <Link href="/login" className="btn btn-ghost">Log in</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <AppShell profile={profile}>
      <main className="px-5 py-10 max-w-4xl">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="display text-2xl">Welcome, {profile.full_name || profile.username}</h1>
          <RoleTag role={profile.role} />
        </div>
        <p className="text-[var(--muted)] mb-8">This is your home base. More modules will show up here over time.</p>

        <div className="grid sm:grid-cols-2 gap-4">
          <Link href="/messages" className="card p-5 hover:border-[var(--accent)] transition-colors hover-lift enter">
            <h2 className="font-medium mb-1">Messages</h2>
            <p className="text-sm text-[var(--muted)]">Find people and start a conversation.</p>
          </Link>
          <Link href="/profile" className="card p-5 hover:border-[var(--accent)] transition-colors hover-lift enter">
            <h2 className="font-medium mb-1">Your profile</h2>
            <p className="text-sm text-[var(--muted)]">Update your photo, username, and bio.</p>
          </Link>
          {profile.role === "super_admin" && (
            <Link href="/admin" className="card p-5 hover:border-[var(--accent)] transition-colors hover-lift enter sm:col-span-2">
              <h2 className="font-medium mb-1">Admin dashboard</h2>
              <p className="text-sm text-[var(--muted)]">Manage every account on the platform.</p>
            </Link>
          )}
        </div>
      </main>
    </AppShell>
  );
}
