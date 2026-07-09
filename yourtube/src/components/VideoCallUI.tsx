import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Download,
  ExternalLink,
} from "lucide-react";
import { Button } from "./ui/button";
import { connectSocket, getSocket } from "@/lib/socket";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

interface VideoCallUIProps {
  roomId: string;
  onEndCall?: () => void;
}

const VideoCallUI = ({ roomId, onEndCall }: VideoCallUIProps) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<string[]>([]);
  const [inCall, setInCall] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [sharedYouTubeUrl, setSharedYouTubeUrl] = useState("");
  const [youtubeShareError, setYoutubeShareError] = useState("");

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);
  const pendingCandidates = useRef<Record<string, RTCIceCandidateInit[]>>({});

  const socket = getSocket();

  const createPeerConnection = useCallback((userId: string) => {
    if (peerConnections.current[userId]) {
      peerConnections.current[userId].close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current[userId] = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { to: userId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStreams((prev) => ({
        ...prev,
        [userId]: event.streams[0],
      }));
    };

    pc.oniceconnectionstatechange = () => {
      if (
        pc.iceConnectionState === "disconnected" ||
        pc.iceConnectionState === "failed"
      ) {
        handleUserLeft(userId);
      }
    };

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        if (localStream.getVideoTracks().length > 0 || track.kind !== "video") {
          pc.addTrack(track, localStream);
        }
      });
    }

    return pc;
  }, [localStream, socket]);

  const flushPendingCandidates = async (userId: string) => {
    const queue = pendingCandidates.current[userId];
    if (!queue || queue.length === 0) return;
    const pc = peerConnections.current[userId];
    if (!pc || !pc.remoteDescription) return;
    delete pendingCandidates.current[userId];
    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error("Error flushing ICE candidate:", e);
      }
    }
  };

  const handleUserLeft = useCallback((userId: string) => {
    if (peerConnections.current[userId]) {
      peerConnections.current[userId].close();
      delete peerConnections.current[userId];
    }
    delete pendingCandidates.current[userId];
    setRemoteStreams((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
    setRemoteUsers((prev) => prev.filter((id) => id !== userId));
  }, []);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("join-room", roomId);

    socket.on("user-joined", async (userId: string) => {
      setRemoteUsers((prev) => [...prev, userId]);
      const pc = createPeerConnection(userId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { to: userId, offer });
    });

    socket.on("room-users", (users: string[]) => {
      setRemoteUsers(users);
    });

    socket.on("offer", async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
      if (!peerConnections.current[from]) {
        createPeerConnection(from);
      }
      const pc = peerConnections.current[from];
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await flushPendingCandidates(from);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { to: from, answer });
    });

    socket.on("answer", async ({ from, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
      const pc = peerConnections.current[from];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await flushPendingCandidates(from);
      }
    });

    socket.on("ice-candidate", async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      const pc = peerConnections.current[from];
      if (!pc) return;
      if (!pc.remoteDescription) {
        pendingCandidates.current[from] = pendingCandidates.current[from] || [];
        pendingCandidates.current[from].push(candidate);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error("Error adding ICE candidate:", e);
      }
    });

    socket.on("user-left", (userId: string) => {
      handleUserLeft(userId);
    });

    socket.on("youtube-url-shared", ({ url }: { userId: string; url: string }) => {
      setSharedYouTubeUrl(url);
      setYoutubeUrl(url);
    });

    return () => {
      socket.emit("leave-room", roomId);
      socket.off("user-joined");
      socket.off("room-users");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("user-left");
      socket.off("youtube-url-shared");
    };
  }, [roomId, socket, createPeerConnection, handleUserLeft]);

  useEffect(() => {
    startLocalStream();
    return () => {
      stopLocalStream();
    };
  }, []);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    Object.entries(remoteStreams).forEach(([userId, stream]) => {
      const videoEl = remoteVideoRefs.current[userId];
      if (videoEl) {
        videoEl.srcObject = stream;
      }
    });
  }, [remoteStreams]);

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      setInCall(true);
    } catch (err) {
      console.error("Error accessing media devices:", err);
    }
  };

  const stopLocalStream = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    Object.values(peerConnections.current).forEach((pc) => pc.close());
    peerConnections.current = {};
    setRemoteStreams({});
    setRemoteUsers([]);
    setInCall(false);
  };

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = micMuted;
      });
      setMicMuted(!micMuted);
      socket.emit("toggle-mic", { roomId, muted: !micMuted });
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = cameraOff;
      });
      setCameraOff(!cameraOff);
      socket.emit("toggle-camera", { roomId, enabled: !cameraOff });
    }
  };

  const toggleScreenShare = async () => {
    if (screenSharing) {
      stopScreenShare();
    } else {
      await startScreenShare();
    }
  };

  const startScreenShare = async () => {
    try {
      if (!localStream) return;
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      const videoTrack = screenStream.getVideoTracks()[0];

      videoTrack.onended = () => {
        stopScreenShare();
      };

      localStream.getVideoTracks().forEach((track) => {
        track.stop();
        localStream.removeTrack(track);
      });
      localStream.addTrack(videoTrack);

      Object.values(peerConnections.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      setScreenSharing(true);
      socket.emit("screen-share-started", { roomId });
    } catch (err) {
      console.error("Error sharing screen:", err);
    }
  };

  const stopScreenShare = () => {
    if (!localStream) return;
    navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then((camStream) => {
      const videoTrack = camStream.getVideoTracks()[0];

      localStream.getVideoTracks().forEach((track) => {
        track.stop();
        localStream.removeTrack(track);
      });
      localStream.addTrack(videoTrack);

      Object.values(peerConnections.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      setScreenSharing(false);
      socket.emit("screen-share-stopped", { roomId });
    });
  };

  const startRecording = () => {
    const combinedStream = new MediaStream();

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        combinedStream.addTrack(track.clone());
      });
    }

    Object.values(remoteStreams).forEach((stream) => {
      stream.getTracks().forEach((track) => {
        combinedStream.addTrack(track.clone());
      });
    });

    if (combinedStream.getTracks().length === 0) return;

    recordedChunks.current = [];
    const recorder = new MediaRecorder(combinedStream, {
      mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm",
    });

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunks.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `call-recording-${roomId}-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      recordedChunks.current = [];
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const normalizeYouTubeUrl = (url: string) => {
    try {
      const parsed = new URL(url.trim());
      const host = parsed.hostname.replace(/^www\./, "");
      if (host !== "youtube.com" && host !== "youtu.be" && host !== "m.youtube.com") {
        return null;
      }
      return parsed.toString();
    } catch {
      return null;
    }
  };

  const shareYouTubeForScreenShare = async () => {
    const normalizedUrl = normalizeYouTubeUrl(youtubeUrl);
    if (!normalizedUrl) {
      setYoutubeShareError("Enter a valid YouTube URL.");
      return;
    }

    setYoutubeShareError("");
    setSharedYouTubeUrl(normalizedUrl);
    socket.emit("youtube-url-shared", { roomId, url: normalizedUrl });
    window.open(normalizedUrl, "_blank", "noopener,noreferrer");
    await startScreenShare();
  };

  const endCall = () => {
    if (recording) stopRecording();
    if (screenSharing) stopScreenShare();
    stopLocalStream();
    socket.emit("leave-room", roomId);
    if (onEndCall) onEndCall();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex-1 relative grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
        <div className="relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <span className="absolute bottom-2 left-2 text-white text-sm bg-black/50 px-2 py-0.5 rounded">
            You {screenSharing ? "(Screen)" : ""}
          </span>
        </div>

        {remoteUsers.length === 0 && (
          <div className="flex items-center justify-center bg-gray-900 rounded-lg text-gray-400">
            <div className="text-center">
              <Phone className="w-12 h-12 mx-auto mb-2" />
              <p className="text-lg">Waiting for someone to join...</p>
              <p className="text-sm text-gray-500">Share the room ID: {roomId}</p>
            </div>
          </div>
        )}

        {remoteUsers.map((userId) => (
          <div
            key={userId}
            className="relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center"
          >
            <video
              ref={(el) => {
      remoteVideoRefs.current[userId] = el;
              }}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-2 left-2 text-white text-sm bg-black/50 px-2 py-0.5 rounded">
              User {userId.slice(0, 5)}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 bg-gray-950 px-4 py-3">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 md:flex-row md:items-center">
          <input
            value={youtubeUrl}
            onChange={(event) => setYoutubeUrl(event.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="min-h-10 flex-1 rounded-md border border-white/10 bg-gray-900 px-3 text-sm text-white outline-none focus:border-blue-500"
          />
          <Button variant="secondary" onClick={shareYouTubeForScreenShare}>
            <ExternalLink className="h-4 w-4" />
            Share YouTube
          </Button>
          {sharedYouTubeUrl && (
            <Button
              variant="secondary"
              onClick={() => window.open(sharedYouTubeUrl, "_blank", "noopener,noreferrer")}
            >
              Open shared
            </Button>
          )}
        </div>
        {youtubeShareError && (
          <p className="mx-auto mt-2 max-w-5xl text-sm text-red-300">{youtubeShareError}</p>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 p-4 bg-gray-950">
        <Button
          variant={micMuted ? "destructive" : "secondary"}
          size="icon"
          className="rounded-full w-12 h-12"
          onClick={toggleMic}
        >
          {micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>

        <Button
          variant={cameraOff ? "destructive" : "secondary"}
          size="icon"
          className="rounded-full w-12 h-12"
          onClick={toggleCamera}
        >
          {cameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </Button>

        <Button
          variant={screenSharing ? "default" : "secondary"}
          size="icon"
          className="rounded-full w-12 h-12"
          onClick={toggleScreenShare}
        >
          {screenSharing ? (
            <MonitorOff className="w-5 h-5" />
          ) : (
            <Monitor className="w-5 h-5" />
          )}
        </Button>

        <Button
          variant={recording ? "destructive" : "secondary"}
          size="icon"
          className="rounded-full w-12 h-12"
          onClick={recording ? stopRecording : startRecording}
        >
          {recording ? (
            <Download className="w-5 h-5" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-red-500" />
          )}
        </Button>

        <Button
          variant="destructive"
          size="icon"
          className="rounded-full w-14 h-14"
          onClick={endCall}
        >
          <PhoneOff className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
};

export default VideoCallUI;
