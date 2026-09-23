import { createClient } from "@/lib/supabase/server";
import { getVerifiedUserId } from "@/lib/verified-user";
import { redirect, notFound } from "next/navigation";
import UserProfileCard from "@/components/UserProfileCard";

// Full-page fallback: used for a direct link or a hard refresh. Normal
// in-app clicks are intercepted into the overlay panel instead — see
// app/(app)/@modal/(.)users/[id]/page.tsx.
export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  if (!userId) redirect("/login");
  if (id === userId) redirect("/profile");

  const { data: user } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (!user) notFound();

  return (
    <main className="px-5 py-10 max-w-2xl">
      <UserProfileCard user={user} />
    </main>
  );
}
