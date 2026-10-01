"use client";

import { useState, useTransition } from "react";
import { blockUser, unblockUser, reportUser } from "@/lib/actions/safety";
import { useDropdown } from "./useClickOutside";
import { KebabIcon } from "./icons";

export default function UserSafetyMenu({ userId, initiallyBlocked }: { userId: string; initiallyBlocked: boolean }) {
  const { open, setOpen, ref } = useDropdown<HTMLDivElement>();
  const [blocked, setBlocked] = useState(initiallyBlocked);
  const [pending, startTransition] = useTransition();

  function handleToggleBlock() {
    setOpen(false);
    startTransition(async () => {
      if (blocked) {
        await unblockUser(userId);
        setBlocked(false);
      } else {
        await blockUser(userId);
        setBlocked(true);
      }
    });
  }

  function handleReport() {
    setOpen(false);
    const reason = window.prompt("What's the issue with this account? This goes to the Super Admin.");
    if (!reason || !reason.trim()) return;
    startTransition(() => {
      reportUser(userId, reason);
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        aria-label="Safety options"
        className="btn btn-ghost !px-2.5"
      >
        <KebabIcon className="w-4 h-4" />
      </button>
      {open && (
        <div
          className="absolute right-0 mt-2 w-44 p-1.5 z-40 enter"
          style={{ background: "#ffffff", border: "1px solid #f0e2d3", borderRadius: 14, boxShadow: "0 16px 40px -12px rgba(33,23,16,0.28)" }}
        >
          <button onClick={handleToggleBlock} className="w-full text-left px-3 py-2 text-sm rounded-[8px] hover:bg-[var(--surface-2)]">
            {blocked ? "Unblock user" : "Block user"}
          </button>
          <button onClick={handleReport} className="w-full text-left px-3 py-2 text-sm rounded-[8px] hover:bg-[var(--surface-2)] text-[var(--danger)]">
            Report user
          </button>
        </div>
      )}
    </div>
  );
}
