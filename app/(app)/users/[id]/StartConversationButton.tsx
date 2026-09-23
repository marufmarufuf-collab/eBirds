"use client";

import { useTransition } from "react";
import { startConversation } from "@/lib/actions/messaging";
import Spinner from "@/components/Spinner";

export default function StartConversationButton({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => startConversation(userId))}
      disabled={pending}
      className="btn btn-primary"
    >
      {pending && <Spinner />} {pending ? "Opening…" : "Message"}
    </button>
  );
}
