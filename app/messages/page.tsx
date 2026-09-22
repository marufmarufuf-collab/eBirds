import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-user";
import { redirect } from "next/navigation";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import UserSearch from "./UserSearch";
import type { Profile } from "@/types/database";

export default async function MessagesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const { data: convos } = await supabase
    .from("conversations")
    .select("id, user_a, user_b, created_at")
    .or(`user_a.eq.${profile.id},user_b.eq.${profile.id}`)
    .order("created_at", { ascending: false });

  const otherIds = (convos ?? []).map((c) => (c.user_a === profile.id ? c.user_b : c.user_a));
  const { data: others } = otherIds.length
    ? await supabase.from("profiles").select("*").in("id", otherIds)
    : { data: [] as Profile[] };

  const otherById = new Map((others ?? []).map((p) => [p.id, p]));

  return (
    <AppShell profile={profile}>
      <main className="px-5 py-10 max-w-2xl">
        <h1 className="display text-2xl mb-4">Messages</h1>
        <UserSearch />

        <div className="mt-6 space-y-2">
          {(convos ?? []).length === 0 && (
            <p className="text-sm text-[var(--muted)]">
              No conversations yet — search for someone above to say hello.
            </p>
          )}
          {(convos ?? []).map((c) => {
            const other = otherById.get(c.user_a === profile.id ? c.user_b : c.user_a);
            if (!other) return null;
            return (
              <Link key={c.id} href={`/messages/${c.id}`} className="card p-4 flex items-center gap-3 hover:border-[var(--accent)]">
                <Avatar url={other.avatar_url} name={other.username} size={40} />
                <div>
                  <p className="font-medium">{other.username}</p>
                  <p className="text-xs text-[var(--muted)]">{other.email}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </AppShell>
  );
}
