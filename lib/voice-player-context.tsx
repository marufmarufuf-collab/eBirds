"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type VoiceContextValue = {
  activeId: string | null;
  playing: boolean;
  currentTime: number;
  duration: number;
  play: (id: string, url: string) => void;
  resume: () => void;
  pause: () => void;
  seek: (time: number) => void;
  close: () => void;
};

const VoiceContext = createContext<VoiceContextValue | null>(null);

// One shared <audio> element per chat screen — only one voice message plays
// at a time, matching how every messaging app handles this. Pausing keeps
// the position (pressing play again resumes where it left off); only
// close() (the mini-player's X) forgets the position and fully resets.
export function VoicePlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const activeUrlRef = useRef<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const play = useCallback((id: string, url: string) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (activeId !== id || activeUrlRef.current !== url) {
      activeUrlRef.current = url;
      audio.src = url;
      audio.currentTime = 0;
      setCurrentTime(0);
      setActiveId(id);
    }
    audio.play().catch(() => {});
    setPlaying(true);
  }, [activeId]);

  const resume = useCallback(() => {
    audioRef.current?.play().catch(() => {});
    setPlaying(true);
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
  }, []);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const close = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    activeUrlRef.current = null;
    setActiveId(null);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  return (
    <VoiceContext.Provider value={{ activeId, playing, currentTime, duration, play, resume, pause, seek, close }}>
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          if (isFinite(e.currentTarget.duration)) setDuration(e.currentTarget.duration);
        }}
        onEnded={() => setPlaying(false)}
      />
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoicePlayer() {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error("useVoicePlayer must be used inside a VoicePlayerProvider");
  return ctx;
}
