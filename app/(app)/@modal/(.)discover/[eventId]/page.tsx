import { getEvent, getMyParticipation, getEventParticipants, getOrganizer } from "@/lib/actions/events";
import { getVerifiedUserId } from "@/lib/verified-user";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ModalOverlay from "@/components/ModalOverlay";
import EventDetailClient from "../../../discover/[eventId]/EventDetailClient";

// Intercepted: clicking an event from Discover or My Events renders this
// instead of navigating away — an instant pop-up over whatever page you
// were on. A direct link or refresh still gets the real full page.
export default async function EventDetailModal({ params }: { params: Promise<{ eventId: string }> }) {
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
    <ModalOverlay maxWidth="max-w-xl">
      <div className="card p-6">
        <EventDetailClient
          event={event}
          organizer={organizer}
          currentUserId={userId}
          isOrganizer={isOrganizer}
          initialMyParticipation={myParticipation}
          initialParticipants={participants}
        />
      </div>
    </ModalOverlay>
  );
}
