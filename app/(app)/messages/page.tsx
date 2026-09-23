import { getVerifiedUserId } from "@/lib/verified-user";
import { createClient } from "@/lib/supabase/server";
import { getConversationList } from "@/lib/actions/messaging";
import ConversationList from "./ConversationList";

export default async function MessagesPage() {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  const { conversations, otherUsers } = await getConversationList();

  return (
    <main className="px-5 py-10 max-w-2xl">
      <h1 className="display text-2xl mb-4">Messages</h1>
      <ConversationList
        currentUserId={userId!}
        initialConversations={conversations}
        initialOtherUsers={otherUsers}
      />
    </main>
  );
}
