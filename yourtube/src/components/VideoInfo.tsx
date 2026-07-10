import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  Clock,
  Download,
  MoreHorizontal,
  Share,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { useRouter } from "next/router";
import PremiumModal from "./PremiumModal";

const VideoInfo = ({ video }: any) => {
  const [likes, setlikes] = useState(video.Like || 0);
  const [dislikes, setDislikes] = useState(video.Dislike || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const { user } = useUser();
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const router = useRouter();

  // const user: any = {
  //   id: "1",
  //   name: "John Doe",
  //   email: "john@example.com",
  //   image: "https://github.com/shadcn.png?height=32&width=32",
  // };
  useEffect(() => {
    setlikes(video.Like || 0);
    setDislikes(video.Dislike || 0);
    setIsLiked(false);
    setIsDisliked(false);
  }, [video]);

  useEffect(() => {
    const handleviews = async () => {
      if (user) {
        try {
          return await axiosInstance.post(`/history/${video._id}`, {
            userId: user?._id,
          });
        } catch (error) {
          return console.log(error);
        }
      } else {
        return await axiosInstance.post(`/history/views/${video?._id}`);
      }
    };
    handleviews();
  }, [user]);
  const handleLike = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/like/${video._id}`, {
        userId: user?._id,
      });
      if (res.data.liked) {
        if (isLiked) {
          setlikes((prev: any) => prev - 1);
          setIsLiked(false);
        } else {
          setlikes((prev: any) => prev + 1);
          setIsLiked(true);
          if (isDisliked) {
            setDislikes((prev: any) => prev - 1);
            setIsDisliked(false);
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleWatchLater = async () => {
    try {
      const res = await axiosInstance.post(`/watch/${video._id}`, {
        userId: user?._id,
      });
      if (res.data.watchlater) {
        setIsWatchLater(!isWatchLater);
      } else {
        setIsWatchLater(false);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleDislike = async () => {
    if (!user) return;
    try {
      if (isDisliked) {
        setDislikes((prev: any) => prev - 1);
        setIsDisliked(false);
        return;
      }

      // Remove an existing like on the server before marking as disliked,
      // so stored like counts stay consistent.
      if (isLiked) {
        await axiosInstance.post(`/like/${video._id}`, {
          userId: user?._id,
        });
        setlikes((prev: any) => prev - 1);
        setIsLiked(false);
      }

      setDislikes((prev: any) => prev + 1);
      setIsDisliked(true);
    } catch (error) {
      console.log(error);
    }
  };

  const handleDownload = async () => {
    if (!user) return;
    try {
      const response = await axiosInstance.get(`/download/file/${video._id}?userId=${user._id}`, {
        responseType: "blob",
      });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${video.filename || video.videotitle}.mp4`;
      link.click();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Download failed. Upgrade your plan for unlimited downloads.";
      if (error?.response?.status === 403) {
        setShowPlanModal(true);
      }
      alert(message);
    }
  };

  const handleStartCall = () => {
    const roomId = `${video._id}-${Date.now().toString(36)}`;
    router.push(`/call/${roomId}?videoId=${video._id}`);
  };
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{video.videotitle}</h1>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
        {/* Channel Info & Subscribe */}
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 cursor-pointer">
            <AvatarFallback>{video.videochanel?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col mr-2">
            <h3 className="font-semibold text-base leading-tight cursor-pointer">{video.videochanel}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Creator on YourTube</p>
          </div>
          <Button className="rounded-full px-5 font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors">
            Subscribe
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide shrink-0">
          <div className="flex items-center bg-secondary hover:bg-secondary/80 transition-colors rounded-full overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-none rounded-l-full px-4 font-medium hover:bg-transparent"
              onClick={handleLike}
            >
              <ThumbsUp className={`w-5 h-5 mr-2 ${isLiked ? "fill-current" : ""}`} />
              {likes.toLocaleString()}
            </Button>
            <div className="w-px h-5 bg-border/50" />
            <Button
              variant="ghost"
              size="sm"
              className="rounded-none rounded-r-full px-3 hover:bg-transparent"
              onClick={handleDislike}
            >
              <ThumbsDown className={`w-5 h-5 ${isDisliked ? "fill-current" : ""}`} />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className={`bg-secondary hover:bg-secondary/80 transition-colors rounded-full px-4 font-medium ${
              isWatchLater ? "text-ring" : ""
            }`}
            onClick={handleWatchLater}
          >
            <Clock className="w-5 h-5 mr-2" />
            {isWatchLater ? "Saved" : "Watch Later"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="bg-secondary hover:bg-secondary/80 transition-colors rounded-full px-4 font-medium"
            onClick={handleStartCall}
          >
            <Share className="w-5 h-5 mr-2" />
            Watch together
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="bg-secondary hover:bg-secondary/80 transition-colors rounded-full px-4 font-medium"
            onClick={handleDownload}
          >
            <Download className="w-5 h-5 mr-2" />
            Download
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="bg-secondary hover:bg-secondary/80 transition-colors rounded-full w-9 h-9 shrink-0"
          >
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>
      <div className="bg-muted rounded-lg p-4">
        <div className="flex gap-4 text-sm font-medium mb-2">
          <span>{video.views.toLocaleString()} views</span>
          <span>{formatDistanceToNow(new Date(video.createdAt))} ago</span>
        </div>
        <div className={`text-sm ${showFullDescription ? "" : "line-clamp-3"}`}>
          <p>
            Sample video description. This would contain the actual video
            description from the database.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 p-0 h-auto font-medium"
          onClick={() => setShowFullDescription(!showFullDescription)}
        >
          {showFullDescription ? "Show less" : "Show more"}
        </Button>
      </div>
      <PremiumModal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        selectedPlan={user?.plan || "Gold"}
      />
    </div>
  );
};

export default VideoInfo;
