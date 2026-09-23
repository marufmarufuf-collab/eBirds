import { getCurrentProfile } from "@/lib/current-user";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();

  return (
    <main className="px-5 py-10 max-w-2xl">
      <h1 className="display text-2xl mb-6">Settings</h1>
      {profile && <SettingsForm email={profile.email} />}
    </main>
  );
}
