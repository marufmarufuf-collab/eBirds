import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-user";
import { redirect, notFound } from "next/navigation";
import ChatView from "./ChatView";

export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  const { data: convo } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .single();

  if (!convo || (convo.user_a !== profile.id && convo.user_b !== profile.id)) notFound();

  const otherId = convo.user_a === profile.id ? convo.user_b : convo.user_a;
  const { data: other } = await supabase.from("profiles").select("*").eq("id", otherId).single();
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (!other) notFound();

  return (
    <AppShell profile={profile}>
      <main className="px-5 py-6 max-w-2xl">
        <ChatView
          conversationId={conversationId}
          conversationStartedAt={convo.created_at}
          currentUserId={profile.id}
          other={other}
          initialMessages={messages ?? []}
        />
      </main>
    </AppShell>
  );
}
