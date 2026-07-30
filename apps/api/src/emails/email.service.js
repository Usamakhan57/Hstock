import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

/**
 * Email infrastructure placeholder.
 * Templates and SMTP sending will be implemented in a later phase.
 */
export async function sendEmail({ to, subject, html, text }) {
  logger.info('Email service scaffold invoked (not sending)', {
    to,
    subject,
    hasHtml: Boolean(html),
    hasText: Boolean(text),
    smtpConfigured: Boolean(env.SMTP_HOST && env.SMTP_USER),
  });

  return {
    queued: false,
    sent: false,
    provider: 'scaffold',
    message: 'Email sending is not implemented in Phase 1',
  };
}

export default {
  sendEmail,
};
