import mongoose from "mongoose";
import dotenv from "dotenv";
import videofiles from "./Modals/video.js";

dotenv.config();

const DBURL = process.env.DB_URL;

mongoose
  .connect(DBURL)
  .then(async () => {
    console.log("Mongodb connected for seeding");

    // Check if videos exist
    const count = await videofiles.countDocuments();
    if (count > 0) {
      console.log(`Found ${count} videos. Deleting old dummy data...`);
      await videofiles.deleteMany({});
    }

    const dummyVideos = [
      {
        videotitle: "Beautiful Nature Footage",
        filename: "sample1.mp4",
        filetype: "video/mp4",
        filepath: "uploads/sample.mp4",
        filesize: "1048576",
        videochanel: "Demo Channel 1",
        uploader: "1", // dummy uploader
        views: 1200,
        Like: 450
      },
      {
        videotitle: "Tech Review 2026",
        filename: "sample2.mp4",
        filetype: "video/mp4",
        filepath: "uploads/sample.mp4",
        filesize: "1048576",
        videochanel: "Tech Guru",
        uploader: "2",
        views: 8900,
        Like: 1200
      },
      {
        videotitle: "Cooking Masterclass",
        filename: "sample3.mp4",
        filetype: "video/mp4",
        filepath: "uploads/sample.mp4",
        filesize: "1048576",
        videochanel: "Chef John",
        uploader: "3",
        views: 340,
        Like: 22
      }
    ];

    await videofiles.insertMany(dummyVideos);
    console.log("Successfully seeded 3 demo videos!");
    process.exit(0);
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
