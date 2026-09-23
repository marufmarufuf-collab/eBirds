import { createClient } from "@/lib/supabase/server";
import { getVerifiedUserId } from "@/lib/verified-user";
import { notFound } from "next/navigation";
import ModalOverlay from "@/components/ModalOverlay";
import UserProfileCard from "@/components/UserProfileCard";

// Intercepted: clicking a profile link from within the app renders THIS
// instead of navigating away — an instant overlay on top of whatever page
// you were on, like Telegram's profile popup. A direct link or refresh
// still gets the real full page at users/[id]/page.tsx.
export default async function UserProfileModal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  if (!userId || id === userId) return null;

  const { data: user } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (!user) notFound();

  return (
    <ModalOverlay>
      <UserProfileCard user={user} />
    </ModalOverlay>
  );
}
