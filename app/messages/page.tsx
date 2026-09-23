import AppShell from "@/components/AppShell";
import { getCurrentProfile } from "@/lib/current-user";
import { redirect } from "next/navigation";
import { getConversationList } from "@/lib/actions/messaging";
import ConversationList from "./ConversationList";

export default async function MessagesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { conversations, otherUsers } = await getConversationList();

  return (
    <AppShell profile={profile}>
      <main className="px-5 py-10 max-w-2xl">
        <h1 className="display text-2xl mb-4">Messages</h1>
        <ConversationList
          currentUserId={profile.id}
          initialConversations={conversations}
          initialOtherUsers={otherUsers}
        />
      </main>
    </AppShell>
  );
}
