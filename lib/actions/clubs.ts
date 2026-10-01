"use server";

import { createClient } from "@/lib/supabase/server";
import { getVerifiedUserId } from "@/lib/verified-user";
import { revalidatePath } from "next/cache";
import type { Club, ClubMember, ClubAnnouncement, Profile } from "@/types/database";

export async function createClub(name: string, description: string): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  if (!name.trim()) return { error: "Name is required." };

  const { data, error } = await supabase.rpc("create_club", {
    p_name: name.trim(),
    p_description: description.trim() || null,
  });
  if (error) return { error: error.message };
  return { id: data as string };
}

export async function listClubs(): Promise<Club[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("clubs").select("*").order("created_at", { ascending: false });
  return (data ?? []) as Club[];
}

export async function getClub(id: string): Promise<Club | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("clubs").select("*").eq("id", id).single();
  return data as Club | null;
}

export type ClubMemberWithProfile = ClubMember & { profile: Profile };

export async function getClubMembers(clubId: string): Promise<ClubMemberWithProfile[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("club_members").select("*, profile:profiles(*)").eq("club_id", clubId);
  return (data ?? []) as unknown as ClubMemberWithProfile[];
}

export async function getMyClubMembership(clubId: string): Promise<ClubMember | null> {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  if (!userId) return null;
  const { data } = await supabase
    .from("club_members")
    .select("*")
    .eq("club_id", clubId)
    .eq("user_id", userId)
    .maybeSingle();
  return data as ClubMember | null;
}

export async function joinClub(clubId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("join_club", { p_club_id: clubId });
  if (error) return { error: error.message };
  revalidatePath(`/clubs/${clubId}`);
  return {};
}

export async function leaveClub(clubId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("leave_club", { p_club_id: clubId });
  if (error) return { error: error.message };
  revalidatePath(`/clubs/${clubId}`);
  return {};
}

export async function getAnnouncements(clubId: string): Promise<ClubAnnouncement[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("club_announcements")
    .select("*")
    .eq("club_id", clubId)
    .order("created_at", { ascending: false });
  return (data ?? []) as ClubAnnouncement[];
}

export async function postAnnouncement(clubId: string, content: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  if (!userId) return { error: "Not signed in." };
  if (!content.trim()) return { error: "Announcement can't be empty." };

  const { error } = await supabase
    .from("club_announcements")
    .insert({ club_id: clubId, author_id: userId, content: content.trim() });
  if (error) return { error: error.message };
  revalidatePath(`/clubs/${clubId}`);
  return {};
}
