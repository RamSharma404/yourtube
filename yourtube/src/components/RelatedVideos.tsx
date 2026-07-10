import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

interface RelatedVideosProps {
  videos: Array<{
    _id: string;
    videotitle: string;
    videochanel: string;
    views: number;
    createdAt: string;
    filepath: string;
  }>;
}

const formatDuration = (seconds: number) => {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

function RelatedVideoItem({ video }: { video: RelatedVideosProps["videos"][0] }) {
  const [duration, setDuration] = useState<number>(0);

  return (
    <Link href={`/watch/${video._id}`} className="flex gap-2 group">
      <div className="relative w-40 aspect-video bg-gray-100 rounded overflow-hidden flex-shrink-0">
        <video
          src={`${process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL}/${video.filepath}`}
          className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-200"
          muted
          preload="metadata"
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        />
        {duration > 0 && (
          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            {formatDuration(duration)}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm line-clamp-2 group-hover:text-blue-600">
          {video.videotitle}
        </h3>
        <p className="text-xs text-gray-600 mt-1">{video.videochanel}</p>
        <p className="text-xs text-gray-600">
          {video.views.toLocaleString()} views •{" "}
          {formatDistanceToNow(new Date(video.createdAt))} ago
        </p>
      </div>
    </Link>
  );
}

export default function RelatedVideos({ videos }: RelatedVideosProps) {
  return (
    <div className="space-y-2">
      {videos.map((video) => (
        <RelatedVideoItem key={video._id} video={video} />
      ))}
    </div>
  );
}
