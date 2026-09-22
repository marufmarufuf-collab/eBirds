"use client";

import { useActionState } from "react";
import { changeOwnPassword } from "@/lib/actions/profile";
import { signOut } from "@/lib/actions/auth";
import type { ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};

export default function SettingsForm({ email }: { email: string }) {
  const [pwState, pwAction, pwPending] = useActionState(changeOwnPassword, initialState);

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
          {pwPending ? "Updating…" : "Update password"}
        </button>
      </form>

      <form action={signOut} className="card p-6">
        <p className="text-sm text-[var(--muted)] mb-3">Sign out of your account on this device.</p>
        <button className="btn btn-ghost">Log out</button>
      </form>
    </div>
  );
}
