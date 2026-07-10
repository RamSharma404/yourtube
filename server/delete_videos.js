import mongoose from "mongoose";
import dotenv from "dotenv";
import video from "./Modals/video.js";

dotenv.config();

const deleteVideos = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("Connected to DB");
    const result = await video.deleteMany({});
    console.log(`Deleted ${result.deletedCount} videos.`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

deleteVideos();
