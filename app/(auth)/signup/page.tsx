"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp, type ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <>
      <h2 className="text-lg font-medium mb-1">Create your account</h2>
      <p className="text-sm text-[var(--muted)] mb-5">We'll email you a 6-digit code to confirm it's really you.</p>

      <form action={formAction} className="space-y-3">
        <div>
          <label className="text-sm mb-1 block">Email</label>
          <input name="email" type="email" required className="input" placeholder="you@gmail.com" />
        </div>
        <div>
          <label className="text-sm mb-1 block">Password</label>
          <input name="password" type="password" required minLength={8} className="input" placeholder="At least 8 characters" />
        </div>

        {state.error && <p className="text-sm text-[var(--danger)]">{state.error}</p>}

        <button type="submit" disabled={pending} className="btn btn-primary w-full">
          {pending ? "Creating account…" : "Sign up"}
        </button>
      </form>

      <p className="text-sm text-[var(--muted)] mt-5 text-center">
        Already have an account? <Link href="/login" className="text-[var(--ink)] underline">Log in</Link>
      </p>
    </>
  );
}
