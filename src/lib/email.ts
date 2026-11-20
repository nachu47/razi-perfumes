import 'server-only';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

const FROM = process.env.EMAIL_FROM || 'Razi Perfumes <no-reply@raziperfumes.com>';

let resend: Resend | null = null;
let smtp: nodemailer.Transporter | null = null;

/**
 * Sends an email via Resend (if RESEND_API_KEY is set), else SMTP (if SMTP_HOST is set),
 * else logs it to the server console so local development works without credentials.
 * Never throws: an email failure must not break checkout or a form submission.
 */
export async function sendEmail(msg: EmailMessage): Promise<boolean> {
  try {
    if (process.env.RESEND_API_KEY) {
      resend ??= new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: FROM,
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
        replyTo: msg.replyTo,
      });
      if (error) throw new Error(error.message);
      return true;
    }
    if (process.env.SMTP_HOST) {
      smtp ??= nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      });
      await smtp.sendMail({ from: FROM, to: msg.to, subject: msg.subject, html: msg.html, text: msg.text, replyTo: msg.replyTo });
      return true;
    }
    console.info(
      `\n──── [email:dev] ────\nTo: ${msg.to}\nSubject: ${msg.subject}\n${msg.text || msg.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}\n─────────────────────\n`,
    );
    return true;
  } catch (err) {
    console.error('[email] failed to send', msg.subject, err);
    return false;
  }
}

export function adminNotifyEmail(): string | null {
  return process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || null;
}
