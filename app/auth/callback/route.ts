import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recordLogin } from "@/lib/record-login";

// Google (and any other OAuth provider) redirects back here with a `code`.
// Exchange it for a session, then send the user home.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (data.user) await recordLogin(supabase, data.user.id);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
