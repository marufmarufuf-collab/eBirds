"use client";

import { useActionState } from "react";
import { updateProfile, uploadAvatar } from "@/lib/actions/profile";
import type { ActionState } from "@/lib/actions/auth";
import type { Profile } from "@/types/database";
import AvatarUploadForm from "@/components/AvatarUploadForm";
import RoleTag from "@/components/RoleTag";
import Spinner from "@/components/Spinner";

const initialState: ActionState = {};

export default function ProfileForm({ profile }: { profile: Profile }) {
  const [infoState, infoAction, infoPending] = useActionState(updateProfile, initialState);

  return (
    <div className="space-y-6">
      <AvatarUploadForm action={uploadAvatar} userId={profile.id} url={profile.avatar_url} name={profile.username} isOwn />

      <form action={infoAction} className="card p-6 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <RoleTag role={profile.role} />
        </div>
        <div>
          <label className="text-sm mb-1 block">Full name</label>
          <input name="fullName" defaultValue={profile.full_name ?? ""} required className="input" />
        </div>
        <div>
          <label className="text-sm mb-1 block">Username</label>
          <input name="username" defaultValue={profile.username} required className="input" />
        </div>
        <div>
          <label className="text-sm mb-1 block">Email (permanent)</label>
          <input value={profile.email} disabled className="input opacity-60 cursor-not-allowed" />
        </div>
        <div>
          <label className="text-sm mb-1 block">Bio</label>
          <textarea name="bio" defaultValue={profile.bio ?? ""} rows={4} className="input" />
        </div>

        {infoState.error && <p className="text-sm text-[var(--danger)]">{infoState.error}</p>}
        {infoState.success && <p className="text-sm text-[var(--accent)]">Saved.</p>}

        <button type="submit" disabled={infoPending} className="btn btn-primary">
          {infoPending && <Spinner />} {infoPending ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
