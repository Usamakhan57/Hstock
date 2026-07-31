import { env } from '../config/env.js';

function layout({ title, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Segoe UI,Arial,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f7;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#111827;color:#fff;padding:20px 24px;font-size:18px;font-weight:700;">ApnaStore</td></tr>
        <tr><td style="padding:28px 24px;">
          <h1 style="margin:0 0 12px;font-size:20px;">${title}</h1>
          <div style="font-size:14px;line-height:1.6;color:#333;">${bodyHtml}</div>
        </td></tr>
        <tr><td style="padding:16px 24px;background:#f9fafb;font-size:12px;color:#6b7280;">
          © ${new Date().getFullYear()} ApnaStore · <a href="${env.FRONTEND_URL}" style="color:#6C3BFF;">apnastore.org</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function buildEmailTemplate(type, data = {}) {
  const frontend = env.FRONTEND_URL || 'http://localhost:3000';
  const templates = {
    registration: {
      subject: 'Welcome to ApnaStore',
      html: layout({
        title: 'Welcome to ApnaStore',
        bodyHtml: `<p>Hi ${data.name || 'there'},</p><p>Your account was created successfully. Start exploring the marketplace.</p>
          <p><a href="${frontend}" style="display:inline-block;padding:10px 18px;background:#6C3BFF;color:#fff;border-radius:999px;text-decoration:none;">Open ApnaStore</a></p>`,
      }),
      text: `Welcome to ApnaStore. Open ${frontend} to get started.`,
    },
    verification: {
      subject: 'Verify your ApnaStore email',
      html: layout({
        title: 'Verify your email',
        bodyHtml: `<p>Hi ${data.name || 'there'},</p><p>Confirm your email address to activate your account.</p>
          <p><a href="${data.verifyUrl || frontend}" style="display:inline-block;padding:10px 18px;background:#6C3BFF;color:#fff;border-radius:999px;text-decoration:none;">Verify email</a></p>
          <p style="color:#6b7280;font-size:12px;">If you did not create an account, ignore this message.</p>`,
      }),
      text: `Verify your email: ${data.verifyUrl || frontend}`,
    },
    password_reset: {
      subject: 'Reset your ApnaStore password',
      html: layout({
        title: 'Password reset',
        bodyHtml: `<p>Hi ${data.name || 'there'},</p><p>We received a request to reset your password.</p>
          <p><a href="${data.resetUrl || frontend}" style="display:inline-block;padding:10px 18px;background:#6C3BFF;color:#fff;border-radius:999px;text-decoration:none;">Reset password</a></p>
          <p style="color:#6b7280;font-size:12px;">This link expires soon. If you did not request it, ignore this email.</p>`,
      }),
      text: `Reset your password: ${data.resetUrl || frontend}`,
    },
    order_created: {
      subject: `Order ${data.orderNumber || ''} created`,
      html: layout({
        title: 'Order created',
        bodyHtml: `<p>Your order <strong>${data.orderNumber || ''}</strong> was created${data.amount ? ` for <strong>${data.amount} ${data.currency || 'USD'}</strong>` : ''}.</p>
          <p><a href="${frontend}/orders/${data.orderNumber || ''}">View order</a></p>`,
      }),
      text: `Order ${data.orderNumber || ''} created.`,
    },
    payment_success: {
      subject: `Payment successful — ${data.orderNumber || 'order'}`,
      html: layout({
        title: 'Payment successful',
        bodyHtml: `<p>Payment for order <strong>${data.orderNumber || ''}</strong> was confirmed. Funds are held in escrow until release.</p>
          <p><a href="${frontend}/orders/${data.orderNumber || ''}">View order</a></p>`,
      }),
      text: `Payment successful for order ${data.orderNumber || ''}.`,
    },
    payment_failed: {
      subject: `Payment failed — ${data.orderNumber || 'order'}`,
      html: layout({
        title: 'Payment failed',
        bodyHtml: `<p>Payment for order <strong>${data.orderNumber || ''}</strong> failed${data.reason ? `: ${data.reason}` : '.'}</p>
          <p><a href="${frontend}/orders/${data.orderNumber || ''}">Try again</a></p>`,
      }),
      text: `Payment failed for order ${data.orderNumber || ''}.`,
    },
    escrow_released: {
      subject: `Escrow released — ${data.orderNumber || 'order'}`,
      html: layout({
        title: 'Escrow released',
        bodyHtml: `<p>Escrow for order <strong>${data.orderNumber || ''}</strong> was released to the seller wallet.</p>`,
      }),
      text: `Escrow released for order ${data.orderNumber || ''}.`,
    },
    withdrawal_requested: {
      subject: 'Withdrawal request received',
      html: layout({
        title: 'Withdrawal requested',
        bodyHtml: `<p>Your withdrawal of <strong>${data.amount || ''} ${data.currency || 'USD'}</strong> was submitted and is pending review.</p>`,
      }),
      text: `Withdrawal of ${data.amount || ''} requested.`,
    },
    withdrawal_approved: {
      subject: 'Withdrawal approved',
      html: layout({
        title: 'Withdrawal approved',
        bodyHtml: `<p>Your withdrawal of <strong>${data.amount || ''} ${data.currency || 'USD'}</strong> was approved and will be paid shortly.</p>`,
      }),
      text: `Withdrawal of ${data.amount || ''} approved.`,
    },
    withdrawal_rejected: {
      subject: 'Withdrawal rejected',
      html: layout({
        title: 'Withdrawal rejected',
        bodyHtml: `<p>Your withdrawal was rejected${data.reason ? `: ${data.reason}` : '.'}</p>`,
      }),
      text: `Withdrawal rejected${data.reason ? `: ${data.reason}` : '.'}`,
    },
    withdrawal_paid: {
      subject: 'Withdrawal paid',
      html: layout({
        title: 'Withdrawal paid',
        bodyHtml: `<p>Your withdrawal of <strong>${data.amount || ''} ${data.currency || 'USD'}</strong> was marked as paid.</p>`,
      }),
      text: `Withdrawal of ${data.amount || ''} paid.`,
    },
    dispute_opened: {
      subject: `Dispute opened — ${data.orderNumber || 'order'}`,
      html: layout({
        title: 'Dispute opened',
        bodyHtml: `<p>A dispute was opened for order <strong>${data.orderNumber || ''}</strong>.</p>
          <p><a href="${frontend}/disputes/${data.disputeId || ''}">Open dispute center</a></p>`,
      }),
      text: `Dispute opened for order ${data.orderNumber || ''}.`,
    },
    dispute_resolved: {
      subject: `Dispute resolved — ${data.orderNumber || 'order'}`,
      html: layout({
        title: 'Dispute resolved',
        bodyHtml: `<p>The dispute for order <strong>${data.orderNumber || ''}</strong> was resolved${data.resolution ? ` (${data.resolution})` : ''}.</p>`,
      }),
      text: `Dispute resolved for order ${data.orderNumber || ''}.`,
    },
  };

  return templates[type] || {
    subject: data.subject || 'ApnaStore notification',
    html: layout({ title: data.title || 'Notification', bodyHtml: `<p>${data.body || ''}</p>` }),
    text: data.body || data.title || 'ApnaStore notification',
  };
}

export default { buildEmailTemplate };
