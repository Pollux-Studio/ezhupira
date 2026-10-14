# Ezhupira Publication Website Plan

## Summary

Build Ezhupira as a full Next.js commerce and community platform for a Tamil book launch: literary landing page, interactive flipbook preview, hardcopy/e-book preorder, Cashfree payment, Shiprocket dispatch/tracking, customer order dashboard, comments/likes/shares, and a user-confirmed Instagram Story sharing flow.

The repo is already a clean Next `16.3.6` + React `19.2.8` + Tailwind `4` app, so keep one integrated Next app instead of splitting frontend/backend. Cashfree will use server-created orders, hosted checkout, payment status lookup, and webhooks as documented in their web checkout flow.

## Tech Stack And Architecture

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS v4, Server Components by default, Client Components only for flipbook, checkout launcher, comments, likes, and share UI.
- Backend: Next Route Handlers and Server Actions on Node runtime for payments, orders, webhooks, Shiprocket, comments, likes, and admin actions.
- Database: Supabase Postgres with Prisma ORM for strongly typed schema, migrations, and transactional order/payment updates.
- Auth: passwordless customer accounts using email OTP first; phone number required for preorder/tracking. Admin protected by role-based auth.
- Payments: Cashfree hosted checkout using `cashfree-pg` server SDK and `@cashfreepayments/cashfree-js` client SDK. Verify webhook signatures before marking orders paid.
- Shipping: Shiprocket API. Paid physical preorders become shipments automatically on launch date through a scheduled job.
- Background jobs: Inngest for launch-date dispatch, payment reconciliation, Shiprocket tracking sync, email/SMS notifications, and retries.
- Storage: Supabase Storage for book preview images, protected e-book files, generated story cards, invoices, and shipment labels.
- Notifications: Resend for email; MSG91 or similar Indian SMS/WhatsApp provider for order updates.
- Deployment: Vercel for the Next app, Supabase for DB/storage, Inngest Cloud for jobs.

## Key Product Implementation

- Design and content:
  - Use real Tamil UI copy, not placeholder text: examples include `எழுபிற`, `புத்தக முன்பதிவு`, `முன்னோட்டப் பக்கங்கள்`, `என் ஆர்டர்`, `வெளியீட்டு நாள்`.
  - Use `Noto Serif Tamil` for literary headings and `Noto Sans Tamil` for UI/body text through `next/font`, with `lang="ta-IN"`.
  - Visual style: clean editorial layout, warm paper/off-black palette, subtle print textures, strong book cover presence in the first viewport.
- Book and purchase flow:
  - Support two editions: hardcopy and e-book.
  - Product page includes book details, launch date, price, preorder CTA, edition selector, author/publisher section, comments, likes, and share controls.
  - Checkout creates a local pending order first, then creates a Cashfree order server-side, then opens hosted Cashfree checkout with the returned payment session.
  - Cashfree return URL shows final status after checking the order; webhook is the source of truth for paid/failed/pending states.
- Flipbook preview:
  - Convert selected preview pages to optimized images or PDFs stored in Supabase/public assets.
  - Use an interactive page-flip component with touch, drag, keyboard arrows, mobile layout, and page thumbnails.
  - Preview is free, limited to approved pages only; full e-book file is protected and available only after payment and launch.
- Orders and tracking:
  - Customer can track using login, order ID, phone, or email.
  - Order statuses: `pending_payment`, `paid_preorder`, `ebook_ready`, `queued_for_dispatch`, `shipped`, `delivered`, `cancelled`, `refunded`.
  - On launch date, Inngest creates Shiprocket shipments for paid hardcopy orders, stores AWB/courier/tracking URL, and updates the customer dashboard.
- Social features:
  - Comments and likes require a signed-in customer; comments go through moderation before public display.
  - Normal share uses Web Share API where available, with fallback copy-link buttons.
  - "Add to Story" generates a 1080x1920 Tamil story image after successful preorder and opens a user-confirmed share/download flow. It will not silently post to a customer's Instagram account, because that is not a compliant web capability; Meta/Instagram publishing is limited and account-type/permission dependent.

## Public Interfaces And Data Model

- Main routes: `/`, `/book`, `/preview`, `/checkout`, `/order/[orderId]`, `/account`, `/admin`.
- API routes:
  - `POST /api/payments/cashfree/create-order`
  - `POST /api/webhooks/cashfree`
  - `GET /api/orders/[orderId]`
  - `POST /api/shiprocket/create-shipment`
  - `POST /api/webhooks/shiprocket`
  - `POST /api/social/comment`
  - `POST /api/social/like`
  - `GET /api/story-card/[orderId]`
- Core tables: `users`, `books`, `book_editions`, `preview_pages`, `orders`, `order_items`, `payments`, `shipments`, `ebook_entitlements`, `comments`, `likes`, `share_events`, `admin_audit_logs`.
- Admin dashboard manages book content, prices, launch date, preview pages, comments, orders, payment reconciliation, shipment creation, and story-card template text.

## Test Plan

- Unit tests: pricing, order status transitions, Cashfree webhook signature handling, launch-date dispatch eligibility, e-book entitlement rules.
- Integration tests: Cashfree sandbox order creation/return/webhook, Shiprocket sandbox shipment creation/tracking sync, protected e-book download.
- E2E tests: preorder hardcopy, preorder e-book, failed payment recovery, order tracking, flipbook mobile/desktop interaction, comment moderation, like/share/story-card flow.
- Build checks: `pnpm build`, `pnpm lint`, Prisma migration validation, and responsive visual checks for Tamil text wrapping.

## Assumptions

- Launch scope is full platform.
- Instagram Story sharing is user-confirmed, not silent auto-posting.
- Shiprocket API is the shipping provider.
- Currency is INR, primary market is India, and Cashfree hosted checkout is preferred over a fully custom payment UI.
- E-book access unlocks after successful payment once the launch date has arrived; if the launch date has passed, it unlocks immediately after payment.
