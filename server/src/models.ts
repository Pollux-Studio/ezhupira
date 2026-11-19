import mongoose, { Schema, type InferSchemaType } from "mongoose";

// ------------------------------------------------------------------ users ---

const userSchema = new Schema(
  {
    /** Firebase Auth user ID (stable per Google account). */
    firebaseUid: { type: String, required: true, unique: true },
    email: { type: String, required: true, lowercase: true, index: true },
    name: { type: String, required: true },
    picture: String,
    /** DiceBear "glyphs" seed, generated once on first sign-in; the avatar is drawn from it. */
    avatarSeed: { type: String },
    role: { type: String, enum: ["reader", "admin"], default: "reader" },
    lastLoginAt: Date,
    /** Bookshelf: books the reader has marked as read. */
    readBooks: [{ _id: false, bookSlug: { type: String, required: true }, readAt: { type: Date, default: Date.now } }],
  },
  { timestamps: true },
);
export type UserDoc = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId };
export const User = mongoose.model("User", userSchema);

// ----------------------------------------------------------------- orders ---

export const ORDER_STATUSES = ["pending", "paid", "failed", "cancelled", "shipped", "delivered", "refunded"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

const addressSchema = new Schema(
  { line1: String, line2: String, city: String, state: String, pincode: String },
  { _id: false },
);

const customerSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    /** Public order ID shown to customers, e.g. EZH-1024. Also the Cashfree order_id. */
    code: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    bookSlug: { type: String, required: true },
    editionId: { type: String, required: true },
    /** Snapshot of what was bought, so later price changes don't rewrite history. */
    item: { title: String, edition: String },
    amount: { type: Number, required: true }, // INR, rupees
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ORDER_STATUSES, default: "pending", index: true },

    customer: { type: customerSchema, required: true },
    shippingAddress: addressSchema,

    cashfree: {
      orderId: String,
      paymentSessionId: String,
      paymentId: String,
      paymentMethod: String,
    },
    paidAt: Date,
    confirmationEmailSentAt: Date,

    /** Status history shown on the Track order page. */
    events: [
      {
        _id: false,
        status: { type: String, enum: ORDER_STATUSES, required: true },
        note: String,
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);
export type OrderDoc = InferSchemaType<typeof orderSchema> & { _id: mongoose.Types.ObjectId };
export const Order = mongoose.model("Order", orderSchema);

// ---------------------------------------------------------------- reviews ---

const reviewSchema = new Schema(
  {
    bookSlug: { type: String, required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, maxlength: 80 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true, maxlength: 4000 },
    /** Reviews stay hidden until approved, which keeps spam off the book pages. */
    approved: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);
// One review per reader per book; a second submit edits the first.
reviewSchema.index({ bookSlug: 1, user: 1 }, { unique: true });
export const Review = mongoose.model("Review", reviewSchema);

// ------------------------------------------------------------------ books ---
// The catalogue, edited in the admin. Text only: covers and preview pages are image files in
// the website repo, referenced here by path. Mallikai key-code fields are filled in
// automatically from the Unicode text on save (see lib/mallikai.ts).

export const BOOK_STATUSES = ["published", "upcoming", "hidden"] as const;

const editionSchema = new Schema(
  {
    id: { type: String, enum: ["hardcopy", "ebook"], required: true },
    name: { type: String, required: true },
    description: String,
    price: { type: Number, default: 0, min: 0 }, // INR, rupees. 0 = not priced yet
    needsAddress: { type: Boolean, default: false },
  },
  { _id: false },
);

const bookSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ },
    title: { type: String, required: true },
    titleMallikai: String,
    author: { type: String, required: true },
    authorMallikai: String,
    description: { type: String, default: "" },
    descriptionMallikai: String,
    year: String,
    status: { type: String, enum: BOOK_STATUSES, default: "upcoming", index: true },
    /** Release moment for upcoming books (shown with the countdown). */
    releaseAt: Date,
    /** Price shown for books sold elsewhere (e.g. on Pothi). */
    displayPrice: { amount: Number, note: String },
    cover: String,
    publisher: { name: String, logo: String, url: String },
    buyUrl: String,
    buyLabel: String,
    preview: [String],
    highlights: [String],
    availability: String,
    details: [{ _id: false, label: String, value: String, valueMallikai: String }],
    /** What can be bought here, and for how much (the price charged comes from these). */
    editions: [editionSchema],
    /** Open for pre-orders/orders through Ezhupira's own checkout. */
    preorderOpen: { type: Boolean, default: false },
    /** Lower numbers first on the site. */
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);
export type BookDoc = InferSchemaType<typeof bookSchema> & { _id: mongoose.Types.ObjectId };
export const Book = mongoose.model("Book", bookSchema);

// ---------------------------------------------------------------- support ---

export const TICKET_STATUSES = ["open", "answered", "closed"] as const;

const ticketSchema = new Schema(
  {
    code: { type: String, required: true, unique: true }, // SUP-1001
    user: { type: Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, maxlength: 200 },
    topic: { type: String, enum: ["order", "payment", "book", "account", "other"], default: "other" },
    orderCode: String,
    subject: { type: String, required: true, maxlength: 200 },
    status: { type: String, enum: TICKET_STATUSES, default: "open", index: true },
    /** The conversation: the reader's first message, then replies. */
    messages: [
      {
        _id: false,
        from: { type: String, enum: ["reader", "admin"], required: true },
        text: { type: String, required: true, maxlength: 8000 },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);
export const Ticket = mongoose.model("Ticket", ticketSchema);

// --------------------------------------------------------------- counters ---

const counterSchema = new Schema({ _id: String, seq: { type: Number, default: 0 } });
const Counter = mongoose.model("Counter", counterSchema);

async function next(counter: string) {
  const c = await Counter.findOneAndUpdate({ _id: counter }, { $inc: { seq: 1 } }, { upsert: true, new: true });
  return 1000 + c.seq;
}

/** Next order code: EZH-1001, EZH-1002, … (atomic, safe under concurrent checkouts). */
export const nextOrderCode = async () => `EZH-${await next("order")}`;

/** Next support ticket code: SUP-1001, … */
export const nextTicketCode = async () => `SUP-${await next("ticket")}`;
