import Link from "next/link";
import Sidebar from "./Sidebar";
import ProfileMenu from "./ProfileMenu";
import { HomeIcon, MessagesIcon, AdminIcon, SettingsIcon, CompassIcon, CalendarIcon, UsersIcon } from "./icons";
import type { Profile } from "@/types/database";

export default function AppShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar profile={profile} />
      <div className="flex-1 min-w-0">
        <div className="h-16 border-b bg-[var(--surface)] flex items-center justify-between px-3 sm:px-5 gap-2 sticky top-0 z-20 safe-top">
          {/* Icon-only + horizontally scrollable on mobile — enough items
              here now that even icon-only could overflow on the narrowest
              phones, so this row scrolls instead of clipping/pushing the
              profile menu off-screen. */}
          <nav className="flex md:hidden items-center gap-0.5 shrink overflow-x-auto">
            <Link href="/home" className="btn btn-ghost !px-2.5 shrink-0" aria-label="Home"><HomeIcon /></Link>
            <Link href="/discover" className="btn btn-ghost !px-2.5 shrink-0" aria-label="Discover"><CompassIcon /></Link>
            <Link href="/events/mine" className="btn btn-ghost !px-2.5 shrink-0" aria-label="My Events"><CalendarIcon /></Link>
            <Link href="/clubs" className="btn btn-ghost !px-2.5 shrink-0" aria-label="Clubs"><UsersIcon /></Link>
            <Link href="/messages" className="btn btn-ghost !px-2.5 shrink-0" aria-label="Messages"><MessagesIcon /></Link>
            {profile.role === "super_admin" && (
              <Link href="/admin" className="btn btn-ghost !px-2.5 shrink-0" aria-label="Admin"><AdminIcon /></Link>
            )}
            <Link href="/settings" className="btn btn-ghost !px-2.5 shrink-0" aria-label="Settings"><SettingsIcon /></Link>
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
