"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Avatar from "./Avatar";
import { signOut } from "@/lib/actions/auth";
import { useDropdown } from "./useClickOutside";
import type { Profile } from "@/types/database";

// Top-right dropdown: Profile / Log out. Controlled component (see
// useDropdown) so every click registers immediately and reliably.
export default function ProfileMenu({ profile }: { profile: Profile }) {
  const { open, setOpen, ref } = useDropdown<HTMLDivElement>();
  const router = useRouter();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 select-none"
        aria-expanded={open}
      >
        <Avatar url={profile.avatar_url} name={profile.username} size={32} />
        <span className="hidden sm:inline text-sm">{profile.username}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 card p-1 z-40">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push("/profile");
            }}
            className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-[var(--paper)]"
          >
            Profile
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
