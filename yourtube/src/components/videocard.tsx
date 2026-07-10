"use client";
import Link from "next/link";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Download } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import PremiumModal from "./PremiumModal";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";

export default function VideoCard({ video }: any) {
  const { user } = useUser();
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [duration, setDuration] = useState<number>(0);

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert("Please sign in to download videos");
      return;
    }

    setDownloading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/download/file/${video._id}?userId=${user._id}`
      );

      if (res.status === 403) {
        const data = await res.json();
        if (data.code === "LIMIT_REACHED") {
          setPremiumOpen(true);
        } else {
          alert(data.message);
        }
        return;
      }

      if (!res.ok) {
        alert("Failed to download video");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = video.filename || "video.mp4";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      alert("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <Link href={`/watch/${video?._id}`} className="group relative">
        <div className="space-y-3">
          <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
            <video
              src={`${process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL}/${video?.filepath}`}
              muted
              preload="metadata"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            />
            {duration > 0 && (
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                {formatDuration(duration)}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Avatar className="w-9 h-9 flex-shrink-0">
              <AvatarFallback>{video?.videochanel?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm line-clamp-2 transition-colors group-hover:text-red-500">
                {video?.videotitle}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{video?.videochanel}</p>
              <p className="text-sm text-muted-foreground">
                {video?.views?.toLocaleString()} views &bull;{" "}
                {formatDistanceToNow(new Date(video?.createdAt))} ago
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleDownload}
          disabled={downloading}
        >
          <Download className="w-4 h-4" />
        </Button>
      </Link>
      <PremiumModal isOpen={premiumOpen} onClose={() => setPremiumOpen(false)} />
    </>
  );
}
