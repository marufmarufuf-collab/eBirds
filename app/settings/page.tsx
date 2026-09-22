import AppShell from "@/components/AppShell";
import { getCurrentProfile } from "@/lib/current-user";
import { redirect } from "next/navigation";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <AppShell profile={profile}>
      <main className="px-5 py-10 max-w-2xl">
        <h1 className="display text-2xl mb-6">Settings</h1>
        <SettingsForm email={profile.email} />
      </main>
    </AppShell>
  );
}
