"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { getMessages, sendMessage, uploadMessagePhoto } from "@/lib/actions/messaging";
import Avatar from "@/components/Avatar";
import Link from "next/link";
import type { Message, Profile } from "@/types/database";

const POLL_MS = 5000;

export default function ChatView({
  conversationId,
  currentUserId,
  other,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  other: Profile;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Poll for new messages every 5 seconds instead of a page refresh.
  useEffect(() => {
    const interval = setInterval(() => {
      startTransition(async () => {
        const fresh = await getMessages(conversationId);
        setMessages(fresh);
      });
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend() {
    const content = draft.trim();
    if (!content || sending) return;
    setDraft("");
    setSending(true);
    try {
      await sendMessage(conversationId, content);
      setMessages(await getMessages(conversationId));
    } finally {
      setSending(false);
    }
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("photo", file);
      const result = await uploadMessagePhoto(fd);
      if (result.error) {
        alert(result.error);
      } else if (result.url) {
        await sendMessage(conversationId, "", result.url);
        setMessages(await getMessages(conversationId));
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="card flex flex-col" style={{ height: "calc(100vh - 140px)" }}>
      <div className="flex items-center gap-3 p-4 border-b">
        <Link href="/messages" className="btn btn-ghost !p-2" aria-label="Back">←</Link>
        <Link href={`/users/${other.id}`} className="flex items-center gap-3 hover:opacity-80">
          <Avatar url={other.avatar_url} name={other.username} size={36} />
          <div>
            <p className="font-medium text-sm">{other.full_name || other.username}</p>
            <p className="text-xs text-[var(--muted)]">@{other.username}</p>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  mine ? "bg-[var(--accent)] text-white" : "bg-[var(--paper)] border"
                }`}
              >
                {m.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.image_url} alt="attachment" className="rounded-lg max-w-full mb-1" />
                )}
                {m.content.trim() && <span>{m.content}</span>}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t flex gap-2 items-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          id="photo-input"
          onChange={handlePhoto}
        />
        <label htmlFor="photo-input" className="btn btn-ghost !px-3 cursor-pointer" aria-label="Send photo">
          {uploading ? "…" : "📷"}
        </label>
        <input
          className="input"
          placeholder="Write a message…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button onClick={handleSend} disabled={sending || !draft.trim()} className="btn btn-primary">
          Send
        </button>
      </div>
    </div>
  );
}
