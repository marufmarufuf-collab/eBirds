"use client";

import { createClient } from "@/lib/supabase/client";

export default function GoogleButton({ label = "Continue with Google" }: { label?: string }) {
  async function handleClick() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <button type="button" onClick={handleClick} className="btn btn-ghost w-full">
      <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.5 5.1 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.5-.4-3.5z"/>
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.5 5.1 29.5 3 24 3c-7.5 0-14 4.2-17.7 10.7z"/>
        <path fill="#4CAF50" d="M24 45c5.3 0 10.1-2 13.7-5.4l-6.3-5.3C29.3 36 26.8 37 24 37c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.9 40.6 16.4 45 24 45z"/>
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.3 5.3C40.8 36 44 30.5 44 24c0-1.4-.1-2.5-.4-3.5z"/>
      </svg>
      {label}
    </button>
  );
}
