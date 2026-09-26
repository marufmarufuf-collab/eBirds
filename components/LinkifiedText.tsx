"use client";

import { useState } from "react";
import { splitLinks } from "@/lib/linkify";

// Renders message text with URLs as tappable spans. Tapping one asks for
// confirmation before opening a new tab, rather than navigating instantly —
// a small speed bump against accidentally-opened or malicious links.
export default function LinkifiedText({ text }: { text: string }) {
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const parts = splitLinks(text);

  function normalize(url: string) {
    return url.startsWith("http") ? url : `https://${url}`;
  }

  return (
    <>
      {parts.map((part, i) =>
        part.type === "link" ? (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPendingUrl(normalize(part.value));
            }}
            className="underline break-all"
          >
            {part.value}
          </button>
        ) : (
          <span key={i}>{part.value}</span>
        )
      )}

      {pendingUrl && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setPendingUrl(null);
          }}
          className="fixed inset-0 z-[110] bg-black/50 backdrop-fade flex items-center justify-center p-4"
        >
          <div onClick={(e) => e.stopPropagation()} className="card p-5 max-w-sm w-full enter">
            <p className="text-sm font-medium mb-1">Open this link?</p>
            <p className="text-xs text-[var(--muted)] break-all mb-4">{pendingUrl}</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setPendingUrl(null)} className="btn btn-ghost">Cancel</button>
              <a
                href={pendingUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setPendingUrl(null)}
                className="btn btn-primary"
              >
                Open link
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
