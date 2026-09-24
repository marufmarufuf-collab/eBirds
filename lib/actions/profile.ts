"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionState } from "./auth";
import type { ProfilePhoto } from "@/types/database";

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const username = String(formData.get("username") || "").trim();
  const fullName = String(formData.get("fullName") || "").trim();
  const bio = String(formData.get("bio") || "").trim();

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return { error: "Username must be 3-20 characters: letters, numbers, underscores." };
  }
  if (!fullName) return { error: "Full name is required." };

  const { error } = await supabase
    .from("profiles")
    .update({ username, full_name: fullName, bio })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") return { error: "That username is already taken." };
    return { error: error.message };
  }

  revalidatePath("/profile");
  return { success: true };
}

export async function changeOwnPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const password = String(formData.get("password") || "");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { success: true };
}

export async function uploadAvatar(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) return { error: "Choose an image first." };
  if (!file.type.startsWith("image/")) return { error: "File must be an image." };
  if (file.size > 5 * 1024 * 1024) return { error: "Image must be under 5MB." };

  // Unique filename per upload (not a fixed "avatar.ext") so past photos
  // stay in the gallery instead of being overwritten each time.
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${user.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { cacheControl: "3600" });

  if (uploadError) return { error: uploadError.message };

  const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = pub.publicUrl;

  const [{ error: profileError }, { error: photoError }] = await Promise.all([
    supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", user.id),
    supabase.from("profile_photos").insert({ user_id: user.id, url: avatarUrl }),
  ]);

  if (profileError) return { error: profileError.message };
  if (photoError) return { error: photoError.message };

  revalidatePath("/profile");
  return { success: true };
}

export async function getProfilePhotos(userId: string): Promise<ProfilePhoto[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_photos")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as ProfilePhoto[];
}

function storagePathFromUrl(url: string): string | null {
  const marker = "/avatars/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length).split("?")[0];
}

export async function deleteProfilePhoto(photoId: string): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: photo } = await supabase
    .from("profile_photos")
    .select("*")
    .eq("id", photoId)
    .eq("user_id", user.id)
    .single();

  if (!photo) return { error: "Photo not found." };

  const { error: deleteError } = await supabase.from("profile_photos").delete().eq("id", photoId);
  if (deleteError) return { error: deleteError.message };

  const path = storagePathFromUrl(photo.url);
  if (path) await supabase.storage.from("avatars").remove([path]);

  // If that was the current avatar, fall back to the next most recent
  // remaining photo, or clear it entirely if none are left.
  const { data: profile } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single();
  if (profile?.avatar_url === photo.url) {
    const { data: remaining } = await supabase
      .from("profile_photos")
      .select("url")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    await supabase.from("profiles").update({ avatar_url: remaining?.[0]?.url ?? null }).eq("id", user.id);
  }

  revalidatePath("/profile");
  return { success: true };
}
