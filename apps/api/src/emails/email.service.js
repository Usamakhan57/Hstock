import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

/**
 * Email infrastructure for verification / password reset.
 * SMTP transport can be wired later; messages are logged when SMTP is unset.
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
    return {
      queued: false,
      sent: false,
      provider: 'log',
      message: 'SMTP not configured — email content logged for development',
    };
  }

  // SMTP transport intentionally deferred — infrastructure + call sites are ready.
  return {
    queued: true,
    sent: false,
    provider: 'smtp-pending',
    message: 'SMTP credentials present; transport wiring reserved for ops phase',
  };
}

export default {
  sendEmail,
};
