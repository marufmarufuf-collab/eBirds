"use client";

import { useRouter } from "next/navigation";
import Avatar from "./Avatar";
import { signOut } from "@/lib/actions/auth";
import { useDropdown } from "./useClickOutside";
import type { Profile } from "@/types/database";

// Bottom-left of the sidebar: click the avatar/name (no "Settings" label
// shown) to open a small panel with Profile / Settings / Log out.
export default function BottomProfilePanel({ profile, collapsed }: { profile: Profile; collapsed: boolean }) {
  const { open, setOpen, ref } = useDropdown<HTMLDivElement>();
  const router = useRouter();

  function go(path: string) {
    setOpen(false);
    router.push(path);
  }

  return (
    <div className="relative border-t" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 p-4 w-full hover:bg-[var(--paper)] ${collapsed ? "justify-center" : ""}`}
        aria-expanded={open}
      >
        <Avatar url={profile.avatar_url} name={profile.username} size={32} />
        {!collapsed && (
          <div className="overflow-hidden text-left">
            <p className="text-sm font-medium truncate">{profile.full_name || profile.username}</p>
          </div>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-3 mb-2 w-44 card p-1 z-40">
          <button onClick={() => go("/profile")} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-[var(--paper)]">
            Profile
          </button>
          <button onClick={() => go("/settings")} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-[var(--paper)]">
            Settings
          </button>
          <form action={signOut}>
            <button className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-[var(--paper)] text-[var(--danger)]">
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
