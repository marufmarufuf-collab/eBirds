import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Keeps the Supabase session cookie fresh, is the single choke point for
// route protection, and forwards the verified user id downstream via a
// request header — so pages don't have to re-verify the session themselves
// (that's a whole extra network round trip to Supabase Auth, on every page).
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthRoute = path.startsWith("/login") || path.startsWith("/signup") || path.startsWith("/verify") || path.startsWith("/forgot-password") || path.startsWith("/update-password");
  const isPublic = path === "/" || isAuthRoute || path.startsWith("/_next") || path.startsWith("/api") || path.startsWith("/auth/");

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // One profile fetch covers both the deactivated-account check and the
  // admin-route check — was two separate queries before.
  if (user && !isPublic) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_active, role")
      .eq("id", user.id)
      .single();

    if (profile?.is_active === false) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "deactivated");
      return NextResponse.redirect(url);
    }

    if (path.startsWith("/admin") && profile?.role !== "super_admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  if (user && isAuthRoute && path !== "/verify") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Forward the verified id to Server Components via a REQUEST header (not
  // a response header) so `headers()` can read it downstream, with zero
  // extra Supabase Auth calls needed on the page itself. Rebuild the
  // response with the header while carrying over any cookies Supabase just
  // refreshed, so neither gets dropped.
  if (user) {
    const forwardedHeaders = new Headers(request.headers);
    forwardedHeaders.set("x-user-id", user.id);
    const withHeader = NextResponse.next({ request: { headers: forwardedHeaders } });
    response.cookies.getAll().forEach((cookie) => withHeader.cookies.set(cookie));
    response = withHeader;
  }

  return response;
}
