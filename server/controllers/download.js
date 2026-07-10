import users from "../Modals/Auth.js";
import video from "../Modals/video.js";
import path from "path";
import fs from "fs";
import { applyPlanToUser, isPremiumActive } from "../utils/plans.js";

export const downloadVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) return res.status(401).json({ message: "User ID required" });

    const user = await users.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const videodata = await video.findById(id);
    if (!videodata) return res.status(404).json({ message: "Video not found" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hasPremiumAccess = isPremiumActive(user);
    if (user.isPremium && !hasPremiumAccess) {
      applyPlanToUser(user, "Free");
      await user.save();
    }

    if (!hasPremiumAccess) {
      const lastDownload = user.lastDownloadDate
        ? new Date(user.lastDownloadDate)
        : null;
      const isNewDay =
        !lastDownload ||
        lastDownload.getTime() < today.getTime();

      if (isNewDay) {
        user.dailyDownloadCount = 0;
        user.lastDownloadDate = today;
      }

      if (user.dailyDownloadCount >= 1) {
        return res.status(403).json({
          message: "Daily download limit reached. Upgrade to premium for unlimited downloads.",
          code: "LIMIT_REACHED",
        });
      }
    }

    const absolutePath = path.resolve(videodata.filepath);
    
    // Check if the physical file actually exists on the disk
    // Render Free tier deletes all local files in /uploads when the server restarts!
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ 
        message: "File no longer exists on the server. (Render free tier deletes local files on restart. Please upload a new video to test.)" 
      });
    }

    res.download(absolutePath, videodata.filename, async (err) => {
      if (err) {
        console.error("Download error:", err);
        if (!res.headersSent) {
          return res.status(500).json({ message: "Download failed" });
        }
        return;
      }

      if (!hasPremiumAccess) {
        user.dailyDownloadCount += 1;
        user.lastDownloadDate = today;
      }

      if (!user.downloadedVideos.includes(id)) {
        user.downloadedVideos.push(id);
      }

      await user.save();
    });
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getDownloadedVideos = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(401).json({ message: "User ID required" });

    const user = await users.findById(userId).populate("downloadedVideos");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user.downloadedVideos);
  } catch (error) {
    console.error("Get downloaded error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
