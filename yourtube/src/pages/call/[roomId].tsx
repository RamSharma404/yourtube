import { useRouter } from "next/router";
import VideoCallUI from "@/components/VideoCallUI";

export default function CallRoom() {
  const router = useRouter();
  const { roomId } = router.query;

  if (!roomId || typeof roomId !== "string") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">
        <p>Invalid room ID</p>
      </div>
    );
  }

  return <VideoCallUI roomId={roomId} onEndCall={() => router.push("/")} />;
}
