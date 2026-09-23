import AppShell from "@/components/AppShell";
import { getCurrentProfile } from "@/lib/current-user";
import { redirect } from "next/navigation";

// Shared shell for every authenticated page — fetches the profile and
// renders the sidebar/topbar ONCE per navigation (not once per page).
// `modal` is the @modal parallel route slot: empty by default, filled when
// an intercepted route (like a profile popup) is active.
export default async function AppGroupLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <AppShell profile={profile}>
      {children}
      {modal}
    </AppShell>
  );
}
