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
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const createTransport = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

const sendEmail = async ({ to, subject, text, html, attachments = [] }) => {
  if (!isSmtpConfigured()) {
    console.log(`[EMAIL:preview] to=${to} subject=${subject} text=${text}`);
    return { delivered: process.env.NODE_ENV !== "production", preview: true, target: to };
  }

  const transporter = createTransport();
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
    attachments,
  });

  return { delivered: true, target: to };
};

const sendSms = async ({ to, message }) => {
  if (!process.env.SMS_WEBHOOK_URL) {
    const maskedPhone = to ? to.replace(/.(?=.{4})/g, "*") : "unavailable";
    console.log(`[SMS:preview] to=${maskedPhone} message=${message}`);
    return { delivered: process.env.NODE_ENV !== "production", preview: true, target: maskedPhone };
  }

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
