"use client";

import { useState, useTransition } from "react";
import { searchUsers, startConversation } from "@/lib/actions/messaging";
import Avatar from "@/components/Avatar";
import type { Profile } from "@/types/database";

export default function UserSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [pending, startTransition] = useTransition();

  function onChange(value: string) {
    setQuery(value);
    startTransition(async () => {
      setResults(value.trim() ? await searchUsers(value) : []);
    });
  }

  return (
    <div className="relative">
      <input
        className="input"
        placeholder="Search by username or email…"
        value={query}
        onChange={(e) => onChange(e.target.value)}
      />
      {query.trim() && (
        <div className="card mt-2 max-h-72 overflow-auto">
          {pending && <p className="p-3 text-sm text-[var(--muted)]">Searching…</p>}
          {!pending && results.length === 0 && (
            <p className="p-3 text-sm text-[var(--muted)]">No matching users.</p>
          )}
          {results.map((u) => (
            <button
              key={u.id}
              onClick={() => startTransition(() => startConversation(u.id))}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-[var(--paper)] border-b last:border-b-0"
            >
              <Avatar url={u.avatar_url} name={u.username} size={32} />
              <div>
                <p className="text-sm font-medium">{u.username}</p>
                <p className="text-xs text-[var(--muted)]">{u.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
