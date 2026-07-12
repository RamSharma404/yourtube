"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { MessageSquare, Pause, Play, SkipForward, X } from "lucide-react";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";

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

  const { user, setUser } = useUser();

  useEffect(() => {
    setWatchBlocked(false);
    setPaused(false);
  }, [video?._id]);

  const watchLimitLabel =
    watchLimitSeconds == null ? "unlimited" : `${Math.floor(watchLimitSeconds / 60)} minutes`;

  useEffect(() => {
    const element = videoRef.current;
    if (!element) return;

    let heartbeatInterval: NodeJS.Timeout;

    const startHeartbeat = () => {
      heartbeatInterval = setInterval(async () => {
        if (!user?._id || element.paused) return;
        
        try {
          const res = await axiosInstance.post("/user/watch-heartbeat", {
            userId: user._id,
            secondsWatched: 5,
          });
          // Instantly sync the global context with the live watch time!
          if (res.data.totalWatchSeconds !== undefined) {
            setUser({ ...user, totalWatchSeconds: res.data.totalWatchSeconds });
          }
        } catch (error: any) {
          if (error?.response?.status === 403) {
            clearInterval(heartbeatInterval);
            element.pause();
            setWatchBlocked(true);
            if (error.response.data.totalWatchSeconds !== undefined) {
              setUser({ ...user, totalWatchSeconds: error.response.data.totalWatchSeconds });
            }
          }
        }
      }, 5000);
    };

    const handlePlay = () => startHeartbeat();
    const handlePause = () => clearInterval(heartbeatInterval);

    element.addEventListener("play", handlePlay);
    element.addEventListener("pause", handlePause);

    return () => {
      clearInterval(heartbeatInterval);
      element.removeEventListener("play", handlePlay);
      element.removeEventListener("pause", handlePause);
    };
  }, [user?._id]);

  useEffect(() => {
    // If the user upgraded their plan while the video was blocked,
    // automatically unblock them and instantly resume playback!
    if (watchBlocked && user) {
      const isUnlimited = user.planWatchLimitSeconds === null;
      const hasTimeLeft = !isUnlimited && (user.totalWatchSeconds || 0) < user.planWatchLimitSeconds;
      
      if (isUnlimited || hasTimeLeft) {
        setWatchBlocked(false);
        if (videoRef.current) {
          videoRef.current.play();
          setPaused(false);
        }
      }
    }
  }, [user?.planWatchLimitSeconds, user?.totalWatchSeconds, watchBlocked, user]);

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
      // Browsers often block window.close(), so we redirect to home as a fallback
      try {
        window.close();
      } catch (e) {}
      window.location.href = "/";
      return;
    }

    if (zone === "left" && taps === 3) {
      onOpenComments?.();
    }
  };

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-black group">
      <video
        ref={videoRef}
        className="h-full w-full"
        controls
        controlsList="nodownload"
        poster={`/placeholder.svg?height=480&width=854`}
      >
        <source
          src={`${process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL}/${video?.filepath}`}
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>

      {/* Leave the bottom strip free so the native video controls stay clickable */}
      <div className="absolute inset-x-0 top-0 bottom-[80px] grid grid-cols-3 pointer-events-auto">
        {(["left", "center", "right"] as const).map((zone) => (
          <TapZone key={zone} zone={zone} onAction={handleTapAction} />
        ))}
      </div>

      {watchBlocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center text-white z-50">
          <div className="max-w-md space-y-4">
            <h3 className="text-3xl font-bold text-red-500">Watch limit reached</h3>
            <p className="text-lg">
              Your current plan's total watch time quota has been exhausted.
            </p>
            <p className="text-sm text-white/70">
              Upgrade your plan to continue watching videos without interruptions!
            </p>
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
    
    // Trigger the action immediately so the user gets instant feedback
    onAction(zone, tapCountRef.current);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Reset the tap counter after 400ms of inactivity
    timeoutRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 400);
  };

  return <button type="button" className="h-full w-full cursor-pointer bg-transparent" onClick={handleClick} />;
}
