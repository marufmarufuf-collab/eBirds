"use client";

import { Suspense, useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { verifyCode, resendCode, type ActionState } from "@/lib/actions/auth";
import Spinner from "@/components/Spinner";

const initialState: ActionState = {};

function VerifyForm() {
  const params = useSearchParams();
  const email = params.get("email") || "";
  const [state, formAction, pending] = useActionState(verifyCode, initialState);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");

  return (
    <>
      <p className="text-sm text-[var(--muted)] mb-5">
        We sent a 6-digit code to <span className="font-medium text-[var(--ink)]">{email || "your email"}</span>.
      </p>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="email" value={email} />
        <div>
          <label className="text-sm mb-1 block">Verification code</label>
          <input
            name="code"
            inputMode="numeric"
            maxLength={10}
            required
            className="input text-center text-xl tracking-[0.3em]"
            placeholder="000000"
          />
        </div>

        {state.error && <p className="text-sm text-[var(--danger)]">{state.error}</p>}

        <button type="submit" disabled={pending} className="btn btn-primary w-full">
          {pending && <Spinner />} {pending ? "Verifying…" : "Verify & continue"}
        </button>
      </form>

      <button
        type="button"
        disabled={resendState !== "idle"}
        onClick={async () => {
          setResendState("sending");
          await resendCode(email);
          setResendState("sent");
        }}
        className="btn btn-ghost w-full mt-3"
      >
        {resendState === "sent" ? "Code resent" : "Resend code"}
      </button>
    </>
  );
}

export default function VerifyPage() {
  return (
    <>
      <h2 className="text-lg font-medium mb-1">Check your email</h2>
      <Suspense fallback={<div className="h-56" />}>
        <VerifyForm />
      </Suspense>
    </>
  );
}
