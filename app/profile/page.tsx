import Navbar from "@/components/Navbar";
import Avatar from "@/components/Avatar";
import RoleTag from "@/components/RoleTag";
import { getCurrentProfile } from "@/lib/current-user";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 py-10">
        <div className="card p-6 flex items-center gap-4">
          <Avatar url={profile.avatar_url} name={profile.username} size={64} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-medium">{profile.username}</h1>
              <RoleTag role={profile.role} />
            </div>
            <p className="text-sm text-[var(--muted)]">{profile.email}</p>
          </div>
          <Link href="/profile/edit" className="btn btn-ghost">Edit</Link>
        </div>

        {profile.bio && (
          <div className="card p-6 mt-4">
            <h2 className="text-sm font-medium text-[var(--muted)] mb-2">About</h2>
            <p>{profile.bio}</p>
          </div>
        )}

        <p className="text-xs text-[var(--muted)] mt-6">
          Member since {new Date(profile.created_at).toLocaleDateString()}
        </p>
      </main>
    </>
  );
}
