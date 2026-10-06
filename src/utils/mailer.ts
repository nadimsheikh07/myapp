import nodemailer from "nodemailer";
import { env } from "../config/env.ts";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendMail = async (opts: MailOptions): Promise<void> => {
  await transporter.sendMail({
    from: `"MyApp" <${env.SMTP_FROM}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
};

export const passwordResetEmail = (name: string, resetUrl: string): string => `
  <p>Hi ${name},</p>
  <p>Click the link below to reset your password. It expires in 15 minutes.</p>
  <p><a href="${resetUrl}">${resetUrl}</a></p>
  <p>If you didn't request this, ignore this email.</p>
`;
