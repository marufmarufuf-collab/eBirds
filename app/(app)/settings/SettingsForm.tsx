"use client";

import { useActionState, useState } from "react";
import { changeOwnPassword } from "@/lib/actions/profile";
import { deleteOwnAccount, signOut } from "@/lib/actions/auth";
import type { ActionState } from "@/lib/actions/auth";
import Spinner from "@/components/Spinner";

const initialState: ActionState = {};

export default function SettingsForm({ email }: { email: string }) {
  const [pwState, pwAction, pwPending] = useActionState(changeOwnPassword, initialState);
  const [delState, delAction, delPending] = useActionState(deleteOwnAccount, initialState);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <label className="text-sm mb-1 block text-[var(--muted)]">Account email (permanent)</label>
        <p className="text-sm">{email}</p>
      </div>

      <form action={pwAction} className="card p-6 space-y-3">
        <label className="text-sm mb-1 block">Change password</label>
        <input name="password" type="password" minLength={8} required className="input" placeholder="New password" />
        {pwState.error && <p className="text-sm text-[var(--danger)]">{pwState.error}</p>}
        {pwState.success && <p className="text-sm text-[var(--accent)]">Password updated.</p>}
        <button type="submit" disabled={pwPending} className="btn btn-primary">
          {pwPending && <Spinner />} {pwPending ? "Updating…" : "Update password"}
        </button>
      </form>

      <form action={signOut} className="card p-6">
        <p className="text-sm text-[var(--muted)] mb-3">Sign out of your account on this device.</p>
        <button className="btn btn-ghost">Log out</button>
      </form>

      <div className="card p-6 border-[var(--danger)]">
        <p className="text-sm font-medium text-[var(--danger)] mb-1">Delete account</p>
        <p className="text-sm text-[var(--muted)] mb-3">
          This permanently deletes your account and all your messages. This can't be undone.
        </p>

        {!confirmingDelete ? (
          <button type="button" onClick={() => setConfirmingDelete(true)} className="btn btn-ghost text-[var(--danger)]">
            Delete my account
          </button>
        ) : (
          <form action={delAction} className="space-y-3">
            <label className="text-sm block">Enter your password to confirm</label>
            <input name="password" type="password" required className="input" placeholder="Password" autoFocus />
            {delState.error && <p className="text-sm text-[var(--danger)]">{delState.error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={delPending} className="btn btn-primary bg-[var(--danger)]">
                {delPending && <Spinner />} {delPending ? "Deleting…" : "Permanently delete my account"}
              </button>
              <button type="button" onClick={() => setConfirmingDelete(false)} className="btn btn-ghost">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
