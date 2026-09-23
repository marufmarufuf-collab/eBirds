"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, type ActionState } from "@/lib/actions/auth";
import GoogleButton from "@/components/GoogleButton";
import Spinner from "@/components/Spinner";

const initialState: ActionState = {};

function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const params = useSearchParams();
  const next = params.get("next") || "/";

  return (
    <>
    <GoogleButton label="Continue with Google" />
    <div className="flex items-center gap-3 my-4 text-xs text-[var(--muted)]">
      <div className="flex-1 border-t" /> or <div className="flex-1 border-t" />
    </div>
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="next" value={next} />
      <div>
        <label className="text-sm mb-1 block">Email</label>
        <input name="email" type="email" required className="input" />
      </div>
      <div>
        <label className="text-sm mb-1 block">Password</label>
        <input name="password" type="password" required className="input" />
      </div>

      {state.error && <p className="text-sm text-[var(--danger)]">{state.error}</p>}

      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending && <Spinner />} {pending ? "Logging in…" : "Log in"}
      </button>
    </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <>
      <h2 className="text-lg font-medium mb-1">Log in</h2>
      <p className="text-sm text-[var(--muted)] mb-5">Welcome back.</p>

      <Suspense fallback={<div className="h-40" />}>
        <LoginForm />
      </Suspense>

      <div className="flex items-center justify-between text-sm text-[var(--muted)] mt-5">
        <Link href="/forgot-password" className="underline">Forgot password?</Link>
        <Link href="/signup" className="underline">Sign up</Link>
      </div>
    </>
  );
}
