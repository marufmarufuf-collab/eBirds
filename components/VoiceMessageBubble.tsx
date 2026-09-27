"use client";

import { useRef, useState } from "react";
import { useVoicePlayer } from "@/lib/voice-player-context";
import { PlayIcon, PauseIcon } from "./icons";

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VoiceMessageBubble({
  id,
  url,
  duration,
  mine,
}: {
  id: string;
  url: string;
  duration: number | null;
  mine: boolean;
}) {
  const { activeId, playing, currentTime, duration: liveDuration, play, pause, seek } = useVoicePlayer();
  const isActive = activeId === id;
  const barRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [dragRatio, setDragRatio] = useState(0);

  const knownDuration = (isActive && liveDuration) || duration || 0;
  const shownRatio = dragging ? dragRatio : isActive && knownDuration ? currentTime / knownDuration : 0;
  const shownTime = dragging ? dragRatio * knownDuration : isActive ? currentTime : 0;

  function toggle() {
    if (isActive && playing) pause();
    else play(id, url);
  }

  function ratioFromEvent(e: React.PointerEvent<HTMLDivElement>): number {
    const rect = barRef.current!.getBoundingClientRect();
    return Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
    setDragRatio(ratioFromEvent(e));
  }
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    setDragRatio(ratioFromEvent(e));
  }
  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging || !knownDuration) {
      setDragging(false);
      return;
    }
    const ratio = ratioFromEvent(e);
    setDragging(false);
    if (isActive) {
      seek(ratio * knownDuration);
    } else {
      // Not the active track yet — start it, then jump to the tapped point
      // once its metadata is loaded.
      play(id, url);
      setTimeout(() => seek(ratio * knownDuration), 60);
    }
  }

  return (
    <div className="flex items-center gap-2.5 min-w-[190px]">
      <button
        type="button"
        onClick={toggle}
        aria-label={isActive && playing ? "Pause" : "Play"}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
          mine ? "bg-white/20 hover:bg-white/30" : "bg-[var(--accent-soft)] hover:bg-[var(--accent-soft)]"
        }`}
      >
        {isActive && playing ? <PauseIcon /> : <PlayIcon className={mine ? "" : "text-[var(--accent-dark)]"} />}
      </button>
      <div className="flex-1 min-w-0">
        <div
          ref={barRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ touchAction: "none" }}
          className={`h-2 rounded-full cursor-pointer relative ${mine ? "bg-white/25" : "bg-[var(--line-strong)]"}`}
        >
          <div
            className={`h-full rounded-full ${mine ? "bg-white" : "bg-[var(--accent)]"}`}
            style={{ width: `${shownRatio * 100}%`, transition: dragging ? "none" : "width 0.1s linear" }}
          />
          <div
            className={`absolute top-1/2 w-3 h-3 rounded-full -translate-y-1/2 -translate-x-1/2 shadow ${mine ? "bg-white" : "bg-[var(--accent)]"}`}
            style={{ left: `${shownRatio * 100}%` }}
          />
        </div>
        <p className={`text-[10px] mt-1.5 ${mine ? "text-white/75" : "text-[var(--muted)]"}`}>
          {formatTime(shownTime)}
          {knownDuration ? ` / ${formatTime(knownDuration)}` : ""}
        </p>
      </div>
    </div>
  );
}
