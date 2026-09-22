"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionState } from "./auth";

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

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, cacheControl: "3600" });

  if (uploadError) return { error: uploadError.message };

  const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = `${pub.publicUrl}?t=${Date.now()}`;

  const { error } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { success: true };
}
