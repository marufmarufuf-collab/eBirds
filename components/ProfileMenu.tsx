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
        <div
          className="absolute right-0 mt-2 w-48 p-1.5 z-40 enter"
          style={{
            background: "#ffffff",
            border: "1px solid #f0e2d3",
            borderRadius: 14,
            boxShadow: "0 16px 40px -12px rgba(33, 23, 16, 0.28)",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push("/profile");
            }}
            className="w-full text-left px-3 py-2 text-sm rounded-[8px] hover:bg-[var(--surface-2)]"
          >
            Profile
          </button>
          <form action={signOut}>
            <button className="w-full text-left px-3 py-2 text-sm rounded-[8px] hover:bg-[var(--surface-2)] text-[var(--danger)]">
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
