import Link from "next/link";
import Avatar from "./Avatar";
import { signOut } from "@/lib/actions/auth";
import type { Profile } from "@/types/database";

// Native <details>/<summary> = a working dropdown with zero extra JS.
export default function ProfileMenu({ profile }: { profile: Profile }) {
  return (
    <details className="relative">
      <summary className="list-none cursor-pointer flex items-center gap-2 select-none">
        <Avatar url={profile.avatar_url} name={profile.username} size={32} />
        <span className="hidden sm:inline text-sm">{profile.username}</span>
      </summary>
      <div className="absolute right-0 mt-2 w-44 card p-1 z-40">
        <Link href="/profile" className="block px-3 py-2 text-sm rounded-md hover:bg-[var(--paper)]">Profile</Link>
        <form action={signOut}>
          <button className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-[var(--paper)] text-[var(--danger)]">
            Log out
          </button>
        </form>
      </div>
    </details>
  );
}
