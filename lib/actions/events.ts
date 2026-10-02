"use server";

import { createClient } from "@/lib/supabase/server";
import { getVerifiedUserId } from "@/lib/verified-user";
import { revalidatePath } from "next/cache";
import type { Event, EventParticipant, Profile, Activity } from "@/types/database";

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`;
}

export type CreateEventInput = {
  activity: Activity;
  title: string;
  description: string;
  eventDate: string; // ISO datetime
  locationArea: string;
  meetingPoint: string;
  locationLink: string;
  maxParticipants: number | null;
  isPaid: boolean;
  price: number | null;
};

export async function createEvent(input: CreateEventInput): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  if (!userId) return { error: "Not signed in." };
  if (!input.title.trim()) return { error: "Title is required." };
  if (!input.locationArea.trim()) return { error: "Location area is required." };
  if (!input.eventDate) return { error: "Date and time are required." };

  const { data, error } = await supabase
    .from("events")
    .insert({
      organizer_id: userId,
      activity: input.activity,
      title: input.title.trim(),
      description: input.description.trim() || null,
      event_date: input.eventDate,
      location_area: input.locationArea.trim(),
      meeting_point: input.meetingPoint.trim() || null,
      location_link: normalizeUrl(input.locationLink),
      max_participants: input.maxParticipants,
      is_paid: input.isPaid,
      price: input.isPaid ? input.price : null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
}

export async function listEvents(activity?: Activity | "all"): Promise<Event[]> {
  const supabase = await createClient();
  let q = supabase.from("events").select("*").in("status", ["open", "full"]).order("event_date", { ascending: true });
  if (activity && activity !== "all") q = q.eq("activity", activity);
  const { data } = await q;
  return (data ?? []) as Event[];
}

export async function getEvent(id: string): Promise<Event | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("events").select("*").eq("id", id).single();
  return data as Event | null;
}

export async function getOrganizer(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return data as Profile | null;
}

export type ParticipantWithProfile = EventParticipant & { profile: Profile };

export async function getEventParticipants(eventId: string): Promise<ParticipantWithProfile[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("event_participants").select("*, profile:profiles(*)").eq("event_id", eventId);
  return (data ?? []) as unknown as ParticipantWithProfile[];
}

export async function getMyParticipation(eventId: string): Promise<EventParticipant | null> {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  if (!userId) return null;
  const { data } = await supabase
    .from("event_participants")
    .select("*")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle();
  return data as EventParticipant | null;
}

export async function requestJoinEvent(eventId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("request_join_event", { p_event_id: eventId });
  if (error) return { error: error.message };
  revalidatePath(`/discover/${eventId}`);
  return {};
}

export async function confirmParticipant(eventId: string, userId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("confirm_event_participant", { p_event_id: eventId, p_user_id: userId });
  if (error) return { error: error.message };
  revalidatePath("/events/mine");
  revalidatePath(`/discover/${eventId}`);
  return {};
}

export async function declineParticipant(eventId: string, userId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("decline_event_participant", { p_event_id: eventId, p_user_id: userId });
  if (error) return { error: error.message };
  revalidatePath("/events/mine");
  return {};
}

export async function cancelMyParticipation(eventId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_event_participation", { p_event_id: eventId });
  if (error) return { error: error.message };
  revalidatePath(`/discover/${eventId}`);
  return {};
}

export async function completeEvent(eventId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_event", { p_event_id: eventId });
  if (error) return { error: error.message };
  revalidatePath("/events/mine");
  return {};
}

export async function cancelEvent(eventId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_event", { p_event_id: eventId });
  if (error) return { error: error.message };
  revalidatePath("/events/mine");
  return {};
}

export type MyEventsResult = {
  organized: Event[];
  joined: (Event & { myStatus: string })[];
};

export async function listMyEvents(): Promise<MyEventsResult> {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  if (!userId) return { organized: [], joined: [] };

  const [{ data: organized }, { data: participations }] = await Promise.all([
    supabase.from("events").select("*").eq("organizer_id", userId).order("event_date", { ascending: false }),
    supabase.from("event_participants").select("status, events(*)").eq("user_id", userId),
  ]);

  const joined = (participations ?? [])
    .filter((p) => p.events)
    .map((p) => ({ ...(p.events as unknown as Event), myStatus: p.status as string }));

  return { organized: (organized ?? []) as Event[], joined };
}
