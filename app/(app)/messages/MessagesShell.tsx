"use client";

import { usePathname } from "next/navigation";

// Master-detail layout: the conversation list stays mounted across
// navigations (Next.js reuses this layout, so switching chats never
// remounts the list — no reload, no flicker). On mobile there's only room
// for one pane at a time, so we show the list OR the open chat based on
// the URL, never both.
export default function MessagesShell({ list, children }: { list: React.ReactNode; children: React.ReactNode }) {
  const pathname = usePathname();
  const inConversation = pathname !== "/messages";

  return (
    <div className="flex" style={{ height: "calc(100dvh - 4rem - env(safe-area-inset-top, 0px))" }}>
      <div className={`${inConversation ? "hidden" : "flex"} md:flex md:w-96 border-r shrink-0 flex-col h-full overflow-y-auto`}>
        {list}
      </div>
      <div className={`${inConversation ? "flex" : "hidden"} md:flex flex-1 flex-col h-full overflow-hidden`}>
        {children}
      </div>
    </div>
  );
}
