"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  sendMessage,
  uploadMessagePhoto,
  uploadVoiceMessage,
  editMessage,
  deleteMessageForMe,
  deleteMessageForEveryone,
  markMessagesRead,
} from "@/lib/actions/messaging";
import { dayLabel, timeLabel } from "@/lib/format-date";
import Avatar from "@/components/Avatar";
import ImageLightbox from "@/components/ImageLightbox";
import Spinner from "@/components/Spinner";
import { CameraIcon, MicIcon, TrashIcon, SendIcon, ClockIcon, XIcon } from "@/components/icons";
import LinkifiedText from "@/components/LinkifiedText";
import VoiceMessageBubble from "@/components/VoiceMessageBubble";
import MessageActions from "@/components/MessageActions";
import { VoicePlayerProvider } from "@/lib/voice-player-context";
import MiniVoicePlayerBar from "@/components/MiniVoicePlayerBar";
import Link from "next/link";
import type { Message, Profile } from "@/types/database";

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

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
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [voiceSending, setVoiceSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);
  const recordSecondsRef = useRef(0);

  const MAX_RECORD_SECONDS = 600; // 10 minutes — sane cap, not a trim/edit limit

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
          // A new message from the other person, seen while the chat is
          // open, counts as read immediately.
          if (incoming.sender_id !== currentUserId) markMessagesRead(conversationId);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Stop the mic if someone navigates away mid-recording.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function attachFile(file: File) {
    const looksLikeImage = file.type.startsWith("image/") || /\.(jpe?g|png|heic|heif|webp|gif)$/i.test(file.name);
    if (!looksLikeImage) {
      alert("That file doesn't look like an image.");
      return;
    }
    setPendingPhoto({ file, previewUrl: URL.createObjectURL(file) });
  }

  function handlePhotoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) attachFile(file);
    else alert("No photo was selected — please try again.");
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

  function pickMimeType(): string {
    const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
    return candidates.find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(t)) ?? "";
  }

  async function startRecording() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      alert("Voice messages aren't supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      cancelledRef.current = false;

      const mimeType = pickMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);

        if (cancelledRef.current || chunksRef.current.length === 0) {
          chunksRef.current = [];
          return;
        }

        const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
        const durationSeconds = recordSecondsRef.current;
        chunksRef.current = [];
        await handleSendVoice(blob, durationSeconds);
      };

      recorder.start();
      setRecording(true);
      setRecordSeconds(0);
      recordSecondsRef.current = 0;
      timerRef.current = setInterval(() => {
        setRecordSeconds((s) => {
          const next = s + 1;
          recordSecondsRef.current = next;
          if (next >= MAX_RECORD_SECONDS) finishRecording();
          return next;
        });
      }, 1000);
    } catch {
      alert("Couldn't access your microphone. Check your browser's permission settings.");
    }
  }

  function cancelRecording() {
    cancelledRef.current = true;
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  function finishRecording() {
    cancelledRef.current = false;
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  async function handleSendVoice(blob: Blob, durationSeconds: number) {
    setVoiceSending(true);
    try {
      const fd = new FormData();
      fd.set("audio", blob, "voice-message");
      const result = await uploadVoiceMessage(fd);
      if (result.error || !result.url) {
        alert(result.error || "Could not upload voice message.");
        return;
      }

      const optimisticId = `local-${Date.now()}`;
      const optimistic: Message = {
        id: optimisticId,
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: " ",
        image_url: null,
        audio_url: result.url,
        audio_duration: durationSeconds,
        edited_at: null,
        deleted_at: null,
        created_at: new Date().toISOString(),
        read_at: null,
      };
      setMessages((prev) => [...prev, optimistic]);

      const real = await sendMessage(conversationId, "", { audioUrl: result.url, audioDuration: durationSeconds });
      setMessages((prev) => {
        const withoutOptimistic = prev.filter((m) => m.id !== optimisticId);
        if (withoutOptimistic.some((m) => m.id === real.id)) return withoutOptimistic;
        return [...withoutOptimistic, real];
      });
    } finally {
      setVoiceSending(false);
    }
  }

  async function handleSaveEdit() {
    const id = editingId;
    const content = draft.trim();
    if (!id || !content) return;
    setSending(true);
    try {
      const result = await editMessage(id, content);
      if (result.error) {
        alert(result.error);
        return;
      }
      if (result.message) {
        setMessages((prev) => prev.map((m) => (m.id === id ? result.message! : m)));
      }
      setEditingId(null);
      setDraft("");
    } finally {
      setSending(false);
    }
  }

  function startEdit(m: Message) {
    setEditingId(m.id);
    setDraft(m.content.trim());
    setPendingPhoto(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft("");
  }

  async function handleDeleteForMe(id: string) {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    const result = await deleteMessageForMe(id);
    if (result.error) alert(result.error);
  }

  async function handleDeleteForEveryone(id: string) {
    // Optimistic — the realtime UPDATE will confirm it for both sides.
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, deleted_at: new Date().toISOString(), content: " ", image_url: null, audio_url: null, audio_duration: null }
          : m
      )
    );
    const result = await deleteMessageForEveryone(id);
    if (result.error) alert(result.error);
  }

  async function handleSend() {
    if (editingId) return handleSaveEdit();

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
        audio_url: null,
        audio_duration: null,
        edited_at: null,
        deleted_at: null,
        created_at: new Date().toISOString(),
        read_at: null,
      };
      setMessages((prev) => [...prev, optimistic]);
      setDraft("");
      setPendingPhoto(null);

      const real = await sendMessage(conversationId, content, { imageUrl: imageUrl ?? null });

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
    <VoicePlayerProvider>
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 h-16 px-4 border-b bg-[var(--surface)] shrink-0">
          <Link href="/messages" className="btn btn-ghost !p-2 md:hidden" aria-label="Back">←</Link>
          <Link href={`/users/${other.id}`} className="flex items-center gap-3 hover:opacity-80 min-w-0 flex-1">
            <Avatar url={other.avatar_url} name={other.username} size={36} />
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{other.full_name || other.username}</p>
              <p className="text-xs text-[var(--muted)] truncate">@{other.username}</p>
            </div>
          </Link>
        </div>

        <MiniVoicePlayerBar />

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
                const isLocal = m.id.startsWith("local-");
                const isDeleted = !!m.deleted_at;
                const canEdit =
                  mine &&
                  !isLocal &&
                  !isDeleted &&
                  !m.image_url &&
                  !m.audio_url &&
                  Date.now() - new Date(m.created_at).getTime() < EDIT_WINDOW_MS;

                return (
                  <div key={m.id} className={`enter group flex items-center gap-1 mb-1.5 ${mine ? "justify-end" : "justify-start"}`}>
                    {!isDeleted && (
                      <MessageActions
                        mine={mine}
                        canEdit={canEdit}
                        align={mine ? "right" : "left"}
                        onEdit={() => startEdit(m)}
                        onDeleteForMe={() => handleDeleteForMe(m.id)}
                        onDeleteForEveryone={() => handleDeleteForEveryone(m.id)}
                      />
                    )}
                    <div
                      className={`max-w-[75%] px-3 py-2 text-sm shadow-sm ${
                        mine
                          ? "bg-[var(--accent)] text-white rounded-2xl rounded-br-md"
                          : "bg-[var(--surface)] border rounded-2xl rounded-bl-md"
                      }`}
                    >
                      {isDeleted ? (
                        <span className={`italic ${mine ? "text-white/70" : "text-[var(--muted)]"}`}>
                          This message was deleted
                        </span>
                      ) : (
                        <>
                          {m.image_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={m.image_url}
                              alt="attachment"
                              className="rounded-lg max-w-full mb-1 cursor-pointer transition-transform hover:scale-[1.015]"
                              onClick={() => setLightbox(m.image_url)}
                            />
                          )}
                          {m.audio_url && (
                            <VoiceMessageBubble id={m.id} url={m.audio_url} duration={m.audio_duration} mine={mine} />
                          )}
                          {m.content.trim() && <LinkifiedText text={m.content} />}
                        </>
                      )}
                      <div className={`flex items-center gap-1 text-[10px] mt-1 ${mine ? "text-white/75 justify-end" : "text-[var(--muted)]"}`}>
                        {!isDeleted && m.edited_at && <span>edited</span>}
                        {timeLabel(m.created_at)}
                        {mine && (
                          <>
                            {isLocal ? (
                              <ClockIcon />
                            ) : m.read_at ? (
                              <svg viewBox="0 0 16 16" width="14" height="12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 8.5 4.5 12 9 5" />
                                <path d="M6.5 8.5 10 12l4.5-8" />
                              </svg>
                            ) : (
                              <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 8.5 6.5 12 13 5" />
                              </svg>
                            )}
                          </>
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

        {editingId && (
          <div className="px-3 pt-2 flex items-center gap-2 text-sm text-[var(--accent-dark)] bg-[var(--accent-soft)]">
            <span className="flex-1 py-1.5">Editing message</span>
            <button onClick={cancelEdit} className="btn btn-ghost !p-1.5 !rounded-full" aria-label="Cancel edit">
              <XIcon />
            </button>
          </div>
        )}

        {pendingPhoto && !editingId && (
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
          {recording ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--danger)] animate-pulse shrink-0" aria-hidden />
              <span className="text-sm font-medium tabular-nums shrink-0">
                {Math.floor(recordSeconds / 60)}:{(recordSeconds % 60).toString().padStart(2, "0")}
              </span>
              <span className="flex-1 min-w-0 text-sm text-[var(--muted)] truncate">Recording…</span>
              <button onClick={cancelRecording} className="btn btn-ghost !px-3 !rounded-full shrink-0" aria-label="Cancel recording">
                <TrashIcon />
              </button>
              <button onClick={finishRecording} className="btn btn-primary !rounded-full shrink-0 !px-4" aria-label="Send voice message">
                <SendIcon />
              </button>
            </>
          ) : (
            <>
              {!editingId && (
                <>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" id="photo-input" onChange={handlePhotoPick} />
                  <label htmlFor="photo-input" className="btn btn-ghost !px-3 !rounded-full shrink-0" aria-label="Send photo" aria-disabled={uploading}>
                    {uploading ? <Spinner /> : <CameraIcon />}
                  </label>
                </>
              )}
              <input
                className="input flex-1 min-w-0"
                placeholder={editingId ? "Edit message…" : "Message…"}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onPaste={handlePaste}
                autoFocus={!!editingId}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                  if (e.key === "Escape" && editingId) cancelEdit();
                }}
              />
              {editingId ? (
                <button onClick={handleSend} disabled={sending || !draft.trim()} className="btn btn-primary !rounded-full shrink-0 !px-4">
                  {sending && <Spinner />} Save
                </button>
              ) : !draft.trim() && !pendingPhoto ? (
                <button
                  onClick={startRecording}
                  disabled={voiceSending}
                  className="btn btn-primary !rounded-full shrink-0 !px-3.5"
                  aria-label="Record a voice message"
                >
                  {voiceSending ? <Spinner /> : <MicIcon />}
                </button>
              ) : (
                <button onClick={handleSend} disabled={sending || (!draft.trim() && !pendingPhoto)} className="btn btn-primary !rounded-full shrink-0 !px-4">
                  {sending && <Spinner />} Send
                </button>
              )}
            </>
          )}
        </div>

        {lightbox && <ImageLightbox src={lightbox} onClose={() => setLightbox(null)} />}
      </div>
    </VoicePlayerProvider>
  );
}
