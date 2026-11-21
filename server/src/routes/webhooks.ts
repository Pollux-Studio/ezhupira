import express, { Router } from "express";
import { verifyWebhook } from "../lib/cashfree.js";
import { syncFromCashfree } from "../lib/orders.js";
import { Order, type OrderDoc } from "../models.js";

// Mounted before express.json(): the signature is over the exact raw bytes.
export const webhooksRouter = Router();

webhooksRouter.post("/cashfree", express.raw({ type: "*/*", limit: "1mb" }), async (req, res) => {
  const raw = req.body as Buffer;
  if (!verifyWebhook(raw, req.header("x-webhook-timestamp"), req.header("x-webhook-signature"))) {
    return res.status(401).json({ error: "Bad signature" });
  }

  let orderId: string | undefined;
  try {
    orderId = JSON.parse(raw.toString("utf8"))?.data?.order?.order_id;
  } catch {
    return res.status(400).json({ error: "Bad JSON" });
  }
  if (!orderId) return res.json({ ok: true, ignored: true }); // e.g. a test ping

  // New orders are known to Cashfree by cashfree.ref; older ones by their code.
  const order = (await Order.findOne({ $or: [{ "cashfree.ref": orderId }, { code: orderId }] })) as OrderDoc | null;
  if (!order) return res.json({ ok: true, ignored: true });

  try {
    // Don't trust the payload's status: ask Cashfree directly.
    const updated = await syncFromCashfree(order);
    res.json({ ok: true, status: updated.status });
  } catch (err) {
    console.error(`Webhook sync for ${orderId} failed:`, err);
    res.status(500).json({ error: "Sync failed" }); // non-2xx makes Cashfree retry
  }
});
