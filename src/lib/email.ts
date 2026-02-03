import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendResetPasswordEmail(to: string, token: string) {
  const resetUrl = `${process.env.BASE_URL || "http://localhost:3000"}/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || '"DokodemoDoor" <noreply@dokodemodoor.com>',
    to,
    subject: "Reset your password - DokodemoDoor",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e3a8a;">
        <div style="background-color: #60a5fa; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">DokodemoDoor</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #bfdbfe; border-top: none; border-radius: 0 0 10px 10px; background-color: #eff6ff;">
          <h2>Password Reset Request</h2>
          <p>Hello,</p>
          <p>You requested to reset your password. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #fbbf24; color: #451a03; padding: 15px 25px; text-decoration: none; border-radius: 50px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Reset Password</a>
          </div>
          <p>If you didn't request this, you can ignore this email.</p>
          <p>The link will expire in 1 hour.</p>
          <hr style="border: none; border-top: 1px solid #bfdbfe; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">This is an automated message, please do not reply.</p>
        </div>
      </div>
    `,
  };

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP credentials not set. Reset link:", resetUrl);
    return;
  }

  await transporter.sendMail(mailOptions);
}
