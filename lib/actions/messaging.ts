"use server";

import { createClient } from "@/lib/supabase/server";
import { getVerifiedUserId } from "@/lib/verified-user";
import { redirect } from "next/navigation";
import type { Profile, Message } from "@/types/database";

export type ConversationPreview = {
  conversationId: string;
  type: "direct" | "group";
  title: string;
  avatarUrl: string | null;
  otherUserId?: string;
  memberCount?: number;
  lastMessage: Message | null;
  updatedAt: string;
};

export async function getConversationList(): Promise<{
  conversations: ConversationPreview[];
  otherUsers: Profile[];
}> {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  if (!userId) return { conversations: [], otherUsers: [] };

  const [{ data: direct }, { data: memberRows }] = await Promise.all([
    supabase.from("conversations").select("id, user_a, user_b, created_at").eq("type", "direct").or(`user_a.eq.${userId},user_b.eq.${userId}`),
    supabase.from("conversation_members").select("conversation_id, conversations(id, title, avatar_url, created_at)").eq("user_id", userId),
  ]);

  const directList = direct ?? [];
  type GroupConvoRow = { id: string; title: string | null; avatar_url: string | null; created_at: string };
  const groupList = (memberRows ?? [])
    .map((r) => r.conversations as unknown as GroupConvoRow | null)
    .filter((c): c is GroupConvoRow => !!c);

  const allConvoIds = [...directList.map((c) => c.id), ...groupList.map((c) => c.id)];
  const otherIds = directList.map((c) => (c.user_a === userId ? c.user_b : c.user_a)).filter((id): id is string => !!id);
  const { data: blocks } = await supabase
    .from("user_blocks")
    .select("blocked_id, blocker_id")
    .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
  const blockedIds = (blocks ?? []).map((b) => (b.blocker_id === userId ? b.blocked_id : b.blocker_id));
  const excludeIds = [userId, ...otherIds, ...blockedIds];

  const [othersResult, lastMessagesResult, otherUsersResult, hiddenResult, memberCountsResult] = await Promise.all([
    otherIds.length ? supabase.from("profiles").select("*").in("id", otherIds) : Promise.resolve({ data: [] as Profile[] }),
    allConvoIds.length
      ? supabase.from("messages").select("*").in("conversation_id", allConvoIds).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as Message[] }),
    supabase.from("profiles").select("*").not("id", "in", `(${excludeIds.join(",")})`).order("created_at", { ascending: false }).limit(20),
    supabase.from("message_deletions").select("message_id").eq("user_id", userId),
    groupList.length
      ? supabase.from("conversation_members").select("conversation_id").in("conversation_id", groupList.map((c) => c.id))
      : Promise.resolve({ data: [] as { conversation_id: string }[] }),
  ]);

  const otherById = new Map((othersResult.data ?? []).map((p) => [p.id, p]));
  const hiddenIds = new Set((hiddenResult.data ?? []).map((d) => d.message_id as string));

  const memberCounts = new Map<string, number>();
  for (const row of memberCountsResult.data ?? []) {
    memberCounts.set(row.conversation_id, (memberCounts.get(row.conversation_id) ?? 0) + 1);
  }

  const lastByConvo = new Map<string, Message>();
  for (const m of lastMessagesResult.data ?? []) {
    if (hiddenIds.has(m.id)) continue;
    if (!lastByConvo.has(m.conversation_id)) lastByConvo.set(m.conversation_id, m);
  }

  const directPreviews: ConversationPreview[] = directList
    .map((c) => {
      const other = otherById.get(c.user_a === userId ? c.user_b! : c.user_a!);
      if (!other) return null;
      const lastMessage = lastByConvo.get(c.id) ?? null;
      return {
        conversationId: c.id,
        type: "direct" as const,
        title: other.full_name || other.username,
        avatarUrl: other.avatar_url,
        otherUserId: other.id,
        lastMessage,
        updatedAt: lastMessage?.created_at ?? c.created_at,
      };
    })
    .filter((x) => x !== null) as ConversationPreview[];

  const groupPreviews: ConversationPreview[] = groupList.map((c) => {
    const lastMessage = lastByConvo.get(c.id) ?? null;
    return {
      conversationId: c.id,
      type: "group" as const,
      title: c.title || "Group",
      avatarUrl: c.avatar_url,
      memberCount: memberCounts.get(c.id) ?? 0,
      lastMessage,
      updatedAt: lastMessage?.created_at ?? c.created_at,
    };
  });

  const conversations = [...directPreviews, ...groupPreviews].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return { conversations, otherUsers: (otherUsersResult.data ?? []) as Profile[] };
}

export type ConversationInfo =
  | { type: "direct"; other: Profile }
  | { type: "group"; title: string; avatarUrl: string | null; members: Profile[] };

export async function getConversationInfo(conversationId: string): Promise<ConversationInfo | null> {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  if (!userId) return null;

  const { data: convo } = await supabase.from("conversations").select("*").eq("id", conversationId).single();
  if (!convo) return null;

  if (convo.type === "direct") {
    const otherId = convo.user_a === userId ? convo.user_b : convo.user_a;
    if (!otherId) return null;
    const { data: other } = await supabase.from("profiles").select("*").eq("id", otherId).single();
    if (!other) return null;
    return { type: "direct", other: other as Profile };
  }

  const { data: memberRows } = await supabase
    .from("conversation_members")
    .select("profiles(*)")
    .eq("conversation_id", conversationId);
  const members = (memberRows ?? [])
    .map((r) => r.profiles as unknown as Profile | null)
    .filter((p): p is Profile => !!p);

  return { type: "group", title: convo.title || "Group", avatarUrl: convo.avatar_url, members };
}

