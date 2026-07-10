import ChannelHeader from "@/components/ChannelHeader";
import Channeltabs from "@/components/Channeltabs";
import ChannelVideos from "@/components/ChannelVideos";
import VideoUploader from "@/components/VideoUploader";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

const ChannelPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      if (!id) return;
      try {
        const res = await axiosInstance.get("/video/getvideos");
        const channelVideos = res.data.filter((v: any) => v.uploader === id);
        setVideos(channelVideos);
      } catch (error) {
        console.error("Error fetching channel videos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, [id]);

  try {
    let channel = user;
   
    return (
      <div className="flex-1 min-h-screen bg-background">
        <div className="max-w-7xl mx-auto pb-16">
          <ChannelHeader channel={channel} user={user} />
          <Channeltabs />
          <div className="px-4 md:px-12 mt-8">
            <VideoUploader channelId={id} channelName={channel?.channelname} />
          </div>
          <div className="px-4 md:px-12 mt-8">
            {loading ? (
              <div className="text-center text-muted-foreground py-10">Loading videos...</div>
            ) : (
              <ChannelVideos videos={videos} />
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching channel data:", error);
    return null;
  }
};

export default ChannelPage;
