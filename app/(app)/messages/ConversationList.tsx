"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { searchUsers, startConversation, getConversationList, type ConversationPreview } from "@/lib/actions/messaging";
import { timeLabel, dayLabel } from "@/lib/format-date";
import Avatar from "@/components/Avatar";
import Spinner from "@/components/Spinner";
import { SearchIcon } from "@/components/icons";
import type { Profile, Message } from "@/types/database";

function previewText(m: Message | null, mine: boolean): string {
  if (!m) return "Say hello 👋";
  const prefix = mine ? "You: " : "";
  if (m.image_url) return `${prefix}📷 Photo${m.content.trim() ? ` · ${m.content.trim()}` : ""}`;
  return `${prefix}${m.content}`;
}

function relativeTime(iso: string): string {
  const d = dayLabel(iso);
  return d === "Today" ? timeLabel(iso) : d;
}

export default function ConversationList({
  currentUserId,
  initialConversations,
  initialOtherUsers,
}: {
  currentUserId: string;
  initialConversations: ConversationPreview[];
  initialOtherUsers: Profile[];
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const [otherUsers, setOtherUsers] = useState(initialOtherUsers);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  async function refresh() {
    const { conversations: c, otherUsers: o } = await getConversationList();
    setConversations(c);
    setOtherUsers(o);
  }

  // Live: new message anywhere → bump that conversation's preview to the top.
  // New conversation → refresh (rare event, a full refetch is cheap and simple).
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("messages-list")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as Message;
        setConversations((prev) => {
          const idx = prev.findIndex((c) => c.conversationId === m.conversation_id);
          if (idx === -1) {
            refresh();
            return prev;
          }
          const updated = { ...prev[idx], lastMessage: m, updatedAt: m.created_at };
          const rest = prev.filter((_, i) => i !== idx);
          return [updated, ...rest];
        });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversations" }, () => {
        refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function onSearchChange(value: string) {
    setQuery(value);
    setSearching(true);
    startTransition(async () => {
      setResults(value.trim() ? await searchUsers(value) : []);
      setSearching(false);
    });
  }

  function openWith(userId: string) {
    setOpeningId(userId);
    startTransition(() => startConversation(userId));
  }

  return (
    <div>
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
        <input
          className="input !pl-9"
          placeholder="Search by username or email…"
          value={query}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {query.trim() && (
          <div className="card mt-2 max-h-72 overflow-auto absolute w-full z-30">
            {searching && (
              <p className="p-3 text-sm text-[var(--muted)] flex items-center gap-2">
                <Spinner /> Searching…
              </p>
            )}
            {!searching && results.length === 0 && (
              <p className="p-3 text-sm text-[var(--muted)]">No matching users.</p>
            )}
            {results.map((u) => (
              <button
                key={u.id}
                onClick={() => openWith(u.id)}
                disabled={openingId === u.id}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-[var(--surface-2)] border-b last:border-b-0"
              >
                <Avatar url={u.avatar_url} name={u.username} size={32} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{u.full_name || u.username}</p>
                  <p className="text-xs text-[var(--muted)]">@{u.username}</p>
                </div>
                {openingId === u.id && <Spinner className="text-[var(--accent)]" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 space-y-0.5">
        {conversations.length === 0 && (
          <p className="text-sm text-[var(--muted)] px-1">No conversations yet — say hello to someone below.</p>
        )}
        {conversations.map((c, i) => {
          const active = pathname === `/messages/${c.conversationId}`;
          return (
            <Link
              key={c.conversationId}
              href={`/messages/${c.conversationId}`}
              style={{ animationDelay: `${Math.min(i, 8) * 25}ms` }}
              className={`enter flex items-center gap-3 rounded-[12px] px-2.5 py-2.5 transition-colors ${
                active ? "bg-[var(--accent-soft)]" : "hover:bg-[var(--surface-2)]"
              }`}
            >
              <Avatar url={c.other.avatar_url} name={c.other.username} size={44} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{c.other.full_name || c.other.username}</p>
                <p className="text-xs text-[var(--muted)] truncate">
                  {previewText(c.lastMessage, c.lastMessage?.sender_id === currentUserId)}
                </p>
              </div>
              <span className="text-xs text-[var(--muted)] shrink-0">{relativeTime(c.updatedAt)}</span>
            </Link>
          );
        })}
      </div>

      {otherUsers.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide mb-2 px-1">People you haven't messaged</h2>
          <div className="space-y-0.5">
            {otherUsers.map((u, i) => (
              <button
                key={u.id}
                onClick={() => openWith(u.id)}
                disabled={openingId === u.id}
                style={{ animationDelay: `${Math.min(i, 8) * 25}ms` }}
                className="enter flex items-center gap-3 rounded-[12px] px-2.5 py-2 w-full text-left hover:bg-[var(--surface-2)] transition-colors"
              >
                <Avatar url={u.avatar_url} name={u.username} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.full_name || u.username}</p>
                  <p className="text-xs text-[var(--muted)] truncate">@{u.username}</p>
                </div>
                {openingId === u.id && <Spinner className="text-[var(--accent)]" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
