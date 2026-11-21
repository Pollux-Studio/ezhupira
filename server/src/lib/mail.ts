// Transactional email through Resend (HTTPS API, so Render's SMTP port block doesn't apply).
import { Resend } from "resend";
import { env } from "../env.js";
import type { OrderDoc } from "../models.js";

const resend = new Resend(env.RESEND_API_KEY);

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const rupees = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

// Images in emails must be on a public https address (Gmail fetches them through its own
// proxy), so local development still points at the live site. They live in the website's
// public/email/ (made by scripts/render-email-assets.py).
const ASSETS = env.SITE_URL.startsWith("https://") ? env.SITE_URL : "https://ezhupira.in";
const RED = "#D51C39";
const INK = "#1A1A1A";
const MUTED = "#6B6560";
const LINE = "#ECE6DA";

/**
 * Every email: logo header, a white card, and (for readers) Prasanth's signature at the end.
 * The signature is a GIF that writes itself once and stays (email can't run CSS/JS
 * animation; GIFs play in Gmail, Apple Mail and Outlook on the web). Tables and inline
 * styles because that's what email clients render reliably.
 */
function layout(title: string, body: string, { signed = true }: { signed?: boolean } = {}) {
  const site = env.SITE_URL.replace(/^https?:\/\//, "");
  const signature = signed
    ? `<tr><td style="padding:8px 32px 28px">
        <img src="${ASSETS}/email/signature.gif" width="200" height="104" alt="அன்புடன் பிரசாந்த் (With love, Prasanth)" style="display:block;width:200px;height:auto;border:0">
        <p style="margin:6px 0 0;font-size:13px;color:${MUTED}">Prasanth J · Ezhupira</p>
      </td></tr>`
    : "";
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#F7F3EA;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${INK};-webkit-text-size-adjust:100%">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F3EA"><tr><td align="center" style="padding:32px 16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
    <tr><td style="padding:0 4px 20px">
      <a href="${env.SITE_URL}" style="text-decoration:none;color:${INK}">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="vertical-align:middle"><img src="${ASSETS}/email/logo.png" width="44" height="44" alt="Ezhupira" style="display:block;border:0;border-radius:6px"></td>
          <td style="vertical-align:middle;padding-left:12px;font-size:17px;font-weight:700;line-height:1.2">Ezhupira<br><span style="font-size:13px;font-weight:400;color:${MUTED}">எழுபிர</span></td>
        </tr></table>
      </a>
    </td></tr>
    <tr><td style="background:#FFFFFF;border:1px solid ${LINE};border-top:4px solid ${RED};border-radius:6px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:28px 32px 8px">
          <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3">${esc(title)}</h1>
          <div style="font-size:15px;line-height:1.6">${body}</div>
        </td></tr>
        ${signature}
      </table>
    </td></tr>
    <tr><td style="padding:20px 4px 0;font-size:12px;line-height:1.6;color:${MUTED}">
      Questions? Just reply to this email.<br>
      <a href="${env.SITE_URL}" style="color:${RED};text-decoration:none">${esc(site)}</a> ·
      <a href="${env.SITE_URL}/track-order" style="color:${MUTED}">Track an order</a> ·
      <a href="${env.SITE_URL}/faq" style="color:${MUTED}">FAQ</a>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

function orderSummary(order: OrderDoc) {
  const a = order.shippingAddress;
  const address = a?.line1 ? [a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).map(esc).join(", ") : "";
  const row = (label: string, value: string, last = false) =>
    `<tr><td style="padding:10px 14px;color:${MUTED};white-space:nowrap;vertical-align:top;${last ? "" : `border-bottom:1px solid ${LINE};`}">${label}</td>` +
    `<td style="padding:10px 14px;text-align:right;${last ? "" : `border-bottom:1px solid ${LINE};`}">${value}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;border:1px dashed #D9D2C3;border-radius:6px;font-size:14px;background:#FCFAF6">
    ${row("Order ID", `<span style="font-family:Consolas,Menlo,monospace;font-weight:600">${esc(order.code)}</span>`)}
    ${row("Book", `${esc(order.item?.title)}<br><span style="color:${MUTED}">${esc(order.item?.edition)}</span>`)}
    ${address ? row("Ship to", address) : ""}
    ${row("Total", `<strong style="font-size:16px">${rupees(order.amount)}</strong>`, true)}
  </table>`;
}

const trackLink = (order: OrderDoc) =>
  `<p style="margin:0 0 8px"><a href="${env.SITE_URL}/orders/${encodeURIComponent(order.code)}" style="display:inline-block;background:${RED};color:#FFFFFF;text-decoration:none;font-weight:600;padding:11px 20px;border-radius:6px">View your order</a></p>`;

async function send(to: string, subject: string, html: string) {
  const { error } = await resend.emails.send({ from: env.MAIL_FROM, to, subject, html });
  if (error) throw new Error(`Resend: ${error.message}`);
}

/** The reader's confirmation email (separate so it can be previewed without sending). */
export const orderConfirmationHtml = (order: OrderDoc) =>
  layout(
    `Thank you, ${order.customer.name}!`,
    `<p style="margin:0">Your payment was received and your order is confirmed. Thank you for reading my work.</p>${orderSummary(order)}${trackLink(order)}`,
  );

export async function sendOrderConfirmation(order: OrderDoc) {
  await send(order.customer.email, `Order confirmed · ${order.code}`, orderConfirmationHtml(order));
  if (env.MAIL_ADMIN) {
    await send(env.MAIL_ADMIN, `New order ${order.code} · ${rupees(order.amount)}`, layout("New paid order", orderSummary(order), { signed: false }));
  }
}

export async function sendStatusUpdate(order: OrderDoc, note?: string) {
  const titles: Partial<Record<string, string>> = {
    shipped: "Your book is on its way",
    delivered: "Your order was delivered",
    refunded: "Your order was refunded",
    cancelled: "Your order was cancelled",
  };
  const title = titles[order.status];
  if (!title) return;
  await send(
    order.customer.email,
    `${title} · ${order.code}`,
    layout(title, `${note ? `<p>${esc(note)}</p>` : ""}${orderSummary(order)}${trackLink(order)}`),
  );
}

// ---------------------------------------------------------------- support ---

type TicketMail = { code: string; name: string; email: string; subject: string; messages: { from: string; text: string }[] };

const quote = (text: string) =>
  `<div style="margin:14px 0;background:#FCFAF6;border-left:3px solid ${RED};padding:12px 14px;font-size:14px;white-space:pre-line">${esc(text)}</div>`;

/** "We got your message" to the reader, and a heads-up to you. */
export async function sendTicketReceived(t: TicketMail) {
  const first = t.messages[0]?.text ?? "";
  await send(
    t.email,
    `We got your message · ${t.code}`,
    layout(`Thanks, ${t.name}`, `<p>We received your message and will reply to this email address soon.</p><p style="color:#57534E">Ticket ${esc(t.code)}: ${esc(t.subject)}</p>${quote(first)}`),
  );
  if (env.MAIL_ADMIN) {
    await send(env.MAIL_ADMIN, `New support ticket ${t.code}: ${t.subject}`, layout("New support ticket", `<p>${esc(t.name)} &lt;${esc(t.email)}&gt;</p>${quote(first)}`, { signed: false }));
  }
}

/** Your reply, emailed to the reader. */
export async function sendTicketReply(t: TicketMail, reply: string) {
  await send(
    t.email,
    `Re: ${t.subject} · ${t.code}`,
    layout(`Reply to your message`, `${quote(reply)}<p style="color:#57534E;font-size:13px">Your ticket: ${esc(t.code)} · ${esc(t.subject)}</p>`),
  );
}
