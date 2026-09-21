"use client";

import { useActionState } from "react";
import { updatePassword, type ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};

export default function UpdatePasswordPage() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);

  return (
    <>
      <h2 className="text-lg font-medium mb-1">Set a new password</h2>
      <form action={formAction} className="space-y-3 mt-4">
        <input name="password" type="password" required minLength={8} className="input" placeholder="New password" />
        {state.error && <p className="text-sm text-[var(--danger)]">{state.error}</p>}
        <button type="submit" disabled={pending} className="btn btn-primary w-full">
          {pending ? "Saving…" : "Update password"}
        </button>
      </form>
    </>
  );
}
