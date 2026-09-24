import { getVerifiedUserId } from "@/lib/verified-user";
import { createClient } from "@/lib/supabase/server";
import { getConversationList } from "@/lib/actions/messaging";
import ConversationList from "./ConversationList";
import MessagesShell from "./MessagesShell";

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  const { conversations, otherUsers } = await getConversationList();

  return (
    <MessagesShell
      list={
        <div className="p-5">
          <h1 className="display text-xl mb-4">Messages</h1>
          <ConversationList
            currentUserId={userId!}
            initialConversations={conversations}
            initialOtherUsers={otherUsers}
          />
        </div>
      }
    >
      {children}
    </MessagesShell>
  );
}