export async function searchUsers(query: string): Promise<Profile[]> {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  if (!userId || !query.trim()) return [];

  const { data: blocks } = await supabase.from("user_blocks").select("blocked_id, blocker_id").or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
  const blockedIds = (blocks ?? []).map((b) => (b.blocker_id === userId ? b.blocked_id : b.blocker_id));
  const exclude = [userId, ...blockedIds];

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .not("id", "in", `(${exclude.join(",")})`)
    .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(20);

  if (error) return [];
  return data as Profile[];
}

export async function startConversation(otherUserId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_or_create_conversation", { other_user: otherUserId });
  if (error || !data) throw new Error(error?.message || "Could not start conversation.");
  redirect(`/messages/${data}`);
}

// Polled every 5s from the client instead of a realtime subscription —
// simpler to reason about and doesn't depend on Realtime being wired up.
export async function getMessages(conversationId: string): Promise<Message[]> {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  if (!userId) return [];

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return data as Message[];
}

export type SendMessageOptions = {
  imageUrl?: string | null;
  audioUrl?: string | null;
  audioDuration?: number | null;
};

export async function sendMessage(
  conversationId: string,
  content: string,
  options?: SendMessageOptions
): Promise<Message> {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  if (!userId) throw new Error("Not signed in.");
  if (!content.trim() && !options?.imageUrl && !options?.audioUrl) throw new Error("Nothing to send.");

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: userId,
      content: content.trim() || " ",
      image_url: options?.imageUrl ?? null,
      audio_url: options?.audioUrl ?? null,
      audio_duration: options?.audioDuration ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Message;
}

export async function uploadMessagePhoto(formData: FormData): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  if (!userId) return { error: "Not signed in." };

  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) return { error: "Choose an image first." };
  // Some camera-captured files report a generic type — fall back to the
  // file extension rather than silently rejecting a real photo.
  const looksLikeImage = file.type.startsWith("image/") || /\.(jpe?g|png|heic|heif|webp|gif)$/i.test(file.name);
  if (!looksLikeImage) return { error: "File must be an image." };
  if (file.size > 15 * 1024 * 1024) return { error: "Image must be under 15MB." };

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("message-attachments")
    .upload(path, file, { contentType: file.type || "image/jpeg" });
  if (uploadError) return { error: uploadError.message };

  const { data: pub } = supabase.storage.from("message-attachments").getPublicUrl(path);
  return { url: pub.publicUrl };
}

export async function uploadVoiceMessage(formData: FormData): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  if (!userId) return { error: "Not signed in." };

  const file = formData.get("audio") as File | null;
  if (!file || file.size === 0) return { error: "No recording found." };
  if (!file.type.startsWith("audio/")) return { error: "File must be audio." };
  if (file.size > 15 * 1024 * 1024) return { error: "Recording is too long." };

  const ext = file.type.includes("mp4") ? "m4a" : file.type.includes("ogg") ? "ogg" : "webm";
  const path = `${userId}/voice-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("message-attachments")
    .upload(path, file, { contentType: file.type });
  if (uploadError) return { error: uploadError.message };

  const { data: pub } = supabase.storage.from("message-attachments").getPublicUrl(path);
  return { url: pub.publicUrl };
}

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000; // matches the DB trigger's 24h rule

export async function editMessage(messageId: string, content: string): Promise<{ error?: string; message?: Message }> {
  const trimmed = content.trim();
  if (!trimmed) return { error: "Message can't be empty." };

  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  if (!userId) return { error: "Not signed in." };

  const { data: existing } = await supabase.from("messages").select("*").eq("id", messageId).single();
  if (!existing) return { error: "Message not found." };
  if (existing.sender_id !== userId) return { error: "You can only edit your own messages." };
  if (Date.now() - new Date(existing.created_at).getTime() > EDIT_WINDOW_MS) {
    return { error: "This message is too old to edit." };
  }

  const { data, error } = await supabase
    .from("messages")
    .update({ content: trimmed })
    .eq("id", messageId)
    .select()
    .single();

  if (error) return { error: error.message };
  return { message: data as Message };
}

export async function deleteMessageForMe(messageId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  if (!userId) return { error: "Not signed in." };

  const { error } = await supabase.from("message_deletions").insert({ message_id: messageId, user_id: userId });
  if (error) return { error: error.message };
  return {};
}

export async function deleteMessageForEveryone(messageId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  if (!userId) return { error: "Not signed in." };

  const { data: existing } = await supabase.from("messages").select("sender_id").eq("id", messageId).single();
  if (!existing) return { error: "Message not found." };
  if (existing.sender_id !== userId) return { error: "You can only delete your own messages for everyone." };

  const { error } = await supabase
    .from("messages")
    .update({ deleted_at: new Date().toISOString(), content: " ", image_url: null, audio_url: null, audio_duration: null })
    .eq("id", messageId);

  if (error) return { error: error.message };
  return {};
}

// Called when a conversation is opened, and again whenever a new incoming
// message arrives while it's open — marks the other person's messages as
// read so their client sees the second tick appear live.
export async function markMessagesRead(conversationId: string): Promise<void> {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  if (!userId) return;

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .is("read_at", null);
}

export async function getHiddenMessageIds(conversationId: string): Promise<Set<string>> {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  if (!userId) return new Set();

  const { data } = await supabase
    .from("message_deletions")
    .select("message_id, messages!inner(conversation_id)")
    .eq("user_id", userId)
    .eq("messages.conversation_id", conversationId);

  return new Set((data ?? []).map((d) => d.message_id as string));
}
