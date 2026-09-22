import AppShell from "@/components/AppShell";
import { getCurrentProfile } from "@/lib/current-user";
import { redirect } from "next/navigation";

// Middleware already blocks non-admins from /admin/*; this is a second,
// component-level check so the dashboard never even renders for the wrong role.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "super_admin") redirect("/");

  return (
    <AppShell profile={profile}>
      <main className="px-5 py-10 max-w-4xl">{children}</main>
    </AppShell>
  );
}
