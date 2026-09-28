"use client";

import { useActionState, useRef, useTransition } from "react";
import ClickableAvatar from "./ClickableAvatar";
import Spinner from "./Spinner";
import { compressImage } from "@/lib/image-compress";
import type { ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};

// Picking a photo uploads it immediately — no separate "Upload" button.
// That button used to sit in a row with the native file-picker text, which
// reliably overflowed narrow phone screens and pushed itself off-screen.
export default function AvatarUploadForm({
  action,
  userId,
  url,
  name,
  isOwn,
  hiddenFields,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  userId: string;
  url: string | null;
  name: string;
  isOwn: boolean;
  hiddenFields?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [, startTransition] = useTransition();

  // Shrink the photo first (camera photos are several MB), then submit it
  // ourselves so the smaller file is what actually gets uploaded.
  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file || !formRef.current) return;
    const small = await compressImage(file);
    const fd = new FormData(formRef.current);
    fd.set("avatar", small);
    input.value = "";
    startTransition(() => formAction(fd));
  }

  return (
    <form ref={formRef} action={formAction} className="card p-6 flex items-center gap-4">
      {hiddenFields}
      <ClickableAvatar userId={userId} url={url} name={name} size={56} isOwn={isOwn} />
      <div className="flex-1 min-w-0">
        <label htmlFor={`avatar-input-${userId}`} className="btn btn-ghost !px-3 inline-flex" aria-disabled={pending}>
          {pending && <Spinner />} {pending ? "Uploading…" : "Change photo"}
        </label>
        <input
          id={`avatar-input-${userId}`}
          type="file"
          name="avatar"
          accept="image/*"
          className="hidden"
          disabled={pending}
          onChange={handleChange}
        />
        {state.error && <p className="text-sm text-[var(--danger)] mt-1">{state.error}</p>}
        {state.success && <p className="text-sm text-[var(--accent)] mt-1">Photo updated.</p>}
      </div>
    </form>
  );
}
