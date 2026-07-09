import express from "express";
import { downloadVideo, getDownloadedVideos } from "../controllers/download.js";
const routes = express.Router();

routes.get("/file/:id", downloadVideo);
routes.get("/list", getDownloadedVideos);

export default routes;
