// Transactional email through Resend (HTTPS API, so Render's SMTP port block doesn't apply).
import { Resend } from "resend";
import { env } from "../env.js";
import type { OrderDoc } from "../models.js";

const resend = new Resend(env.RESEND_API_KEY);

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const rupees = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#F7F3EA;font-family:Segoe UI,Arial,sans-serif;color:#1A1A1A">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px">
    <div style="display:inline-block;background:#D51C39;color:#fff;font-weight:700;padding:8px 12px;border-radius:4px">Ezhupira · எழுபிர</div>
    <h1 style="font-size:22px;margin:24px 0 12px">${esc(title)}</h1>
    ${body}
    <p style="margin-top:32px;font-size:13px;color:#57534E">Questions? Reply to this email.<br>Ezhupira · <a href="${env.SITE_URL}" style="color:#D51C39">${env.SITE_URL.replace(/^https?:\/\//, "")}</a></p>
  </div></body></html>`;
}

function orderSummary(order: OrderDoc) {
  const a = order.shippingAddress;
  const address = a?.line1 ? [a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).map(esc).join(", ") : "";
  return `<table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e7e2d8;font-size:14px">
    <tr><td style="padding:10px 14px;color:#57534E">Order ID</td><td style="padding:10px 14px;font-weight:600">${esc(order.code)}</td></tr>
    <tr><td style="padding:10px 14px;color:#57534E">Book</td><td style="padding:10px 14px">${esc(order.item?.title)} · ${esc(order.item?.edition)}</td></tr>
    <tr><td style="padding:10px 14px;color:#57534E">Amount</td><td style="padding:10px 14px">${rupees(order.amount)}</td></tr>
    ${address ? `<tr><td style="padding:10px 14px;color:#57534E">Ship to</td><td style="padding:10px 14px">${address}</td></tr>` : ""}
  </table>`;
}

const trackLink = (order: OrderDoc) =>
  `<p><a href="${env.SITE_URL}/orders/${encodeURIComponent(order.code)}" style="display:inline-block;background:#1A1A1A;color:#fff;text-decoration:none;padding:10px 18px;border-radius:4px">View your order</a></p>`;

async function send(to: string, subject: string, html: string) {
  const { error } = await resend.emails.send({ from: env.MAIL_FROM, to, subject, html });
  if (error) throw new Error(`Resend: ${error.message}`);
}

export async function sendOrderConfirmation(order: OrderDoc) {
  await send(
    order.customer.email,
    `Order confirmed · ${order.code}`,
    layout(
      `Thank you, ${order.customer.name}!`,
      `<p>Your payment was received and your order is confirmed.</p>${orderSummary(order)}${trackLink(order)}`,
    ),
  );
  if (env.MAIL_ADMIN) {
    await send(env.MAIL_ADMIN, `New order ${order.code} · ${rupees(order.amount)}`, layout("New paid order", orderSummary(order)));
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
  `<div style="background:#fff;border:1px solid #e7e2d8;padding:12px 14px;font-size:14px;white-space:pre-line">${esc(text)}</div>`;

/** "We got your message" to the reader, and a heads-up to you. */
export async function sendTicketReceived(t: TicketMail) {
  const first = t.messages[0]?.text ?? "";
  await send(
    t.email,
    `We got your message · ${t.code}`,
    layout(`Thanks, ${t.name}`, `<p>We received your message and will reply to this email address soon.</p><p style="color:#57534E">Ticket ${esc(t.code)}: ${esc(t.subject)}</p>${quote(first)}`),
  );
  if (env.MAIL_ADMIN) {
    await send(env.MAIL_ADMIN, `New support ticket ${t.code}: ${t.subject}`, layout("New support ticket", `<p>${esc(t.name)} &lt;${esc(t.email)}&gt;</p>${quote(first)}`));
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
