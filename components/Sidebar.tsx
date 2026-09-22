import Link from "next/link";
import Avatar from "./Avatar";
import type { Profile } from "@/types/database";

export default function Sidebar({ profile }: { profile: Profile }) {
  return (
    <aside className="hidden md:flex md:flex-col w-56 shrink-0 border-r bg-[var(--surface)] h-screen sticky top-0">
      <div className="p-4 border-b">
        <Link href="/" className="display text-lg font-semibold">Platform</Link>
      </div>

      <nav className="flex-1 p-3 space-y-1 text-sm">
        <Link href="/" className="btn btn-ghost w-full justify-start">Home</Link>
        <Link href="/messages" className="btn btn-ghost w-full justify-start">Messages</Link>
        {profile.role === "super_admin" && (
          <Link href="/admin" className="btn btn-ghost w-full justify-start">Admin Dashboard</Link>
        )}
      </nav>

      <Link href="/settings" className="flex items-center gap-2 p-4 border-t hover:bg-[var(--paper)]">
        <Avatar url={profile.avatar_url} name={profile.username} size={32} />
        <div className="overflow-hidden">
          <p className="text-sm font-medium truncate">{profile.full_name || profile.username}</p>
          <p className="text-xs text-[var(--muted)] truncate">Settings</p>
        </div>
      </Link>
    </aside>
  );
}
