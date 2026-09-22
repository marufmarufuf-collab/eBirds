"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type ActionState = { error?: string; success?: boolean };

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const fullName = String(formData.get("fullName") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!fullName) return { error: "Full name is required." };
  if (!email || !password) return { error: "Email and password are required." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    // Supabase returns a generic message when the email is already registered
    // and confirmed; surface something actionable either way.
    return { error: error.message };
  }

  redirect(`/verify?email=${encodeURIComponent(email)}`);
}

export async function verifyCode(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const token = String(formData.get("code") || "").trim();

  if (!/^\d{6,10}$/.test(token)) return { error: "Enter the code exactly as it appeared in your email." };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "signup" });

  if (error) return { error: error.message };

  redirect("/");
}

export async function resendCode(email: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email });
  if (error) return { error: error.message };
  return { success: true };
}

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.toLowerCase().includes("confirm")) {
      redirect(`/verify?email=${encodeURIComponent(email)}`);
    }
    return { error: "Invalid email or password." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", data.user.id)
    .single();

  if (profile && profile.is_active === false) {
    await supabase.auth.signOut();
    return { error: "This account has been deactivated." };
  }

  redirect(next || "/");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function deleteOwnAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get("password") || "");
  if (!password) return { error: "Enter your password to confirm." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) return { error: "Not signed in." };

  // Re-verify the password before doing anything irreversible.
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });
  if (reauthError) return { error: "Incorrect password." };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: error.message };

  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/update-password`,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function updatePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get("password") || "");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect("/");
}
