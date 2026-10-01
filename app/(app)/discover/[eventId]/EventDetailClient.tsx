"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import Spinner from "@/components/Spinner";
import { ACTIVITY_META, formatEventDate, formatPrice } from "@/lib/activity-meta";
import {
  requestJoinEvent,
  cancelMyParticipation,
  confirmParticipant,
  declineParticipant,
  completeEvent,
  cancelEvent,
  type ParticipantWithProfile,
} from "@/lib/actions/events";
import type { Event, EventParticipant, Profile } from "@/types/database";

export default function EventDetailClient({
  event,
  organizer,
  currentUserId,
  isOrganizer,
  initialMyParticipation,
  initialParticipants,
}: {
  event: Event;
  organizer: Profile;
  currentUserId: string;
  isOrganizer: boolean;
  initialMyParticipation: EventParticipant | null;
  initialParticipants: ParticipantWithProfile[];
}) {
  const [myParticipation, setMyParticipation] = useState(initialMyParticipation);
  const [participants, setParticipants] = useState(initialParticipants);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const meta = ACTIVITY_META[event.activity];
  const confirmed = participants.filter((p) => p.status === "confirmed");
  const requests = participants.filter((p) => p.status === "pending");

  function handleJoin() {
    setError(null);
    startTransition(async () => {
      const result = await requestJoinEvent(event.id);
      if (result.error) return setError(result.error);
      setMyParticipation({
        event_id: event.id,
        user_id: currentUserId,
        status: "pending",
        requested_at: new Date().toISOString(),
        confirmed_at: null,
        completed: false,
      });
    });
  }

  function handleCancelMine() {
    startTransition(async () => {
      await cancelMyParticipation(event.id);
      setMyParticipation((p) => (p ? { ...p, status: "cancelled" } : p));
    });
  }

  function handleConfirm(userId: string) {
    startTransition(async () => {
      const result = await confirmParticipant(event.id, userId);
      if (result.error) return setError(result.error);
      setParticipants((prev) => prev.map((p) => (p.user_id === userId ? { ...p, status: "confirmed", confirmed_at: new Date().toISOString() } : p)));
    });
  }

  function handleDecline(userId: string) {
    startTransition(async () => {
      await declineParticipant(event.id, userId);
      setParticipants((prev) => prev.map((p) => (p.user_id === userId ? { ...p, status: "declined" } : p)));
    });
  }

  function handleComplete() {
    startTransition(async () => {
      await completeEvent(event.id);
      router.refresh();
    });
  }

  function handleCancelEvent() {
    if (!confirm("Cancel this event for everyone?")) return;
    startTransition(async () => {
      await cancelEvent(event.id);
      router.refresh();
    });
  }

  const canJoin = !isOrganizer && (!myParticipation || ["declined", "cancelled"].includes(myParticipation.status)) && event.status === "open";

  return (
    <main className="px-5 py-10 max-w-2xl">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="tag">{meta.emoji} {meta.label}</span>
        <span className={`tag ${event.is_paid ? "" : "!bg-[var(--accent-soft)] !text-[var(--accent-dark)] !border-transparent"}`}>
          {formatPrice(event.is_paid ? event.price : null, event.currency)}
        </span>
        {event.status === "full" && <span className="tag">Full</span>}
        {event.status === "cancelled" && <span className="tag !bg-[var(--danger-soft)] !text-[var(--danger)] !border-transparent">Cancelled</span>}
        {event.status === "completed" && <span className="tag">Completed</span>}
      </div>

      <h1 className="display text-2xl mb-2">{event.title}</h1>
      <p className="text-[var(--muted)] mb-1">{formatEventDate(event.event_date)}</p>
      <p className="text-[var(--muted)] mb-4">📍 {event.location_area}</p>

      {event.description && <p className="mb-6 whitespace-pre-wrap">{event.description}</p>}

      <Link href={`/users/${organizer.id}`} className="flex items-center gap-2 mb-6 hover:opacity-80 w-fit">
        <Avatar url={organizer.avatar_url} name={organizer.username} size={32} />
        <span className="text-sm">Organized by <span className="font-medium">{organizer.full_name || organizer.username}</span></span>
      </Link>

      {error && <p className="text-sm text-[var(--danger)] mb-4">{error}</p>}

      {/* Participant view */}
      {!isOrganizer && (
        <div className="card p-5 mb-6">
          {myParticipation?.status === "confirmed" ? (
            <>
              <p className="text-sm font-medium text-[var(--accent-dark)] mb-2">You're in! 🎉</p>
              {event.meeting_point && (
                <p className="text-sm text-[var(--muted)] mb-3">Meeting point: <span className="text-[var(--ink)]">{event.meeting_point}</span></p>
              )}
              <div className="flex gap-2 flex-wrap">
                {event.conversation_id && (
                  <Link href={`/messages/${event.conversation_id}`} className="btn btn-primary">Open group chat</Link>
                )}
                <button onClick={handleCancelMine} disabled={pending} className="btn btn-ghost">
                  {pending && <Spinner />} Leave event
                </button>
              </div>
            </>
          ) : myParticipation?.status === "pending" ? (
            <>
              <p className="text-sm mb-3">Your request is waiting for the organizer to confirm.</p>
              <button onClick={handleCancelMine} disabled={pending} className="btn btn-ghost">
                {pending && <Spinner />} Cancel request
              </button>
            </>
          ) : canJoin ? (
            <button onClick={handleJoin} disabled={pending} className="btn btn-primary">
              {pending && <Spinner />} Request to join
            </button>
          ) : (
            <p className="text-sm text-[var(--muted)]">This event isn't accepting new requests right now.</p>
          )}
        </div>
      )}

      {/* Organizer view */}
      {isOrganizer && (
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-[var(--muted)]">Your event</h2>
              <div className="flex gap-2">
                {event.conversation_id && (
                  <Link href={`/messages/${event.conversation_id}`} className="btn btn-ghost">Group chat</Link>
                )}
                {event.status !== "completed" && event.status !== "cancelled" && (
                  <>
                    <button onClick={handleComplete} disabled={pending} className="btn btn-primary">Mark completed</button>
                    <button onClick={handleCancelEvent} disabled={pending} className="btn btn-ghost text-[var(--danger)]">Cancel event</button>
                  </>
                )}
              </div>
            </div>
            {event.meeting_point && <p className="text-sm text-[var(--muted)]">Meeting point (shown to confirmed participants): {event.meeting_point}</p>}
          </div>

          {requests.length > 0 && (
            <div className="card p-5">
              <h2 className="text-sm font-medium text-[var(--muted)] mb-3">Requests ({requests.length})</h2>
              <div className="space-y-2">
                {requests.map((r) => (
                  <div key={r.user_id} className="flex items-center gap-3">
                    <Avatar url={r.profile.avatar_url} name={r.profile.username} size={32} />
                    <span className="flex-1 text-sm truncate">{r.profile.full_name || r.profile.username}</span>
                    <button onClick={() => handleConfirm(r.user_id)} disabled={pending} className="btn btn-primary !px-3">Confirm</button>
                    <button onClick={() => handleDecline(r.user_id)} disabled={pending} className="btn btn-ghost !px-3">Decline</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card p-5">
            <h2 className="text-sm font-medium text-[var(--muted)] mb-3">
              Confirmed ({confirmed.length}{event.max_participants ? ` / ${event.max_participants}` : ""})
            </h2>
            {confirmed.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No one confirmed yet.</p>
            ) : (
              <div className="space-y-2">
                {confirmed.map((p) => (
                  <Link key={p.user_id} href={`/users/${p.user_id}`} className="flex items-center gap-3 hover:opacity-80">
                    <Avatar url={p.profile.avatar_url} name={p.profile.username} size={32} />
                    <span className="text-sm">{p.profile.full_name || p.profile.username}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
