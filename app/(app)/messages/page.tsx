import { MessagesIcon } from "@/components/icons";

// Right-pane default: shown on desktop when no conversation is open yet.
// Hidden entirely on mobile (the list itself fills the screen there).
export default function MessagesIndexPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-[var(--muted)] text-sm h-full p-5 text-center gap-2">
      <MessagesIcon className="w-8 h-8 opacity-40" />
      Select a conversation, or start a new one from the list.
    </div>
  );
}
