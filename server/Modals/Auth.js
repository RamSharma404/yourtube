import mongoose from "mongoose";
const userschema = mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String },
  channelname: { type: String },
  description: { type: String },
  image: { type: String },
  phone: { type: String },
  city: { type: String },
  state: { type: String },
  region: {
    type: String,
    enum: ["south", "other"],
    default: "other",
  },
  lastLoginAt: { type: Date },
  lastOtpSentAt: { type: Date },
  otpCode: { type: String },
  otpExpiresAt: { type: Date },
  otpChannel: {
    type: String,
    enum: ["email", "sms", null],
    default: null,
  },
  isVerified: { type: Boolean, default: false },
  joinedon: { type: Date, default: Date.now },
  isPremium: { type: Boolean, default: false },
  premiumExpiry: { type: Date },
  plan: {
    type: String,
    enum: ["Free", "Bronze", "Silver", "Gold"],
    default: "Free",
  },
  planWatchLimitSeconds: { type: Number, default: 10 },
  totalWatchSeconds: { type: Number, default: 0 },
  dailyDownloadCount: { type: Number, default: 0 },
  lastDownloadDate: { type: Date },
  downloadedVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: "videofiles" }],
  paymentHistory: [
    {
      plan: { type: String },
      amount: { type: Number },
      currency: { type: String, default: "INR" },
      orderId: { type: String },
      paymentId: { type: String },
      invoiceNumber: { type: String },
      paidAt: { type: Date, default: Date.now },
    },
  ],
});

export default mongoose.model("user", userschema);
