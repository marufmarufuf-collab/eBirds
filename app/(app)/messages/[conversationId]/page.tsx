import { createClient } from "@/lib/supabase/server";
import { getVerifiedUserId } from "@/lib/verified-user";
import { getRecentMessages, markMessagesRead, getConversationInfo } from "@/lib/actions/messaging";
import { notFound } from "next/navigation";
import { after } from "next/server";
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

  // info reuses this same row instead of re-fetching it; messages load as
  // one bounded page instead of the whole history — both run together.
  const [info, page] = await Promise.all([
    getConversationInfo(conversationId, convo),
    getRecentMessages(conversationId),
  ]);

  if (!info) notFound();

  // Marking read doesn't need to block the response — after() guarantees
  // it still runs to completion even though the page has already been
  // sent, which a bare un-awaited call can't promise on serverless.
  if (info.type === "direct") after(() => markMessagesRead(conversationId));

  return (
    <ChatView
      conversationId={conversationId}
      conversationStartedAt={convo.created_at}
      currentUserId={userId}
      info={info}
      initialMessages={page.messages}
      initialHasMore={page.hasMore}
    />
  );
}
