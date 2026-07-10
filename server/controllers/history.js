import video from "../Modals/video.js";
import history from "../Modals/history.js";

export const handlehistory = async (req, res) => {
  const { userId } = req.body;
  const { videoId } = req.params;
  try {
    // Prevent duplicates by removing any older watch history for this exact video
    await history.deleteMany({ viewer: userId, videoid: videoId });

    await history.create({ viewer: userId, videoid: videoId });
    await video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });
    return res.status(200).json({ history: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const handleview = async (req, res) => {
  const { videoId } = req.params;
  try {
    await video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const getallhistoryVideo = async (req, res) => {
  const { userId } = req.params;
  try {
    const historyvideo = await history
      .find({ viewer: userId })
      .populate({
        path: "videoid",
        model: "videofiles",
      })
      .sort({ updatedAt: -1, createdAt: -1 }) // newest first
      .exec();

    // 1. Filter out videos that were deleted from the database
    const validHistory = historyvideo.filter(h => h.videoid != null);

    // 2. Filter out any existing duplicates in the DB (since they are sorted newest first, we keep the most recent)
    const seen = new Set();
    const uniqueHistory = validHistory.filter(h => {
      const vidStr = h.videoid._id.toString();
      if (seen.has(vidStr)) return false;
      seen.add(vidStr);
      return true;
    });

    return res.status(200).json(uniqueHistory);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
