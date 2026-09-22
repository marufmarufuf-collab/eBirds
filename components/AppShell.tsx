import Sidebar from "./Sidebar";
import ProfileMenu from "./ProfileMenu";
import type { Profile } from "@/types/database";

export default function AppShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar profile={profile} />
      <div className="flex-1 min-w-0">
        <div className="h-16 border-b bg-[var(--surface)] flex items-center justify-end px-5 gap-3 sticky top-0 z-20">
          <ProfileMenu profile={profile} />
        </div>
        {children}
      </div>
    </div>
  );
}
