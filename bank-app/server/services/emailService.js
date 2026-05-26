import { buildOTPEmail } from '../templates/otpEmail.js';

let _resend = null;

async function loadResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (_resend) return _resend;
  const { Resend } = await import('resend');
  _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

/**
 * Send the OTP verification email.
 *
 * Falls back to terminal logging when RESEND_API_KEY is unset so local
 * development works without email credentials.
 *
 * @returns {{ ok: boolean, method: 'email'|'terminal', messageId?: string }}
 */
export async function sendOTPEmail({ to, firstName = '', code, expiryMinutes = 5 }) {
  const resend = await loadResend();

  if (!resend) {
    console.log(`\n[OTP] ─────────────────────────────────────────`);
    console.log(`[OTP] User    : ${to}`);
    console.log(`[OTP] Code    : ${code}`);
    console.log(`[OTP] Expires : ${expiryMinutes} minutes`);
    console.log(`[OTP] ─────────────────────────────────────────\n`);
    return { ok: true, method: 'terminal' };
  }

  const from = process.env.EMAIL_FROM || 'Bank of Molten <noreply@bankofmolten.com>';
  const html = buildOTPEmail({ code, expiryMinutes, recipientName: firstName });

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: `${code} — Your Bank of Molten verification code`,
    html,
  });

  if (error) {
    console.error('[emailService] Resend delivery error:', error);
    throw new Error(`Email delivery failed: ${error.message}`);
  }

  return { ok: true, method: 'email', messageId: data?.id };
}
