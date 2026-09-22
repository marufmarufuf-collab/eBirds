import AppShell from "@/components/AppShell";
import Avatar from "@/components/Avatar";
import RoleTag from "@/components/RoleTag";
import { getCurrentProfile } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import StartConversationButton from "./StartConversationButton";

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getCurrentProfile();
  if (!me) redirect("/login");

  if (id === me.id) redirect("/profile");

  const supabase = await createClient();
  const { data: user } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (!user) notFound();

  return (
    <AppShell profile={me}>
      <main className="px-5 py-10 max-w-2xl">
        <div className="card p-6 flex items-center gap-4">
          <Avatar url={user.avatar_url} name={user.username} size={64} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-medium">{user.full_name || user.username}</h1>
              <RoleTag role={user.role} />
            </div>
            <p className="text-sm text-[var(--muted)]">@{user.username}</p>
            <p className="text-sm text-[var(--muted)]">{user.email}</p>
          </div>
          <StartConversationButton userId={user.id} />
        </div>

        {user.bio && (
          <div className="card p-6 mt-4">
            <h2 className="text-sm font-medium text-[var(--muted)] mb-2">About</h2>
            <p>{user.bio}</p>
          </div>
        )}
      </main>
    </AppShell>
  );
}
