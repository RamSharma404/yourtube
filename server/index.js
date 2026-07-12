import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";
import userroutes from "./routes/auth.js";
import videoroutes from "./routes/video.js";
import likeroutes from "./routes/like.js";
import watchlaterroutes from "./routes/watchlater.js";
import historyrroutes from "./routes/history.js";
import commentroutes from "./routes/comment.js";
import paymentroutes from "./routes/payment.js";
import downloadroutes from "./routes/download.js";
import video from "./Modals/video.js";
import { setupSocketHandlers } from "./socket/handler.js";
dotenv.config();
const app = express();
import path from "path";
app.use(cors());
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use("/uploads", express.static(path.join("uploads")));
app.get("/", (req, res) => {
  res.send("You tube backend is working");
});
app.use(bodyParser.json());
app.use("/user", userroutes);
app.use("/video", videoroutes);
app.use("/like", likeroutes);
app.use("/watch", watchlaterroutes);

app.use("/test-email", async (req, res) => {
  try {
    const result = await sendEmail({
      to: process.env.SMTP_USER,
      subject: "Test from Render",
      text: "Testing production email",
    });
    res.json({ success: true, result });
  } catch (error) {
    res.json({ success: false, error: error.message, stack: error.stack });
  }
});

app.use("/history", historyrroutes);
app.use("/comment", commentroutes);
app.use("/payment", paymentroutes);
app.use("/download", downloadroutes);
const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});
setupSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});

const DBURL = process.env.DB_URL;
mongoose
  .connect(DBURL)
  .then(async () => {
    console.log("Mongodb connected");
    // Clear out "ghost" videos from the database on server restart
    // because Render Free Tier deletes the physical local files in /uploads automatically!
    try {
      await video.deleteMany({});
      console.log("Cleaned up ephemeral videos from the database.");
    } catch (err) {
      console.error("Failed to clean up videos:", err);
    }
  })
  .catch((error) => {
    console.log(error);
  });
