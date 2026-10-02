"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";
import { ACTIVITY_META } from "@/lib/activity-meta";
import { ACTIVITIES } from "@/types/database";
import { createEvent } from "@/lib/actions/events";
import type { Activity } from "@/types/database";

export default function CreateEventForm() {
  const [activity, setActivity] = useState<Activity>("walking");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [locationArea, setLocationArea] = useState("");
  const [meetingPoint, setMeetingPoint] = useState("");
  const [locationLink, setLocationLink] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createEvent({
        activity,
        title,
        description,
        eventDate: eventDate ? new Date(eventDate).toISOString() : "",
        locationArea,
        meetingPoint,
        locationLink,
        maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : null,
        isPaid,
        price: price ? parseFloat(price) : null,
      });
      if (result.error) return setError(result.error);
      router.push(`/discover/${result.id}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      <div>
        <label className="text-sm mb-1 block">Activity</label>
        <div className="flex gap-2 flex-wrap">
          {ACTIVITIES.map((a) => (
            <button
              type="button"
              key={a}
              onClick={() => setActivity(a)}
              className={`tag !text-sm !px-3 !py-1.5 ${activity === a ? "!bg-[var(--ink)] !text-white !border-transparent" : ""}`}
            >
              {ACTIVITY_META[a].emoji} {ACTIVITY_META[a].label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm mb-1 block">Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required className="input" placeholder="Morning run along the river" />
      </div>

      <div>
        <label className="text-sm mb-1 block">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input" placeholder="What to expect, pace, what to bring…" />
      </div>

      <div>
        <label className="text-sm mb-1 block">Date & time</label>
        <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required className="input" />
      </div>

      <div>
        <label className="text-sm mb-1 block">General area (shown to everyone)</label>
        <input value={locationArea} onChange={(e) => setLocationArea(e.target.value)} required className="input" placeholder="e.g. Chilanzar, Tashkent" />
      </div>

      <div>
        <label className="text-sm mb-1 block">Exact meeting point (only shown to confirmed participants)</label>
        <input value={meetingPoint} onChange={(e) => setMeetingPoint(e.target.value)} className="input" placeholder="e.g. by the fountain, Chilanzar metro exit 2" />
      </div>

      <div>
        <label className="text-sm mb-1 block">Location link (optional — Google Maps, etc. Also only shown to confirmed participants)</label>
        <input value={locationLink} onChange={(e) => setLocationLink(e.target.value)} className="input" placeholder="https://maps.google.com/…" />
      </div>

      <div>
        <label className="text-sm mb-1 block">Max participants (optional)</label>
        <input type="number" min={1} value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} className="input" placeholder="No limit" />
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm mb-2">
          <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} /> This is a paid event
        </label>
        {isPaid && (
          <>
            <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} className="input" placeholder="Price in UZS" />
            <p className="text-xs text-[var(--muted)] mt-1">Online payment isn't connected yet — you'll need to arrange payment with participants directly for now.</p>
          </>
        )}
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending && <Spinner />} {pending ? "Creating…" : "Create event"}
      </button>
    </form>
  );
}
