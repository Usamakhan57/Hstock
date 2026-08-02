import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/AppError.js';
import { buildEmailTemplate } from './templates.js';

let transporter = null;

/** Return missing SMTP env var names (empty/blank count as missing). */
export function getMissingSmtpConfig(source = env) {
  const missing = [];
  if (!String(source.SMTP_HOST || '').trim()) missing.push('SMTP_HOST');
  if (!String(source.SMTP_USER || '').trim()) missing.push('SMTP_USER');
  if (!String(source.SMTP_PASS || '').trim()) missing.push('SMTP_PASS');
  return missing;
}

export function isSmtpConfigured(source = env) {
  return getMissingSmtpConfig(source).length === 0;
}

function resetTransporter() {
  transporter = null;
}

function getTransporter() {
  if (transporter) return transporter;
  if (!isSmtpConfigured()) return null;

  const port = Number(env.SMTP_PORT) || 587;
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    tls: {
      minVersion: 'TLSv1.2',
    },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
  });
  return transporter;
}

/**
 * Send a transactional email via SMTP when configured.
 * In production, missing SMTP or send failure throws — never silently succeeds.
 * In development/test, missing SMTP logs content and returns sent:false for local flows.
 */
export async function sendEmail({ to, subject, html, text, replyTo } = {}) {
  const missing = getMissingSmtpConfig();
  const smtpConfigured = missing.length === 0;

  logger.info('Email dispatch', {
    to,
    subject,
    hasHtml: Boolean(html),
    hasText: Boolean(text),
    smtpConfigured,
    missingSmtp: missing,
  });

  if (!to || !String(to).includes('@')) {
    logger.warn('Email rejected: invalid recipient', { to, subject });
    throw new AppError('Invalid email address', 400, {
      code: 'INVALID_EMAIL',
      details: { to },
    });
  }

  if (!smtpConfigured) {
    logger.error('SMTP not configured — cannot send email', {
      to,
      subject,
      missing,
      production: env.isProduction,
    });

    if (env.isProduction) {
      throw new AppError(
        `Email service is not configured. Missing: ${missing.join(', ')}`,
        503,
        {
          code: 'SMTP_NOT_CONFIGURED',
          details: { missing },
        },
      );
    }

    logger.debug('Email content (dev/test log fallback)', {
      to,
      subject,
      text: text?.slice?.(0, 500),
    });
    return {
      queued: false,
      sent: false,
      provider: 'log',
      missing,
      message: 'SMTP not configured — email content logged for development',
    };
  }

  const transport = getTransporter();
  try {
    const info = await transport.sendMail({
      from: env.EMAIL_FROM || 'noreply@apnastore.org',
      to,
      replyTo: replyTo || env.EMAIL_REPLY_TO || undefined,
      subject,
      html,
      text,
    });

    logger.info('Email sent via SMTP', {
      to,
      subject,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });

    return {
      queued: false,
      sent: true,
      provider: 'smtp',
      messageId: info.messageId,
      message: 'Email sent via SMTP',
    };
  } catch (error) {
    logger.error('SMTP send failed', {
      to,
      subject,
      code: error.code || null,
      command: error.command || null,
      response: error.response || null,
      message: error.message,
    });
    resetTransporter();
    throw new AppError('Failed to send email. Please try again later.', 503, {
      code: 'SMTP_SEND_FAILED',
      details: {
        reason: error.message,
        code: error.code || null,
      },
    });
  }
}

export async function sendTemplatedEmail(type, { to, data = {}, replyTo } = {}) {
  const template = buildEmailTemplate(type, data);
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    replyTo,
  });
}

export async function verifyEmailTransport() {
  const missing = getMissingSmtpConfig();
  if (missing.length) {
    return {
      configured: false,
      ok: false,
      provider: 'none',
      missing,
    };
  }
  try {
    const transport = getTransporter();
    await transport.verify();
    logger.info('SMTP transport verified');
    return { configured: true, ok: true, provider: 'smtp' };
  } catch (error) {
    logger.error('SMTP transport verify failed', {
      code: error.code || null,
      message: error.message,
    });
    resetTransporter();
    return {
      configured: true,
      ok: false,
      provider: 'smtp',
      error: error.message,
      code: error.code || null,
    };
  }
}

export default {
  sendEmail,
  sendTemplatedEmail,
  verifyEmailTransport,
  isSmtpConfigured,
  getMissingSmtpConfig,
};
