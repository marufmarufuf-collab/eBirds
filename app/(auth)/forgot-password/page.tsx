"use client";

import { useActionState } from "react";
import { requestPasswordReset, type ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  return (
    <>
      <h2 className="text-lg font-medium mb-1">Reset your password</h2>
      <p className="text-sm text-[var(--muted)] mb-5">We'll email you a link to set a new one.</p>

      {state.success ? (
        <p className="text-sm">Check your email for a reset link.</p>
      ) : (
        <form action={formAction} className="space-y-3">
          <input name="email" type="email" required className="input" placeholder="you@gmail.com" />
          {state.error && <p className="text-sm text-[var(--danger)]">{state.error}</p>}
          <button type="submit" disabled={pending} className="btn btn-primary w-full">
            {pending ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </>
  );
}
