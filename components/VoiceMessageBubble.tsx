"use client";

import { useEffect, useRef, useState } from "react";
import { PlayIcon, PauseIcon } from "./icons";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VoiceMessageBubble({ url, duration, mine }: { url: string; duration: number | null; mine: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0-1
  const [currentTime, setCurrentTime] = useState(0);
  const [knownDuration, setKnownDuration] = useState(duration ?? 0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    function onTimeUpdate() {
      if (!audio || !audio.duration || isNaN(audio.duration)) return;
      setCurrentTime(audio.currentTime);
      setProgress(audio.currentTime / audio.duration);
    }
    function onLoadedMetadata() {
      if (!audio) return;
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setKnownDuration(audio.duration);
      }
    }
    function onEnded() {
      setPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    }

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    if (!audio || !knownDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * knownDuration;
    setProgress(ratio);
    setCurrentTime(audio.currentTime);
  }

  const displayTime = playing || currentTime > 0 ? currentTime : knownDuration;

  return (
    <div className="flex items-center gap-2.5 min-w-[180px]">
      <audio ref={audioRef} src={url} preload="metadata" />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
          mine ? "bg-white/20 hover:bg-white/30" : "bg-[var(--accent-soft)] hover:bg-[var(--accent-soft)]"
        }`}
      >
        {playing ? <PauseIcon /> : <PlayIcon className={mine ? "" : "text-[var(--accent-dark)]"} />}
      </button>
      <div className="flex-1 min-w-0">
        <div
          onClick={seek}
          className={`h-1.5 rounded-full cursor-pointer relative ${mine ? "bg-white/25" : "bg-[var(--line-strong)]"}`}
        >
          <div
            className={`h-full rounded-full ${mine ? "bg-white" : "bg-[var(--accent)]"}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className={`text-[10px] mt-1 ${mine ? "text-white/75" : "text-[var(--muted)]"}`}>
          {formatTime(displayTime)}
        </p>
      </div>
    </div>
  );
}
