import express from "express";
import {
  deletecomment,
  getallcomment,
  postcomment,
  editcomment,
  reactToComment,
  translateComment,
} from "../controllers/comment.js";


const routes = express.Router();
routes.get("/:videoid", getallcomment);
routes.post("/postcomment", postcomment);
routes.post("/translate", translateComment);
routes.post("/react/:id", reactToComment);
routes.delete("/deletecomment/:id", deletecomment);
routes.post("/editcomment/:id", editcomment);
export default routes;
