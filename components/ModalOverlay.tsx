"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Generic full-screen overlay for intercepted routes: closing it just goes
// back in history, which lands you exactly where you clicked from — same
// feel as Telegram's profile popup.
export default function ModalOverlay({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") router.back();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <div
      onClick={() => router.back()}
      className="fixed inset-0 z-[90] bg-black/40 flex items-start sm:items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg mt-10 sm:mt-0 enter">
        <div className="flex justify-end mb-2">
          <button
            onClick={() => router.back()}
            className="btn btn-ghost !px-3 bg-[var(--surface)]"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
