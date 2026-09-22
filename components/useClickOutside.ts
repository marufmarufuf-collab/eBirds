"use client";

import { useEffect, useRef, useState } from "react";

// A controlled dropdown hook: explicit open state + click-outside-to-close.
// Replaces native <details>/<summary>, whose click events can bubble
// unpredictably when a <button> or <form> sits inside the <summary>'s
// sibling content, making some clicks look like they "did nothing" the
// first time.
export function useDropdown<T extends HTMLElement>() {
  const [open, setOpen] = useState(false);
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return { open, setOpen, ref };
}
