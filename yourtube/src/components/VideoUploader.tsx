import { Check, FileVideo, Upload, X, Loader2 } from "lucide-react";
import React, { ChangeEvent, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import axiosInstance from "@/lib/axiosinstance";
import { motion, AnimatePresence } from "framer-motion";

const VideoUploader = ({ channelId, channelName }: any) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlefilechange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith("video/")) {
        toast.error("Please upload a valid video file.");
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast.error("File size exceeds 100MB limit.");
        return;
      }
      setVideoFile(file);
      if (!videoTitle) {
        // Strip extension for title
        setVideoTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const resetForm = () => {
    setVideoFile(null);
    setVideoTitle("");
    setIsUploading(false);
    setUploadProgress(0);
    setUploadComplete(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const cancelUpload = () => {
    if (isUploading) {
      toast.error("Your video upload has been cancelled");
    }
    resetForm();
  };

  const handleUpload = async () => {
    if (!videoFile || !videoTitle.trim()) {
      toast.error("Please provide file and title");
      return;
    }
    const formdata = new FormData();
    formdata.append("file", videoFile);
    formdata.append("videotitle", videoTitle);
    formdata.append("videochanel", channelName || "");
    formdata.append("uploader", channelId || "");

    try {
      setIsUploading(true);
      setUploadProgress(0);
      const res = await axiosInstance.post("/video/upload", formdata, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent: any) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        },
      });
      setUploadComplete(true);
      toast.success("Video uploaded successfully!");
      setTimeout(() => resetForm(), 3000);
    } catch (error) {
      console.error("Error uploading video:", error);
      toast.error("There was an error uploading your video. Please try again.");
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-background rounded-3xl p-6 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/40 relative overflow-hidden">
      {/* Decorative gradient blob */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

      <div className="relative z-10">
        <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
          <Upload className="text-primary w-6 h-6" />
          Upload a new video
        </h2>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {!videoFile ? (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="border-2 border-dashed border-primary/30 rounded-2xl p-12 text-center cursor-pointer hover:bg-primary/5 hover:border-primary/50 transition-all duration-300 group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Upload className="w-10 h-10 text-primary" />
                </div>
                <p className="text-xl font-semibold text-foreground">
                  Drag and drop video files to upload
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  or click to browse your computer
                </p>
                <p className="text-xs font-medium text-primary mt-6 bg-primary/10 inline-block px-3 py-1 rounded-full">
                  MP4, WebM, MOV or AVI • Up to 100MB
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="video/*"
                  onChange={handlefilechange}
                />
              </motion.div>
            ) : (
              <motion.div
                key="upload-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 bg-secondary/20 p-6 rounded-2xl border border-border"
              >
                <div className="flex items-center gap-4 p-4 bg-background rounded-xl shadow-sm border border-border/50">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <FileVideo className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate text-foreground">{videoFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  {!isUploading && !uploadComplete && (
                    <Button variant="ghost" size="icon" onClick={cancelUpload} className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors">
                      <X className="w-5 h-5" />
                    </Button>
                  )}
                  {uploadComplete && (
                    <div className="bg-green-500/20 p-2 rounded-full">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="title" className="text-sm font-medium text-foreground">Video Title</Label>
                    <Input
                      id="title"
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      placeholder="Add a catchy title that describes your video"
                      disabled={isUploading || uploadComplete}
                      className="mt-1.5 h-12 text-base rounded-xl border-border/60 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {isUploading && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-2 pt-2"
                    >
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-primary flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                        </span>
                        <span className="text-primary">{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2 rounded-full bg-secondary" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                  {!uploadComplete && (
                    <>
                      <Button variant="outline" onClick={cancelUpload} disabled={isUploading || uploadComplete} className="rounded-full px-6">
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUpload}
                        disabled={isUploading || !videoTitle.trim() || uploadComplete}
                        className="rounded-full px-8 shadow-md"
                      >
                        {isUploading ? "Uploading..." : "Publish Video"}
                      </Button>
                    </>
                  )}
                  {uploadComplete && (
                    <Button variant="outline" onClick={resetForm} className="rounded-full px-6">
                      Upload Another
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default VideoUploader;
