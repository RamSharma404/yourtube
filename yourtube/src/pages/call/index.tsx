import { useState } from "react";
import { useRouter } from "next/router";
import { Phone, Plus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CallLobby() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");

  const createRoom = () => {
    const id = Math.random().toString(36).substring(2, 10);
    router.push(`/call/${id}`);
  };

  const joinRoom = () => {
    if (roomId.trim()) {
      router.push(`/call/${roomId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold">Video Call</h1>
          <p className="text-gray-500 mt-1">
            Start a new call or join an existing one
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={createRoom}
            className="w-full flex items-center gap-2 h-12 text-base"
          >
            <Plus className="w-5 h-5" />
            Create New Room
          </Button>

          <div className="flex items-center gap-2">
            <div className="flex-1 border-t" />
            <span className="text-sm text-gray-400">or</span>
            <div className="flex-1 border-t" />
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Enter room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && joinRoom()}
              className="flex-1"
            />
            <Button onClick={joinRoom} disabled={!roomId.trim()}>
              <LogIn className="w-4 h-4 mr-1" />
              Join
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
