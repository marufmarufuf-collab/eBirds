"use client";

import { useVoicePlayer } from "@/lib/voice-player-context";
import { PlayIcon, PauseIcon, XIcon, MicIcon } from "./icons";

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Stays visible for as long as a voice message is loaded (playing OR
// paused) — pressing X is the only thing that fully stops it and forgets
// the position. Lets you keep listening or scrub while scrolled away from
// the actual message bubble.
export default function MiniVoicePlayerBar() {
  const { activeId, playing, currentTime, duration, resume, pause, seek, close } = useVoicePlayer();
  if (!activeId) return null;

  const ratio = duration ? currentTime / duration : 0;

  function handleBarClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const r = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    seek(r * duration);
  }

  return (
    <div className="flex items-center gap-2.5 px-3 py-2 border-b bg-[var(--surface-2)] enter">
      <button onClick={close} aria-label="Close player" className="btn btn-ghost !p-1.5 !rounded-full shrink-0">
        <XIcon />
      </button>
      <span className="text-[var(--accent-dark)] shrink-0">
        <MicIcon />
      </span>
      <button
        onClick={() => (playing ? pause() : resume())}
        aria-label={playing ? "Pause" : "Play"}
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-[var(--accent-soft)] text-[var(--accent-dark)]"
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>
      <div onClick={handleBarClick} className="flex-1 h-1.5 rounded-full bg-[var(--line-strong)] cursor-pointer relative">
        <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${ratio * 100}%` }} />
      </div>
      <span className="text-xs text-[var(--muted)] shrink-0 tabular-nums">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
    </div>
  );
}
