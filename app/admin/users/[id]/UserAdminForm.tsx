"use client";

import { useActionState } from "react";
import { adminUpdateProfile, adminSetPassword, adminSetAvatar, adminGrantSuperAdmin, adminDeleteUser } from "@/lib/actions/admin";
import type { ActionState } from "@/lib/actions/auth";
import type { Profile } from "@/types/database";
import Avatar from "@/components/Avatar";
import { useState } from "react";
import Spinner from "@/components/Spinner";

function DeleteUserButton({ userId, username }: { userId: string; username: string }) {
  const [state, action, pending] = useActionState(adminDeleteUser, initialState);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="card p-6 border-[var(--danger)]">
      <p className="text-sm font-medium text-[var(--danger)] mb-1">Delete this account</p>
      <p className="text-sm text-[var(--muted)] mb-3">
        Permanently deletes @{username} and all their messages. No password confirmation needed — Super Admin action.
      </p>
      {!confirming ? (
        <button type="button" onClick={() => setConfirming(true)} className="btn btn-ghost text-[var(--danger)]">
          Delete account
        </button>
      ) : (
        <form action={action} className="space-y-3">
          <input type="hidden" name="userId" value={userId} />
          <p className="text-sm">Are you sure? This can't be undone.</p>
          {state.error && <p className="text-sm text-[var(--danger)]">{state.error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className="btn btn-primary bg-[var(--danger)]">
              {pending && <Spinner />} {pending ? "Deleting…" : "Yes, permanently delete"}
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="btn btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

const initialState: ActionState = {};

export default function UserAdminForm({ user }: { user: Profile }) {
  const [profileState, profileAction, profilePending] = useActionState(adminUpdateProfile, initialState);
  const [pwState, pwAction, pwPending] = useActionState(adminSetPassword, initialState);
  const [avatarState, avatarAction, avatarPending] = useActionState(adminSetAvatar, initialState);
  const [promoteState, promoteAction, promotePending] = useActionState(adminGrantSuperAdmin, initialState);

  return (
    <div className="space-y-6">
      <form action={avatarAction} className="card p-6 flex items-center gap-4">
        <input type="hidden" name="userId" value={user.id} />
        <Avatar url={user.avatar_url} name={user.username} size={56} />
        <input type="file" name="avatar" accept="image/*" className="text-sm flex-1" />
        <button type="submit" disabled={avatarPending} className="btn btn-primary">
          {avatarPending && <Spinner />} {avatarPending ? "Uploading…" : "Upload"}
        </button>
        {avatarState.error && <p className="text-sm text-[var(--danger)]">{avatarState.error}</p>}
      </form>

      <form action={profileAction} className="card p-6 space-y-3">
        <input type="hidden" name="userId" value={user.id} />
        <div>
          <label className="text-sm mb-1 block">Full name</label>
          <input name="fullName" defaultValue={user.full_name ?? ""} required className="input" />
        </div>
        <div>
          <label className="text-sm mb-1 block">Username</label>
          <input name="username" defaultValue={user.username} required className="input" />
        </div>
        <div>
          <label className="text-sm mb-1 block">Email (permanent — cannot be changed)</label>
          <input value={user.email} disabled className="input opacity-60 cursor-not-allowed" />
        </div>
        <div>
          <label className="text-sm mb-1 block">Role / tag</label>
          <input name="role" defaultValue={user.role} className="input" placeholder="user, moderator, super_admin…" />
        </div>
        <div>
          <label className="text-sm mb-1 block">Bio</label>
          <textarea name="bio" defaultValue={user.bio ?? ""} rows={3} className="input" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked={user.is_active} />
          Account active
        </label>

        {profileState.error && <p className="text-sm text-[var(--danger)]">{profileState.error}</p>}
        {profileState.success && <p className="text-sm text-[var(--accent)]">Saved.</p>}

        <button type="submit" disabled={profilePending} className="btn btn-primary">
          {profilePending && <Spinner />} {profilePending ? "Saving…" : "Save changes"}
        </button>
      </form>

      <form action={pwAction} className="card p-6 space-y-3">
        <input type="hidden" name="userId" value={user.id} />
        <label className="text-sm mb-1 block">Set a new password for this user</label>
        <input name="password" type="password" minLength={8} required className="input" />
        {pwState.error && <p className="text-sm text-[var(--danger)]">{pwState.error}</p>}
        {pwState.success && <p className="text-sm text-[var(--accent)]">Password updated.</p>}
        <button type="submit" disabled={pwPending} className="btn btn-ghost">
          {pwPending && <Spinner />} {pwPending ? "Updating…" : "Update password"}
        </button>
      </form>

      {user.role !== "super_admin" && (
        <form action={promoteAction} className="card p-6">
          <input type="hidden" name="userId" value={user.id} />
          <p className="text-sm text-[var(--muted)] mb-3">
            Grant this account full Super Admin access. This cannot be undone from this screen.
          </p>
          {promoteState.error && <p className="text-sm text-[var(--danger)] mb-2">{promoteState.error}</p>}
          <button type="submit" disabled={promotePending} className="btn btn-ghost border-[var(--danger)] text-[var(--danger)]">
            {promotePending && <Spinner />} {promotePending ? "Granting…" : "Make Super Admin"}
          </button>
        </form>
      )}

      {user.role !== "super_admin" && <DeleteUserButton userId={user.id} username={user.username} />}
    </div>
  );
}
