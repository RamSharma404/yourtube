import crypto from "crypto";
import users from "../Modals/Auth.js";
import { getPlanDetails } from "../utils/plans.js";
import { sendInvoiceEmail, writeInvoiceToDisk } from "../utils/communication.js";

let razorpay = null;

const hasRealRazorpayKeys = () =>
  Boolean(
    process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      !process.env.RAZORPAY_KEY_ID.includes("xxxxxxxx") &&
      !process.env.RAZORPAY_KEY_SECRET.includes("xxxxxxxx")
  );

const getRazorpay = async () => {
  if (!razorpay) {
    const { default: Razorpay } = await import("razorpay");
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
};

export const createOrder = async (req, res) => {
  try {
    const { userId, plan = "Gold" } = req.body;
    if (!userId) return res.status(400).json({ message: "User ID required" });
    const user = await users.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const planDetails = getPlanDetails(plan);

    if (planDetails.amount <= 0) {
      return res.status(400).json({ message: "Selected plan is not payable" });
    }

    const orderId = `mock_order_${Date.now()}`;
    const mockResponse = {
      orderId,
      amount: planDetails.amount,
      currency: "INR",
      key_id: null,
      plan: planDetails.name,
      mock: true,
    };

    if (!hasRealRazorpayKeys()) {
      // Allow mock payments in production for internship demonstration
      return res.status(200).json(mockResponse);
    }

    try {
      const rzp = await getRazorpay();
      const options = {
        amount: planDetails.amount,
        currency: "INR",
        receipt: `receipt_${planDetails.name}_${userId}_${Date.now()}`,
        notes: {
          userId,
          plan: planDetails.name,
        },
      };

      const order = await rzp.orders.create(options);
      return res.status(200).json({
        orderId: order.id,
        amount: options.amount,
        currency: options.currency,
        key_id: process.env.RAZORPAY_KEY_ID,
        plan: planDetails.name,
      });
    } catch (rzpError) {
      console.error("Razorpay API failed with provided keys. Falling back to Mock Payment Mode.");
      return res.status(200).json(mockResponse);
    }
  } catch (error) {
    console.error("Razorpay order error:", error);
    res.status(500).json({ message: "Failed to create order" });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      plan = "Gold",
    } = req.body;

    if (!userId) return res.status(400).json({ message: "User ID required" });
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Payment details are required" });
    }

    const isMockPayment =
      razorpay_order_id?.startsWith("mock_order_") &&
      razorpay_signature === "mock_signature";

    if (!isMockPayment) {
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ message: "Invalid signature" });
      }
    }

    const user = await users.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const premiumExpiry = new Date();
    premiumExpiry.setMonth(premiumExpiry.getMonth() + 1);
    const selectedPlan = getPlanDetails(plan);
    const invoiceNumber = `INV-${Date.now()}`;
    const invoiceContent = [
      `Invoice Number: ${invoiceNumber}`,
      `Plan: ${selectedPlan.name}`,
      `Amount: INR ${(selectedPlan.amount / 100).toFixed(2)}`,
      `Order ID: ${razorpay_order_id}`,
      `Payment ID: ${razorpay_payment_id}`,
      `Issued At: ${new Date().toISOString()}`,
    ].join("\n");
    const invoicePath = await writeInvoiceToDisk({
      invoiceNumber,
      content: invoiceContent,
    });

    const updatedUser = await users.findByIdAndUpdate(
      userId,
      {
        $set: {
          isPremium: selectedPlan.isPremium,
          premiumExpiry: premiumExpiry,
          dailyDownloadCount: 0,
          plan: selectedPlan.name,
          planWatchLimitSeconds:
            selectedPlan.watchLimitSeconds ?? null,
        },
        $push: {
          paymentHistory: {
            plan: selectedPlan.name,
            amount: selectedPlan.amount,
            currency: "INR",
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            invoiceNumber,
          },
        },
      },
      { new: true }
    );

    try {
      await sendInvoiceEmail({
        user: updatedUser,
        plan: selectedPlan.name,
        amount: selectedPlan.amount,
        invoiceNumber,
        invoicePath,
      });
    } catch (emailError) {
      console.error("Failed to send invoice email (SMTP error), but payment succeeded:", emailError);
    }

    res.status(200).json({
      message: "Payment verified, plan activated",
      premiumExpiry,
      invoiceNumber,
      invoicePath,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ message: "Verification failed" });
  }
};
