import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";

interface DownloadedVideo {
  _id: string;
  filepath: string;
  videotitle: string;
  videochanel: string;
}

export default function Downloads() {
  const { user } = useUser();
  const router = useRouter();
  const [videos, setVideos] = useState<DownloadedVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }
    fetchDownloads();
  }, [user]);

  const fetchDownloads = async () => {
    try {
      const res = await axiosInstance.get(`/download/list?userId=${user._id}`);
      setVideos(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching downloads:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Download className="w-6 h-6" /> Downloads
        </h1>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading...</div>
      ) : videos.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Download className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg">No downloaded videos yet</p>
          <p className="text-sm">Videos you download will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video) => (
            <Link
              key={video._id}
              href={`/watch/${video._id}`}
              className="group"
            >
              <div className="space-y-3">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                  <video
                    src={`${process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL}/${video?.filepath}`}
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm line-clamp-2">
                      {video?.videotitle}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {video?.videochanel}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
