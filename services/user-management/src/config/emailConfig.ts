import nodemailer from "nodemailer";

const emailConfig = {
  host: process.env.MAIL_SERVER,
  port: parseInt(process.env.MAIL_PORT || "465"),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
};

// Create and configure transporter
const transporter = nodemailer.createTransport(emailConfig);

// Verify connection
transporter.verify((error: any, success: any) => {
  if (error) {
    console.error("Email configuration error:", error);
  } else {
    console.log("✅ Email server ready");
  }
});

export default transporter;
