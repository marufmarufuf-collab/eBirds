"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { ActionState } from "./auth";
import type { Profile } from "@/types/database";

const SUPER_ADMIN_EMAIL = "marufmarufuf@gmail.com";

async function requireSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "super_admin") throw new Error("Forbidden: super_admin only.");

  return user;
}

export async function listUsers(query?: string): Promise<Profile[]> {
  await requireSuperAdmin();
  const supabase = await createClient();

  let q = supabase.from("profiles").select("*").order("created_at", { ascending: false });
  if (query?.trim()) {
    q = q.or(`username.ilike.%${query}%,email.ilike.%${query}%`);
  }
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data as Profile[];
}

export async function getUser(id: string): Promise<Profile | null> {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", id).single();
  return data as Profile | null;
}

// Update username / bio / role / active-status for ANY user. Email is
// intentionally not accepted here — the DB trigger would reject it anyway.
export async function adminUpdateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireSuperAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const supabase = await createClient();
  const userId = String(formData.get("userId") || "");
  const username = String(formData.get("username") || "").trim();
  const role = String(formData.get("role") || "").trim() || "user";
  const bio = String(formData.get("bio") || "").trim();
  const isActive = formData.get("isActive") === "on";

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return { error: "Username must be 3-20 characters: letters, numbers, underscores." };
  }

  const target = await getUser(userId);
  if (target?.email?.toLowerCase() === SUPER_ADMIN_EMAIL && role !== "super_admin") {
    return { error: "The original Super Admin's role cannot be demoted." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ username, role, bio, is_active: isActive })
    .eq("id", userId);

  if (error) {
    if (error.code === "23505") return { error: "That username is already taken." };
    return { error: error.message };
  }

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin");
  return { success: true };
}

export async function adminSetPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireSuperAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const userId = String(formData.get("userId") || "");
  const password = String(formData.get("password") || "");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return { error: error.message };

  return { success: true };
}

export async function adminSetAvatar(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireSuperAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const userId = String(formData.get("userId") || "");
  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) return { error: "Choose an image first." };

  const admin = createAdminClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await admin.storage.from("avatars").upload(path, file, { upsert: true });
  if (uploadError) return { error: uploadError.message };

  const { data: pub } = admin.storage.from("avatars").getPublicUrl(path);
  const { error } = await admin.from("profiles").update({ avatar_url: `${pub.publicUrl}?t=${Date.now()}` }).eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}

// Promote another account to super_admin ("add another Super Admin").
export async function adminGrantSuperAdmin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireSuperAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const supabase = await createClient();
  const userId = String(formData.get("userId") || "");

  const { error } = await supabase.from("profiles").update({ role: "super_admin" }).eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function adminDeactivateUser(userId: string): Promise<ActionState> {
  try {
    await requireSuperAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ is_active: false }).eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}
