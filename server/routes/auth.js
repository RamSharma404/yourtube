import express from "express";
import { login, updateprofile, verifyOtp, watchHeartbeat } from "../controllers/auth.js";
const routes = express.Router();

routes.post("/login", login);
routes.post("/verify-otp", verifyOtp);
routes.patch("/update/:id", updateprofile);
routes.post("/watch-heartbeat", watchHeartbeat);
export default routes;
