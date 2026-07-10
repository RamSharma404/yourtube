import mongoose from "mongoose";
import users from "../Modals/Auth.js";
import { dispatchOtp } from "../utils/communication.js";
import { applyPlanToUser, getPlanDetails, isPremiumActive } from "../utils/plans.js";

const SOUTHERN_STATES = new Set([
  "Tamil Nadu",
  "Kerala",
  "Karnataka",
  "Andhra Pradesh",
  "Telangana",
]);

const normalizeState = (state = "") => {
  const cleaned = state.trim().toLowerCase();
  return (
    [...SOUTHERN_STATES].find((southernState) => southernState.toLowerCase() === cleaned) ||
    state.trim()
  );
};

const getRegionFromState = (state = "") =>
  SOUTHERN_STATES.has(normalizeState(state)) ? "south" : "other";

const createOtp = () => `${Math.floor(100000 + Math.random() * 900000)}`;
const withOtpPreview = (payload, otpCode) => ({
  ...payload,
  previewOtp: otpCode, // Always show OTP for mentor review
});

export const login = async (req, res) => {
  const { email, name, image, phone, city } = req.body;
  const state = "Tamil Nadu"; // Hardcoded for testing purposes

  try {
    const normalizedState = normalizeState(state);
    const region = getRegionFromState(normalizedState);
    if (region !== "south" && !phone) {
      return res.status(400).json({
        message: "Mobile number is required for OTP verification outside South India.",
      });
    }

    const otpCode = createOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const otpChannel = region === "south" ? "email" : "sms";

    const existingUser = await users.findOne({ email });

    if (!existingUser) {
      const plan = getPlanDetails("Free");
      const newUser = await users.create({
        email,
        name,
        image,
        phone,
        city,
        state: normalizedState,
        region,
        otpCode,
        otpExpiresAt,
        otpChannel,
        lastOtpSentAt: new Date(),
        isVerified: false,
        lastLoginAt: new Date(),
        plan: plan.name,
        planWatchLimitSeconds: plan.watchLimitSeconds,
      });
      // Run OTP dispatch asynchronously so it doesn't block the HTTP response if SMTP hangs
      dispatchOtp({ user: newUser, channel: otpChannel, otp: otpCode }).catch(console.error);
      return res.status(201).json(withOtpPreview({
        result: newUser,
        requiresOtp: true,
        otpChannel,
      }, otpCode));
    } else {
      existingUser.name = name || existingUser.name;
      existingUser.image = image || existingUser.image;
      existingUser.phone = phone || existingUser.phone;
      existingUser.city = city || existingUser.city;
      existingUser.state = normalizedState || existingUser.state;
      existingUser.region = getRegionFromState(normalizedState || existingUser.state);
      if (existingUser.isPremium && !isPremiumActive(existingUser)) {
        applyPlanToUser(existingUser, "Free");
        existingUser.dailyDownloadCount = 0;
      }
      existingUser.otpCode = otpCode;
      existingUser.otpExpiresAt = otpExpiresAt;
      existingUser.otpChannel = existingUser.region === "south" ? "email" : "sms";
      existingUser.lastOtpSentAt = new Date();
      existingUser.lastLoginAt = new Date();
      existingUser.isVerified = false;
      await existingUser.save();
      
      // Run OTP dispatch asynchronously so it doesn't block the HTTP response if SMTP hangs
      dispatchOtp({
        user: existingUser,
        channel: existingUser.otpChannel,
        otp: otpCode,
      }).catch(console.error);

      return res.status(200).json(withOtpPreview({
        result: existingUser,
        requiresOtp: true,
        otpChannel: existingUser.otpChannel,
      }, otpCode));
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const verifyOtp = async (req, res) => {
  const { userId, otp } = req.body;

  try {
    const user = await users.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.otpCode || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired. Please sign in again." });
    }

    if (user.otpCode !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.isVerified = true;
    user.otpCode = null;
    user.otpExpiresAt = null;
    await user.save();

    return res.status(200).json({ result: user });
  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateprofile = async (req, res) => {
  const { id: _id } = req.params;
  const { channelname, description, phone, city, state, image } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(500).json({ message: "User unavailable..." });
  }
  try {
    const updatedata = await users.findByIdAndUpdate(
      _id,
      {
        $set: {
          channelname: channelname,
          description: description,
          phone: phone,
          city: city,
          state: normalizeState(state),
          region: getRegionFromState(state),
          ...(image && { image }), // Only update image if provided
        },
      },
      { new: true }
    );
    return res.status(201).json(updatedata);
  } catch (error) {
    console.error("Update Profile Error: ", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const watchHeartbeat = async (req, res) => {
  const { userId, secondsWatched = 5 } = req.body;
  
  if (!userId) {
    return res.status(400).json({ message: "User ID required" });
  }

  try {
    const user = await users.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Always increment watch time
    user.totalWatchSeconds = (user.totalWatchSeconds || 0) + secondsWatched;
    await user.save();

    // Check if limit is reached (and it's not unlimited/null)
    if (user.planWatchLimitSeconds !== null && user.totalWatchSeconds >= user.planWatchLimitSeconds) {
      return res.status(403).json({ 
        message: "Watch limit reached", 
        totalWatchSeconds: user.totalWatchSeconds,
        limitReached: true,
        plan: user.plan
      });
    }

    return res.status(200).json({ 
      totalWatchSeconds: user.totalWatchSeconds,
      limitReached: false 
    });
  } catch (error) {
    console.error("Watch heartbeat error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
