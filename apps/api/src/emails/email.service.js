import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { buildEmailTemplate } from './templates.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!env.SMTP_HOST || !env.SMTP_USER) return null;

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: Number(env.SMTP_PORT) === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
  return transporter;
}

/**
 * Send a transactional email via SMTP when configured; otherwise log content.
 */
export async function sendEmail({ to, subject, html, text }) {
  const smtpConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER);

  logger.info('Email dispatch', {
    to,
    subject,
    hasHtml: Boolean(html),
    hasText: Boolean(text),
    smtpConfigured,
  });

  if (!smtpConfigured) {
    logger.debug('Email content (dev log)', {
      to,
      subject,
      text: text?.slice?.(0, 500),
    });
    return {
      queued: false,
      sent: false,
      provider: 'log',
      message: 'SMTP not configured — email content logged for development',
    };
  }

  const transport = getTransporter();
  const info = await transport.sendMail({
    from: env.EMAIL_FROM || 'noreply@apnastore.org',
    to,
    subject,
    html,
    text,
  });

  return {
    queued: false,
    sent: true,
    provider: 'smtp',
    messageId: info.messageId,
    message: 'Email sent via SMTP',
  };
}

export async function sendTemplatedEmail(type, { to, data = {} } = {}) {
  const template = buildEmailTemplate(type, data);
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function verifyEmailTransport() {
  if (!env.SMTP_HOST || !env.SMTP_USER) {
    return { configured: false, ok: false, provider: 'log' };
  }
  try {
    const transport = getTransporter();
    await transport.verify();
    return { configured: true, ok: true, provider: 'smtp' };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      provider: 'smtp',
      error: error.message,
    };
  }
}

export default {
  sendEmail,
  sendTemplatedEmail,
  verifyEmailTransport,
};
