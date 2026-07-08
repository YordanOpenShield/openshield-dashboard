import nodemailer from "nodemailer";
import { render } from "./email-templates";

/**
 * Create a reusable Nodemailer transporter from SMTP environment variables.
 */
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || "noreply@openshield.dev";

  if (!host) {
    console.warn(
      "[email] SMTP_HOST is not set — emails will not be sent. " +
        "Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in your .env file."
    );
    return null;
  }

  // Explicit SMTP_SECURE overrides the port-based heuristic.
  // Accepted values: "true" / "false". Anything else falls back to port 465 check.
  const secureEnv = process.env.SMTP_SECURE?.toLowerCase();
  const secure =
    secureEnv === "true" ? true
    : secureEnv === "false" ? false
    : port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });
}

/**
 * Send an email via SMTP.
 *
 * Returns `true` if sent successfully, `false` if SMTP is not configured,
 * and throws on unexpected errors.
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  const transporter = createTransporter();
  if (!transporter) return false;

  const from = process.env.SMTP_FROM || "noreply@openshield.dev";
  const fromName = process.env.SMTP_FROM_NAME || "OpenShield";

  await transporter.sendMail({
    from: `"${fromName}" <${from}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text ?? options.html.replace(/<[^>]*>/g, ""),
  });

  return true;
}

// ─── Email Sending Helpers ───────────────────────────────────────────────────

/**
 * Send an email verification link.
 */
export async function sendVerificationEmail(
  email: string,
  url: string
): Promise<boolean> {
  const html = render("verify-email", {
    verificationUrl: url,
  });

  return sendEmail({
    to: email,
    subject: "Verify your email address",
    html,
  });
}

/**
 * Send a password reset link.
 */
export async function sendPasswordResetEmail(
  email: string,
  url: string
): Promise<boolean> {
  const html = render("reset-password", {
    resetUrl: url,
  });

  return sendEmail({
    to: email,
    subject: "Reset your password",
    html,
  });
}
