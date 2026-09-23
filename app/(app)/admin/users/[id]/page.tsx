import { getUser } from "@/lib/actions/admin";
import { notFound } from "next/navigation";
import UserAdminForm from "./UserAdminForm";

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser(id);
  if (!user) notFound();

  return (
    <>
      <h1 className="display text-2xl mb-6">Manage {user.username}</h1>
      <UserAdminForm user={user} />
    </>
  );
}
