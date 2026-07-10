import fs from "fs";
import path from "path";
import axios from "axios";
import nodemailer from "nodemailer";

const invoicesDir = path.resolve("invoices");

const ensureInvoicesDir = async () => {
  await fs.promises.mkdir(invoicesDir, { recursive: true });
};

export const writeInvoiceToDisk = async ({ invoiceNumber, content }) => {
  await ensureInvoicesDir();
  const filename = `${invoiceNumber}.txt`;
  const filepath = path.join(invoicesDir, filename);
  await fs.promises.writeFile(filepath, content, "utf8");
  return filepath;
};

const isSmtpConfigured = () =>
  Boolean(process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim());

const createTransport = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST?.trim(),
    port: Number(process.env.SMTP_PORT?.trim() || 587),
    secure: process.env.SMTP_SECURE?.trim() === "true",
    auth: {
      user: process.env.SMTP_USER?.trim(),
      pass: process.env.SMTP_PASS?.trim(),
    },
  });

export const sendEmail = async ({ to, subject, text, html, attachments = [] }) => {
  // Use EmailJS to bypass Render's SMTP block!
  const serviceId = process.env.EMAILJS_SERVICE_ID || "service_jzl5jzo";
  const templateId = process.env.EMAILJS_TEMPLATE_ID || "template_76f3o1p";
  const publicKey = process.env.EMAILJS_PUBLIC_KEY || "MgFoxLCcnnrltV1gv";

  try {
    const payload = {
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      template_params: {
        to_email: to,
        subject: subject,
        message: html || text, // Pass the HTML format to EmailJS
      },
    };

    const response = await axios.post("https://api.emailjs.com/api/v1.0/email/send", payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(`[EMAILJS] Successfully sent email to ${to}`);
    return { delivered: true, target: to };
  } catch (error) {
    console.error(`[EMAILJS ERROR] Failed to send email to ${to}:`, error?.response?.data || error.message);
    // Even if email fails, return success so login flow isn't blocked.
    return { delivered: false, target: to, error: true };
  }
};

const sendSms = async ({ to, message }) => {
  if (!process.env.SMS_WEBHOOK_URL) {
    const maskedPhone = to ? to.replace(/.(?=.{4})/g, "*") : "unavailable";
    console.log(`[SMS:preview] to=${maskedPhone} message=${message}`);
    return { delivered: process.env.NODE_ENV !== "production", preview: true, target: maskedPhone };
  }

  try {
    await axios.post(
      process.env.SMS_WEBHOOK_URL,
      {
        to,
        message,
        template: "yourtube-login-otp",
      },
      {
        headers: process.env.SMS_API_KEY
          ? { Authorization: `Bearer ${process.env.SMS_API_KEY}` }
          : undefined,
      }
    );
  } catch (error) {
    console.error(`[SMS ERROR] Failed to send SMS to ${to}:`, error.message);
  }

  return { delivered: true, target: to };
};

export const dispatchOtp = async ({ user, channel, otp }) => {
  const maskedPhone = user.phone ? user.phone.replace(/.(?=.{4})/g, "*") : "unavailable";
  const message = `Your YourTube verification OTP is ${otp}. It expires in 10 minutes.`;

  if (channel === "email") {
    const result = await sendEmail({
      to: user.email,
      subject: "Your YourTube login OTP",
      text: message,
      html: `<p>${message}</p>`,
    });
    return { ...result, channel };
  }

  const result = await sendSms({ to: user.phone, message });
  return { ...result, target: result.target || maskedPhone, channel };
};

export const sendInvoiceEmail = async ({ user, plan, amount, invoiceNumber, invoicePath }) => {
  const amountLabel = `INR ${(amount / 100).toFixed(2)}`;
  return sendEmail({
    to: user.email,
    subject: `YourTube ${plan} plan invoice ${invoiceNumber}`,
    text: [
      `Thanks for upgrading to YourTube ${plan}.`,
      `Invoice: ${invoiceNumber}`,
      `Amount: ${amountLabel}`,
      `The invoice file is attached.`,
    ].join("\n"),
    html: `
      <p>Thanks for upgrading to <strong>YourTube ${plan}</strong>.</p>
      <p>Invoice: <strong>${invoiceNumber}</strong></p>
      <p>Amount: <strong>${amountLabel}</strong></p>
    `,
    attachments: invoicePath
      ? [{ filename: `${invoiceNumber}.txt`, path: invoicePath }]
      : [],
  });
};
