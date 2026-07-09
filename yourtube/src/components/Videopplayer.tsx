"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { MessageSquare, Pause, Play, SkipForward, X } from "lucide-react";

interface VideoPlayerProps {
  video: {
    _id: string;
    videotitle: string;
    filepath: string;
  };
  watchLimitSeconds?: number | null;
  nextVideoId?: string | null;
  onOpenComments?: () => void;
}

export default function VideoPlayer({
  video,
  watchLimitSeconds,
  nextVideoId,
  onOpenComments,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [watchBlocked, setWatchBlocked] = useState(false);
  const watchLimitLabel =
    watchLimitSeconds == null ? "unlimited" : `${Math.floor(watchLimitSeconds / 60)} minutes`;

  useEffect(() => {
    const element = videoRef.current;
    if (!element || watchLimitSeconds == null) {
      return;
    }

    const handleTimeUpdate = () => {
      if (element.currentTime >= watchLimitSeconds) {
        element.pause();
        setWatchBlocked(true);
      }
    };

    element.addEventListener("timeupdate", handleTimeUpdate);
    return () => element.removeEventListener("timeupdate", handleTimeUpdate);
  }, [watchLimitSeconds]);

  const seekBy = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + seconds);
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setPaused(false);
    } else {
      videoRef.current.pause();
      setPaused(true);
    }
  };

  const handleTapAction = (zone: "left" | "center" | "right", taps: number) => {
    if (zone === "right" && taps === 2) {
      seekBy(10);
      return;
    }

    if (zone === "left" && taps === 2) {
      seekBy(-10);
      return;
    }

    if (zone === "center" && taps === 1) {
      togglePlayPause();
      return;
    }

    if (zone === "center" && taps === 3 && nextVideoId) {
      window.location.href = `/watch/${nextVideoId}`;
      return;
    }

    if (zone === "right" && taps === 3) {
      window.close();
      window.location.href = "/";
      return;
    }

    if (zone === "left" && taps === 3) {
      onOpenComments?.();
    }
  };

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-black">
      <video
        ref={videoRef}
        className="h-full w-full"
        controls
        poster={`/placeholder.svg?height=480&width=854`}
      >
        <source
          src={`${process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL}/${video?.filepath}`}
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>

      <div className="absolute inset-0 grid grid-cols-3">
        {(["left", "center", "right"] as const).map((zone) => (
          <TapZone key={zone} zone={zone} onAction={handleTapAction} />
        ))}
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 flex gap-2 text-white">
        <GestureChip icon={<SkipForward className="h-4 w-4" />} label="Double tap sides: 10s seek" />
        <GestureChip icon={paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />} label="Single center tap: play/pause" />
        <GestureChip icon={<MessageSquare className="h-4 w-4" />} label="Triple left: comments" />
        <GestureChip icon={<X className="h-4 w-4" />} label="Triple right: close" />
      </div>

      {watchBlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-center text-white">
          <div className="max-w-md space-y-3">
            <h3 className="text-2xl font-semibold">Watch limit reached</h3>
            <p>
              Your current plan allows {watchLimitLabel} of viewing on this video.
            </p>
            <p className="text-sm text-white/70">Upgrade your plan from the profile menu to continue without interruptions.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function TapZone({
  zone,
  onAction,
}: {
  zone: "left" | "center" | "right";
  onAction: (zone: "left" | "center" | "right", taps: number) => void;
}) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapCountRef = useRef(0);

  const handleClick = () => {
    tapCountRef.current += 1;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onAction(zone, tapCountRef.current);
      tapCountRef.current = 0;
    }, 260);
  };

  return <button type="button" className="h-full w-full cursor-pointer bg-transparent" onClick={handleClick} />;
}

function GestureChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="hidden rounded-full bg-black/60 px-3 py-1 text-xs backdrop-blur md:flex md:items-center md:gap-2">
      {icon}
      <span>{label}</span>
    </div>
  );
}
