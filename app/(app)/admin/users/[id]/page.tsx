import { getUser } from "@/lib/actions/admin";
import { relativeFromNow } from "@/lib/format-date";
import { notFound } from "next/navigation";
import UserAdminForm from "./UserAdminForm";

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser(id);
  if (!user) notFound();

  return (
    <>
      <h1 className="display text-2xl mb-1">Manage {user.username}</h1>
      <p className="text-sm text-[var(--muted)] mb-6">Last seen: {relativeFromNow(user.last_seen_at)}</p>
      <UserAdminForm user={user} />
    </>
  );
}
