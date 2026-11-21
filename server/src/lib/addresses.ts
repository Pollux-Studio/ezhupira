// The reader's address book. Checkout saves each new shipping address here (the first one
// becomes the default), so the next order can reuse it; the profile page manages the list.
import { z } from "zod";
import { normalizePhone } from "./cashfree.js";
import { User } from "../models.js";

export const MAX_ADDRESSES = 10;

/** The address fields, with the same rules as checkout (6-digit Indian PIN code). */
export const addressFields = z.object({
  line1: z.string().trim().min(3, "Enter the house number and street").max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2, "Enter the city").max(80),
  state: z.string().trim().min(2, "Enter the state").max(80),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a 6-digit PIN code"),
});

/** A full address book entry: who receives it, their phone, and where. */
export const savedAddressInput = addressFields.extend({
  name: z.string().trim().min(3, "Enter the full name").max(100),
  phone: z.string().trim().transform((v, ctx) => {
    const phone = normalizePhone(v);
    if (!phone) ctx.addIssue({ code: "custom", message: "Enter a valid mobile number, with the right country code." });
    return phone ?? "";
  }),
});
export type SavedAddressInput = z.infer<typeof savedAddressInput>;

type Stored = SavedAddressInput & { _id: { toString(): string }; isDefault?: boolean | null; line2?: string | null };

export const publicAddress = (a: Stored) => ({
  id: a._id.toString(),
  name: a.name,
  phone: a.phone,
  line1: a.line1,
  line2: a.line2 || undefined,
  city: a.city,
  state: a.state,
  pincode: a.pincode,
  isDefault: !!a.isDefault,
});

/** Same place, ignoring case and spacing, so a repeat order doesn't add a duplicate. */
const placeKey = (a: { line1: string; line2?: string | null; city: string; pincode: string }) =>
  [a.line1, a.line2 ?? "", a.city, a.pincode].map((s) => s.toLowerCase().replace(/\s+/g, " ").trim()).join("|");

export async function listAddresses(userId: string) {
  const user = await User.findById(userId, { addresses: 1 }).lean();
  const list = ((user?.addresses ?? []) as Stored[]).map(publicAddress);
  // Default first, then newest.
  return list.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
}

/**
 * Saves the address from an order: updates the matching entry (name/phone may have changed)
 * or adds it, making it the default if the reader has none. Never throws on a full book.
 */
export async function rememberAddress(userId: string, input: SavedAddressInput) {
  const user = await User.findById(userId, { addresses: 1 });
  if (!user) return;
  const key = placeKey(input);
  const existing = user.addresses.find((a) => placeKey(a) === key);
  if (existing) {
    existing.set({ name: input.name, phone: input.phone, state: input.state });
  } else {
    if (user.addresses.length >= MAX_ADDRESSES) return;
    user.addresses.push({ ...input, isDefault: !user.addresses.some((a) => a.isDefault) });
  }
  await user.save();
}
