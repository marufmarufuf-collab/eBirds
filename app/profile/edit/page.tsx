import Navbar from "@/components/Navbar";
import { getCurrentProfile } from "@/lib/current-user";
import { redirect } from "next/navigation";
import ProfileEditForm from "./ProfileEditForm";

export default async function EditProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 py-10">
        <h1 className="display text-2xl mb-6">Edit profile</h1>
        <ProfileEditForm profile={profile} />
      </main>
    </>
  );
}
