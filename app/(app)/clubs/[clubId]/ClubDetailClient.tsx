"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import Spinner from "@/components/Spinner";
import { joinClub, leaveClub, postAnnouncement } from "@/lib/actions/clubs";
import type { Club, ClubAnnouncement, ClubMember } from "@/types/database";
import type { ClubMemberWithProfile } from "@/lib/actions/clubs";

export default function ClubDetailClient({
  club,
  initialMembers,
  initialMyMembership,
  initialAnnouncements,
}: {
  club: Club;
  initialMembers: ClubMemberWithProfile[];
  initialMyMembership: ClubMember | null;
  initialAnnouncements: ClubAnnouncement[];
}) {
  const [members, setMembers] = useState(initialMembers);
  const [myMembership, setMyMembership] = useState(initialMyMembership);
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [announcementDraft, setAnnouncementDraft] = useState("");
  const [pending, startTransition] = useTransition();

  const isAdmin = myMembership?.role === "admin";

  function handleJoin() {
    startTransition(async () => {
      const result = await joinClub(club.id);
      if (!result.error) {
        setMyMembership({ club_id: club.id, user_id: "me", role: "member", joined_at: new Date().toISOString() });
      }
    });
  }

  function handleLeave() {
    startTransition(async () => {
      const result = await leaveClub(club.id);
      if (!result.error) setMyMembership(null);
    });
  }

  function handlePostAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    const content = announcementDraft.trim();
    if (!content) return;
    startTransition(async () => {
      const result = await postAnnouncement(club.id, content);
      if (!result.error) {
        setAnnouncements((prev) => [{ id: `local-${Date.now()}`, club_id: club.id, author_id: "", content, created_at: new Date().toISOString() }, ...prev]);
        setAnnouncementDraft("");
      }
    });
  }

  return (
    <main className="px-5 py-10 max-w-2xl">
      <div className="flex items-center gap-4 mb-4">
        <Avatar url={club.avatar_url} name={club.name} size={56} />
        <div className="flex-1">
          <h1 className="display text-2xl">{club.name}</h1>
          <p className="text-sm text-[var(--muted)]">{members.length} members</p>
        </div>
      </div>

      {club.description && <p className="mb-6">{club.description}</p>}

      <div className="flex gap-2 mb-8 flex-wrap">
        {myMembership ? (
          <>
            {club.conversation_id && <Link href={`/messages/${club.conversation_id}`} className="btn btn-primary">Open club chat</Link>}
            <button onClick={handleLeave} disabled={pending} className="btn btn-ghost">
              {pending && <Spinner />} Leave club
            </button>
          </>
        ) : (
          <button onClick={handleJoin} disabled={pending} className="btn btn-primary">
            {pending && <Spinner />} Join club
          </button>
        )}
      </div>

      {myMembership && (
        <div className="card p-5 mb-6">
          <h2 className="text-sm font-medium text-[var(--muted)] mb-3">Announcements</h2>
          {isAdmin && (
            <form onSubmit={handlePostAnnouncement} className="flex gap-2 mb-4">
              <input value={announcementDraft} onChange={(e) => setAnnouncementDraft(e.target.value)} className="input" placeholder="Post an announcement…" />
              <button type="submit" disabled={pending || !announcementDraft.trim()} className="btn btn-primary shrink-0">Post</button>
            </form>
          )}
          {announcements.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No announcements yet.</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a.id} className="text-sm border-b last:border-b-0 pb-3 last:pb-0">
                  <p>{a.content}</p>
                  <p className="text-xs text-[var(--muted)] mt-1">{new Date(a.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card p-5">
        <h2 className="text-sm font-medium text-[var(--muted)] mb-3">Members</h2>
        <div className="space-y-2">
          {members.map((m) => (
            <Link key={m.user_id} href={`/users/${m.user_id}`} className="flex items-center gap-3 hover:opacity-80">
              <Avatar url={m.profile.avatar_url} name={m.profile.username} size={32} />
              <span className="text-sm flex-1">{m.profile.full_name || m.profile.username}</span>
              {m.role === "admin" && <span className="tag">Admin</span>}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
