import Avatar from "./Avatar";
import RoleTag from "./RoleTag";
import StartConversationButton from "@/app/(app)/users/[id]/StartConversationButton";
import type { Profile } from "@/types/database";

export default function UserProfileCard({ user }: { user: Profile }) {
  return (
    <>
      <div className="card p-6 flex items-center gap-4">
        <Avatar url={user.avatar_url} name={user.username} size={64} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-medium">{user.full_name || user.username}</h1>
            <RoleTag role={user.role} />
          </div>
          <p className="text-sm text-[var(--muted)]">@{user.username}</p>
          <p className="text-sm text-[var(--muted)] truncate">{user.email}</p>
        </div>
        <StartConversationButton userId={user.id} />
      </div>

      {user.bio && (
        <div className="card p-6 mt-4">
          <h2 className="text-sm font-medium text-[var(--muted)] mb-2">About</h2>
          <p>{user.bio}</p>
        </div>
      )}
    </>
  );
}
