import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/current-user";

// Kept outside the (app) route group on purpose — the marketing/landing
// page has no sidebar and no auth requirement. Authenticated visitors are
// sent straight to /home, which DOES live inside (app), so every
// authenticated page shares one layout tree and switching between them is
// a fast client-side navigation instead of a full remount.
export default async function RootPage() {
  const profile = await getCurrentProfile();
  if (profile) redirect("/home");

  return (
    <main className="min-h-screen flex items-center justify-center px-5 relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(700px circle at 15% 10%, #ffd9b3 0%, transparent 60%), radial-gradient(600px circle at 85% 85%, #ffb37a 0%, transparent 55%)",
        }}
      />
      <div className="max-w-md text-center enter">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-full.png" alt="eBirds" className="h-16 w-auto object-contain mx-auto mb-3" />
        <p className="text-lg mb-1">A place for your people</p>
        <p className="text-[var(--muted)] mb-6">
          Accounts, profiles, and messaging — built as one platform, not a chat app with extras bolted on.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/signup" className="btn btn-primary">Get started</Link>
          <Link href="/login" className="btn btn-ghost">Log in</Link>
        </div>
      </div>
    </main>
  );
}
