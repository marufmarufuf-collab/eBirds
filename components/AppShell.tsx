import Link from "next/link";
import Sidebar from "./Sidebar";
import ProfileMenu from "./ProfileMenu";
import { HomeIcon, MessagesIcon, AdminIcon, SettingsIcon } from "./icons";
import type { Profile } from "@/types/database";

export default function AppShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar profile={profile} />
      <div className="flex-1 min-w-0">
        <div className="h-16 border-b bg-[var(--surface)] flex items-center justify-between px-3 sm:px-5 gap-2 sticky top-0 z-20 safe-top">
          {/* Icon-only on mobile — four full text labels here reliably
              overflowed narrow phone screens, pushing later buttons (and
              sometimes the profile menu) off the visible viewport. */}
          <nav className="flex md:hidden items-center gap-0.5 shrink-0">
            <Link href="/home" className="btn btn-ghost !px-2.5" aria-label="Home"><HomeIcon /></Link>
            <Link href="/messages" className="btn btn-ghost !px-2.5" aria-label="Messages"><MessagesIcon /></Link>
            {profile.role === "super_admin" && (
              <Link href="/admin" className="btn btn-ghost !px-2.5" aria-label="Admin"><AdminIcon /></Link>
            )}
            <Link href="/settings" className="btn btn-ghost !px-2.5" aria-label="Settings"><SettingsIcon /></Link>
          </nav>
          <div className="hidden md:block" />
          <div className="shrink-0">
            <ProfileMenu profile={profile} />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
