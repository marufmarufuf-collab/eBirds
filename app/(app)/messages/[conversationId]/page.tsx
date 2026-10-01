import { createClient } from "@/lib/supabase/server";
import { getVerifiedUserId } from "@/lib/verified-user";
import { getHiddenMessageIds, markMessagesRead, getConversationInfo } from "@/lib/actions/messaging";
import { notFound } from "next/navigation";
import ChatView from "./ChatView";

export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  if (!userId) notFound();

  // RLS already restricts this to conversations the user actually belongs
  // to (direct participant or group member) — a null result here means
  // either it doesn't exist or they're not in it.
  const { data: convo } = await supabase.from("conversations").select("*").eq("id", conversationId).single();
  if (!convo) notFound();

  const [info, { data: messages }, hiddenIds] = await Promise.all([
    getConversationInfo(conversationId),
    supabase.from("messages").select("*").eq("conversation_id", conversationId).order("created_at", { ascending: true }),
    getHiddenMessageIds(conversationId),
  ]);

  if (!info) notFound();

  // Opening the chat marks the other person's messages as read (direct
  // chats only — a single read_at can't represent "read by everyone" in a
  // group, so group messages just show sent/pending, no double-tick).
  if (info.type === "direct") markMessagesRead(conversationId);

  return (
    <ChatView
      conversationId={conversationId}
      conversationStartedAt={convo.created_at}
      currentUserId={userId}
      info={info}
      initialMessages={(messages ?? []).filter((m) => !hiddenIds.has(m.id))}
    />
  );
}
