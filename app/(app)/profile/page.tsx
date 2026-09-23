import { getCurrentProfile } from "@/lib/current-user";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const profile = await getCurrentProfile();

  return (
    <main className="px-5 py-10 max-w-2xl">
      <h1 className="display text-2xl mb-6">Your profile</h1>
      {profile && <ProfileForm profile={profile} />}
    </main>
  );
}
