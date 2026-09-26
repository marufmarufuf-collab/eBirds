"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage, uploadMessagePhoto } from "@/lib/actions/messaging";
import { dayLabel, timeLabel } from "@/lib/format-date";
import Avatar from "@/components/Avatar";
import ImageLightbox from "@/components/ImageLightbox";
import Spinner from "@/components/Spinner";
import { CameraIcon } from "@/components/icons";
import LinkifiedText from "@/components/LinkifiedText";
import Link from "next/link";
import type { Message, Profile } from "@/types/database";

export default function ChatView({
  conversationId,
  conversationStartedAt,
  currentUserId,
  other,
  initialMessages,
}: {
  conversationId: string;
  conversationStartedAt: string;
  currentUserId: string;
  other: Profile;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [pendingPhoto, setPendingPhoto] = useState<{ file: File; previewUrl: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live updates — a realtime subscription, not a page refresh or a poll.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function attachFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setPendingPhoto({ file, previewUrl: URL.createObjectURL(file) });
  }

  function handlePhotoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) attachFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // Paste an image from the clipboard straight into the composer.
  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    if (!item) return;
    const file = item.getAsFile();
    if (!file) return;
    e.preventDefault();
    attachFile(file);
  }

  async function handleSend() {
    const content = draft.trim();
    if (!content && !pendingPhoto) return;
    if (sending) return;
    setSending(true);
    try {
      let imageUrl: string | undefined;
      if (pendingPhoto) {
        setUploading(true);
        const fd = new FormData();
        fd.set("photo", pendingPhoto.file);
        const result = await uploadMessagePhoto(fd);
        setUploading(false);
        if (result.error) {
          alert(result.error);
          setSending(false);
          return;
        }
        imageUrl = result.url;
      }
      // Optimistic append so the sender sees it instantly, not after a round trip.
      const optimisticId = `local-${Date.now()}`;
      const optimistic: Message = {
        id: optimisticId,
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: content || " ",
        image_url: imageUrl ?? null,
        created_at: new Date().toISOString(),
        read_at: null,
      };
      setMessages((prev) => [...prev, optimistic]);
      setDraft("");
      setPendingPhoto(null);

      const real = await sendMessage(conversationId, content, imageUrl ?? null);

      // Swap the placeholder out for the confirmed row. If the realtime
      // subscription already delivered this same row in the meantime
      // (a race with the line above), don't add it a second time — that
      // was the cause of messages briefly appearing twice.
      setMessages((prev) => {
        const withoutOptimistic = prev.filter((m) => m.id !== optimisticId);
        if (withoutOptimistic.some((m) => m.id === real.id)) return withoutOptimistic;
        return [...withoutOptimistic, real];
      });
    } finally {
      setSending(false);
    }
  }

  const grouped = useMemo(() => {
    const groups: { label: string; items: Message[] }[] = [];
    for (const m of messages) {
      const label = dayLabel(m.created_at);
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.items.push(m);
      else groups.push({ label, items: [m] });
    }
    return groups;
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 h-16 px-4 border-b bg-[var(--surface)]">
        <Link href="/messages" className="btn btn-ghost !p-2 md:hidden" aria-label="Back">←</Link>
        <Link href={`/users/${other.id}`} className="flex items-center gap-3 hover:opacity-80 min-w-0 flex-1">
          <Avatar url={other.avatar_url} name={other.username} size={36} />
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{other.full_name || other.username}</p>
            <p className="text-xs text-[var(--muted)] truncate">@{other.username}</p>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-[var(--paper)]">
        <p className="text-center text-xs text-[var(--muted)] mb-3">
          Conversation started {dayLabel(conversationStartedAt)}
        </p>

        {grouped.map((group) => (
          <div key={group.label}>
            <div className="flex justify-center my-3">
              <span className="text-xs text-[var(--muted)] bg-[var(--surface)] border px-2.5 py-0.5 rounded-full shadow-sm">
                {group.label}
              </span>
            </div>
            {group.items.map((m) => {
              const mine = m.sender_id === currentUserId;
              return (
                <div key={m.id} className={`flex mb-1.5 ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] px-3 py-2 text-sm shadow-sm ${
                      mine
                        ? "bg-[var(--accent)] text-white rounded-2xl rounded-br-md"
                        : "bg-[var(--surface)] border rounded-2xl rounded-bl-md"
                    }`}
                  >
                    {m.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.image_url}
                        alt="attachment"
                        className="rounded-lg max-w-full mb-1 cursor-pointer"
                        onClick={() => setLightbox(m.image_url)}
                      />
                    )}
                    {m.content.trim() && <LinkifiedText text={m.content} />}
                    <div className={`flex items-center gap-1 text-[10px] mt-1 ${mine ? "text-white/75 justify-end" : "text-[var(--muted)]"}`}>
                      {timeLabel(m.created_at)}
                      {mine && !m.id.startsWith("local-") && (
                        <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 8.5 4.5 12 9 5" />
                          <path d="M6.5 8.5 10 12l4.5-8" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {pendingPhoto && (
        <div className="px-3 pt-3 flex items-center gap-2">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pendingPhoto.previewUrl} alt="preview" className="h-16 w-16 object-cover rounded-lg border" />
            <button
              onClick={() => setPendingPhoto(null)}
              className="absolute -top-2 -right-2 bg-[var(--ink)] text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
              aria-label="Remove photo"
            >
              ×
            </button>
          </div>
          <span className="text-xs text-[var(--muted)]">Add a caption and send, or send as-is.</span>
        </div>
      )}

      <div className="p-3 border-t bg-[var(--surface)] flex gap-2 items-center safe-bottom">
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" id="photo-input" onChange={handlePhotoPick} />
        <label htmlFor="photo-input" className="btn btn-ghost !px-3 !rounded-full shrink-0" aria-label="Send photo" aria-disabled={uploading}>
          {uploading ? <Spinner /> : <CameraIcon />}
        </label>
        <input
          className="input flex-1 min-w-0"
          placeholder="Message…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button onClick={handleSend} disabled={sending || (!draft.trim() && !pendingPhoto)} className="btn btn-primary !rounded-full shrink-0 !px-4">
          {sending && <Spinner />} Send
        </button>
      </div>

      {lightbox && <ImageLightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}
