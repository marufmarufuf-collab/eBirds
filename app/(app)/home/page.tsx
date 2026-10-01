import Link from "next/link";
import RoleTag from "@/components/RoleTag";
import { MessagesIcon, AdminIcon, SettingsIcon, CompassIcon, CalendarIcon, UsersIcon } from "@/components/icons";
import { getCurrentProfile } from "@/lib/current-user";

const CARD_ICON = "w-10 h-10 rounded-[10px] bg-[var(--accent-soft)] text-[var(--accent-dark)] flex items-center justify-center shrink-0";

export default async function HomePage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  return (
    <main className="px-5 py-10 max-w-4xl">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <h1 className="display text-2xl">Welcome, {profile.full_name || profile.username}</h1>
        <RoleTag role={profile.role} />
        <span className="tag !bg-[var(--accent-soft)] !text-[var(--accent-dark)] !border-transparent">⭐ {profile.points} points</span>
      </div>
      <p className="text-[var(--muted)] mb-8">Find people. Make plans. Go together.</p>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/discover" className="card p-5 hover-lift enter flex items-start gap-3">
          <span className={CARD_ICON}><CompassIcon /></span>
          <div>
            <h2 className="font-medium mb-1">Discover</h2>
            <p className="text-sm text-[var(--muted)]">Find walks, runs, trips and more happening nearby.</p>
          </div>
        </Link>
        <Link href="/events/mine" className="card p-5 hover-lift enter flex items-start gap-3">
          <span className={CARD_ICON}><CalendarIcon /></span>
          <div>
            <h2 className="font-medium mb-1">My events</h2>
            <p className="text-sm text-[var(--muted)]">Events you've organized or joined.</p>
          </div>
        </Link>
        <Link href="/clubs" className="card p-5 hover-lift enter flex items-start gap-3">
          <span className={CARD_ICON}><UsersIcon /></span>
          <div>
            <h2 className="font-medium mb-1">Clubs</h2>
            <p className="text-sm text-[var(--muted)]">Join a community that meets regularly.</p>
          </div>
        </Link>
        <Link href="/messages" className="card p-5 hover-lift enter flex items-start gap-3">
          <span className={CARD_ICON}><MessagesIcon /></span>
          <div>
            <h2 className="font-medium mb-1">Messages</h2>
            <p className="text-sm text-[var(--muted)]">Find people and start a conversation.</p>
          </div>
        </Link>
        <Link href="/profile" className="card p-5 hover-lift enter flex items-start gap-3">
          <span className={CARD_ICON}><SettingsIcon /></span>
          <div>
            <h2 className="font-medium mb-1">Your profile</h2>
            <p className="text-sm text-[var(--muted)]">Update your photo, username, and bio.</p>
          </div>
        </Link>
        {profile.role === "super_admin" && (
          <Link href="/admin" className="card p-5 hover-lift enter flex items-start gap-3">
            <span className={CARD_ICON}><AdminIcon /></span>
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
