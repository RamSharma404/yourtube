import comment from "../Modals/comment.js";
import mongoose from "mongoose";
import users from "../Modals/Auth.js";
import axios from "axios";

const SUPPORTED_LANGUAGES = new Set(["en", "hi", "ta", "te", "ml", "kn"]);
const hasBlockedSpecialCharacters = (text = "") =>
  /[^\p{L}\p{N}\s.,!?'"()-]/u.test(text);

export const postcomment = async (req, res) => {
  const commentdata = req.body;
  try {
    if (hasBlockedSpecialCharacters(commentdata.commentbody)) {
      return res.status(400).json({
        message: "Comments with unsupported special characters are blocked.",
      });
    }

    const user = await users.findById(commentdata.userid);
    const postcomment = new comment({
      ...commentdata,
      city: user?.city || "",
    });
    await postcomment.save();
    return res.status(200).json({ comment: true, data: postcomment });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const getallcomment = async (req, res) => {
  const { videoid } = req.params;
  try {
    const commentvideo = await comment.find({ videoid: videoid });
    return res.status(200).json(commentvideo);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const deletecomment = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("comment unavailable");
  }
  try {
    await comment.findByIdAndDelete(_id);
    return res.status(200).json({ comment: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const editcomment = async (req, res) => {
  const { id: _id } = req.params;
  const { commentbody } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("comment unavailable");
  }
  try {
    if (hasBlockedSpecialCharacters(commentbody)) {
      return res.status(400).json({
        message: "Comments with unsupported special characters are blocked.",
      });
    }
    const updatecomment = await comment.findByIdAndUpdate(_id, {
      $set: { commentbody: commentbody },
    });
    res.status(200).json(updatecomment);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const reactToComment = async (req, res) => {
  const { id } = req.params;
  const { userId, type } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: "Comment unavailable" });
  }

  try {
    const existingComment = await comment.findById(id);
    if (!existingComment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const likeSet = new Set(existingComment.likedBy.map((entry) => entry.toString()));
    const dislikeSet = new Set(existingComment.dislikedBy.map((entry) => entry.toString()));

    if (type === "like") {
      if (likeSet.has(userId)) {
        likeSet.delete(userId);
      } else {
        likeSet.add(userId);
        dislikeSet.delete(userId);
      }
    } else {
      if (dislikeSet.has(userId)) {
        dislikeSet.delete(userId);
      } else {
        dislikeSet.add(userId);
        likeSet.delete(userId);
      }
    }

    existingComment.likedBy = Array.from(likeSet);
    existingComment.dislikedBy = Array.from(dislikeSet);
    existingComment.likes = existingComment.likedBy.length;
    existingComment.dislikes = existingComment.dislikedBy.length;

    if (existingComment.dislikes >= 2) {
      await comment.findByIdAndDelete(id);
      return res.status(200).json({ removed: true });
    }

    await existingComment.save();
    return res.status(200).json(existingComment);
  } catch (error) {
    console.error("comment reaction error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const translateComment = async (req, res) => {
  const { text, targetLanguage } = req.body;

  try {
    if (!SUPPORTED_LANGUAGES.has(targetLanguage)) {
      return res.status(400).json({ message: "Unsupported target language" });
    }

    const response = await axios.get("https://api.mymemory.translated.net/get", {
      params: {
        q: text,
        langpair: `auto|${targetLanguage}`,
      },
    });

    return res.status(200).json({
      translatedText:
        response.data?.responseData?.translatedText || text,
    });
  } catch (error) {
    console.error("translation error:", error);
    return res.status(500).json({ message: "Translation failed" });
  }
};
