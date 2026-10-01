import { getEvent, getMyParticipation, getEventParticipants, getOrganizer } from "@/lib/actions/events";
import { getVerifiedUserId } from "@/lib/verified-user";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import EventDetailClient from "./EventDetailClient";

export default async function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  if (!userId) notFound();

  const event = await getEvent(eventId);
  if (!event) notFound();

  const isOrganizer = event.organizer_id === userId;

  const [organizer, myParticipation, participants] = await Promise.all([
    getOrganizer(event.organizer_id),
    getMyParticipation(eventId),
    isOrganizer ? getEventParticipants(eventId) : Promise.resolve([]),
  ]);

  if (!organizer) notFound();

  return (
    <EventDetailClient
      event={event}
      organizer={organizer}
      currentUserId={userId}
      isOrganizer={isOrganizer}
      initialMyParticipation={myParticipation}
      initialParticipants={participants}
    />
  );
}
