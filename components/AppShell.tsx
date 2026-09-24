import Link from "next/link";
import Sidebar from "./Sidebar";
import ProfileMenu from "./ProfileMenu";
import type { Profile } from "@/types/database";

export default function AppShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar profile={profile} />
      <div className="flex-1 min-w-0">
        <div className="h-16 border-b bg-[var(--surface)] flex items-center justify-between px-5 gap-3 sticky top-0 z-20">
          <nav className="flex md:hidden items-center gap-1 text-sm">
            <Link href="/home" className="btn btn-ghost !px-2">Home</Link>
            <Link href="/messages" className="btn btn-ghost !px-2">Messages</Link>
            {profile.role === "super_admin" && <Link href="/admin" className="btn btn-ghost !px-2">Admin</Link>}
            <Link href="/settings" className="btn btn-ghost !px-2">Settings</Link>
          </nav>
          <div className="hidden md:block" />
          <ProfileMenu profile={profile} />
        </div>
        {children}
      </div>
    </div>
  );
}
