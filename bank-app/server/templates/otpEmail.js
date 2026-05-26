/**
 * Bank of Molten — OTP verification email template.
 * Returns a self-contained HTML string safe to send via any provider.
 */
export function buildOTPEmail({ code, expiryMinutes = 5, recipientName = '' }) {
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi,';
  const digits = String(code).split('');

  const digitCells = digits
    .map(
      (d) =>
        `<td style="width:44px;height:56px;text-align:center;vertical-align:middle;
                    background:#f0f4ff;border:2px solid #002D72;border-radius:8px;
                    font-size:28px;font-weight:700;color:#002D72;letter-spacing:0;
                    padding:0 6px;mso-padding-alt:0;">${d}</td>`
    )
    .join('<td style="width:8px;"></td>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Your Bank of Molten Verification Code</title>
</head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Card -->
        <table role="presentation" width="100%" style="max-width:520px;" cellpadding="0" cellspacing="0" border="0">

          <!-- Header -->
          <tr>
            <td style="background:#002D72;border-radius:12px 12px 0 0;padding:28px 36px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:0.5px;">
                      BANK OF MOLTEN
                    </p>
                    <p style="margin:4px 0 0;font-size:13px;color:#a0b4d6;font-weight:400;">
                      Security Verification
                    </p>
                  </td>
                  <td align="right">
                    <div style="width:44px;height:44px;background:rgba(255,255,255,0.12);
                                border-radius:10px;display:inline-block;line-height:44px;
                                text-align:center;font-size:22px;">
                      🔐
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:36px 36px 28px;border-left:1px solid #e8ecf0;border-right:1px solid #e8ecf0;">

              <p style="margin:0 0 8px;font-size:15px;color:#1a2340;font-weight:600;">${greeting}</p>
              <p style="margin:0 0 28px;font-size:15px;color:#4a5568;line-height:1.6;">
                You requested a verification code to sign in to your account.
                Use the code below — it expires in <strong style="color:#002D72;">${expiryMinutes} minutes</strong>.
              </p>

              <!-- OTP digits -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"
                     style="margin:0 auto 28px;">
                <tr>${digitCells}</tr>
              </table>

              <!-- Security note -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#fff8e6;border:1px solid #f59e0b;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:12px 16px;">
                    <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">
                      <strong>⚠️ Never share this code.</strong>
                      Bank of Molten staff will never ask for your verification code.
                      If you didn't request this, your account password may be compromised.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:#718096;line-height:1.6;">
                This code is valid for a single use and expires automatically.
                If you need a new code, return to the sign-in page and request another.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border:1px solid #e8ecf0;border-top:none;
                       border-radius:0 0 12px 12px;padding:20px 36px;">
              <p style="margin:0;font-size:12px;color:#9aa5b4;line-height:1.6;text-align:center;">
                This is an automated security message from Bank of Molten.
                Do not reply to this email.
                <br />© ${new Date().getFullYear()} Bank of Molten. All rights reserved.
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
