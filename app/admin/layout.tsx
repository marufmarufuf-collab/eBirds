import Navbar from "@/components/Navbar";
import { getCurrentProfile } from "@/lib/current-user";
import { redirect } from "next/navigation";

// Middleware already blocks non-admins from /admin/*; this is a second,
// component-level check so the dashboard never even renders for the wrong role.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "super_admin") redirect("/");

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-5 py-10">{children}</main>
    </>
  );
}
