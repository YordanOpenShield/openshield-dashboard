/**
 * Simple HTML email templates for OpenShield.
 * No external dependencies — just injected CSS for maximum email-client compatibility.
 */

const BRAND_GRADIENT = "linear-gradient(135deg, #8b5cf6, #3b82f6)";

const BASE_STYLES = `
  body {
    margin: 0;
    padding: 0;
    background-color: #0a0a0a;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  }
`;

function wrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>${BASE_STYLES}</style>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 0;">
    <tr>
      <td align="center">
        <!-- Card -->
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#111111;border:1px solid rgba(255,255,255,0.1);border-radius:12px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding:40px 40px 0;">
              <span style="font-size:28px;font-weight:700;background:${BRAND_GRADIENT};-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">
                OpenShield
              </span>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding:20px 40px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="border-top:1px solid rgba(255,255,255,0.08);"></td></tr>
              </table>
            </td>
          </tr>
          ${content}
          <!-- Footer -->
          <tr>
            <td style="padding:0 40px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="border-top:1px solid rgba(255,255,255,0.08);padding-top:20px;"></td></tr>
              </table>
              <p style="margin:0;font-size:12px;color:#737373;text-align:center;line-height:1.6;">
                If you didn't request this email, you can safely ignore it.
                <br />
                &copy; ${new Date().getFullYear()} OpenShield. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Template registry ───────────────────────────────────────────────────────

const templates: Record<
  string,
  (data: Record<string, string>) => string
> = {
  "verify-email": ({ verificationUrl }) => wrapper(`
    <tr>
      <td style="padding:32px 40px 24px;">
        <h1 style="margin:0 0 8px;font-size:20px;color:#ededed;font-weight:600;">
          Verify your email
        </h1>
        <p style="margin:0;font-size:14px;color:#a1a1a1;line-height:1.6;">
          Thanks for signing up! Click the button below to verify your email address and activate your account.
        </p>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:8px 40px 32px;">
        <a href="${verificationUrl}"
           style="display:inline-block;padding:12px 32px;font-size:14px;font-weight:600;color:#ffffff;background:${BRAND_GRADIENT};border-radius:8px;text-decoration:none;">
          Verify Email
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 32px;">
        <p style="margin:0;font-size:12px;color:#737373;line-height:1.6;text-align:center;">
          Or copy this link into your browser:
          <br />
          <a href="${verificationUrl}" style="color:#8b5cf6;text-decoration:none;word-break:break-all;">${verificationUrl}</a>
        </p>
      </td>
    </tr>
  `),

  "reset-password": ({ resetUrl }) => wrapper(`
    <tr>
      <td style="padding:32px 40px 24px;">
        <h1 style="margin:0 0 8px;font-size:20px;color:#ededed;font-weight:600;">
          Reset your password
        </h1>
        <p style="margin:0;font-size:14px;color:#a1a1a1;line-height:1.6;">
          We received a request to reset your password. Click the button below to set a new one. This link expires in 1 hour.
        </p>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:8px 40px 32px;">
        <a href="${resetUrl}"
           style="display:inline-block;padding:12px 32px;font-size:14px;font-weight:600;color:#ffffff;background:${BRAND_GRADIENT};border-radius:8px;text-decoration:none;">
          Reset Password
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 32px;">
        <p style="margin:0;font-size:12px;color:#737373;line-height:1.6;text-align:center;">
          Or copy this link into your browser:
          <br />
          <a href="${resetUrl}" style="color:#8b5cf6;text-decoration:none;word-break:break-all;">${resetUrl}</a>
        </p>
      </td>
    </tr>
  `),
};

/**
 * Render an email template with the given data.
 */
export function render(
  templateName: string,
  data: Record<string, string>
): string {
  const fn = templates[templateName];
  if (!fn) {
    throw new Error(`Unknown email template: "${templateName}"`);
  }
  return fn(data);
}
