import nodemailer from "nodemailer";

const testEmail = async () => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "rs0688699@gmail.com",
        pass: "yjoerwqfdrmxkouo",
      },
    });

    console.log("Transporter created. Attempting to verify connection...");
    await transporter.verify();
    console.log("Connection verified successfully!");

    console.log("Attempting to send test email...");
    const info = await transporter.sendMail({
      from: "YourTube Admin <rs0688699@gmail.com>",
      to: "rs0688699@gmail.com",
      subject: "Test Email from Local Server",
      text: "If you receive this, SMTP is working perfectly.",
    });
    console.log("Email sent successfully! Message ID:", info.messageId);
  } catch (error) {
    console.error("Failed to send email. Error:", error);
  }
};

testEmail();
