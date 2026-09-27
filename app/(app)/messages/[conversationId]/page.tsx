import { createClient } from "@/lib/supabase/server";
import { getVerifiedUserId } from "@/lib/verified-user";
import { getHiddenMessageIds, markMessagesRead } from "@/lib/actions/messaging";
import { notFound } from "next/navigation";
import ChatView from "./ChatView";

export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  if (!userId) notFound();

  const { data: convo } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .single();

  if (!convo || (convo.user_a !== userId && convo.user_b !== userId)) notFound();

  const otherId = convo.user_a === userId ? convo.user_b : convo.user_a;
  const [{ data: other }, { data: messages }, hiddenIds] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", otherId).single(),
    supabase.from("messages").select("*").eq("conversation_id", conversationId).order("created_at", { ascending: true }),
    getHiddenMessageIds(conversationId),
  ]);

  if (!other) notFound();

  // Opening the chat marks the other person's messages as read.
  markMessagesRead(conversationId);

  return (
    <ChatView
      conversationId={conversationId}
      conversationStartedAt={convo.created_at}
      currentUserId={userId}
      other={other}
      initialMessages={(messages ?? []).filter((m) => !hiddenIds.has(m.id))}
    />
  );
}
