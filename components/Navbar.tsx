import Link from "next/link";
import { getCurrentProfile } from "@/lib/current-user";
import { signOut } from "@/lib/actions/auth";
import Avatar from "./Avatar";

export default async function Navbar() {
  const profile = await getCurrentProfile();

  return (
    <header className="border-b bg-[var(--surface)]/90 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto max-w-5xl px-5 h-16 flex items-center justify-between">
        <Link href="/" className="display text-lg font-semibold">Platform</Link>

        {profile ? (
          <nav className="flex items-center gap-1 sm:gap-3 text-sm">
            <Link href="/messages" className="btn btn-ghost hidden sm:inline-flex">Messages</Link>
            {profile.role === "super_admin" && (
              <Link href="/admin" className="btn btn-ghost hidden sm:inline-flex">Admin</Link>
            )}
            <Link href="/profile" className="flex items-center gap-2 pl-2">
              <Avatar url={profile.avatar_url} name={profile.username} size={32} />
              <span className="hidden md:inline">{profile.username}</span>
            </Link>
            <form action={signOut}>
              <button className="btn btn-ghost">Log out</button>
            </form>
          </nav>
        ) : (
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/login" className="btn btn-ghost">Log in</Link>
            <Link href="/signup" className="btn btn-primary">Sign up</Link>
          </nav>
        )}
      </div>
      {profile && (
        <div className="sm:hidden flex gap-2 px-5 pb-3 text-sm">
          <Link href="/messages" className="btn btn-ghost flex-1">Messages</Link>
          {profile.role === "super_admin" && <Link href="/admin" className="btn btn-ghost flex-1">Admin</Link>}
        </div>
      )}
    </header>
  );
}
