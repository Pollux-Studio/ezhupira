# Ezhupira API

Node.js (Express 5) server for sign-in, orders, payments and reviews. The website
(`ezhupira.in`, Next.js on Vercel) calls it at `api.ezhupira.in` (Render).

| Piece | Service |
|---|---|
| Sign-in | Google via Firebase Auth (Firebase ID token → httpOnly session cookie on `.ezhupira.in`) |
| Database | MongoDB Atlas (Mongoose) |
| Payments | Cashfree Payment Gateway (Orders API + webhook) |
| Email | Resend |
| Hosting | Render web service, kept awake by a `/health` ping |

## Run locally

```bash
cd server
cp .env.example .env        # fill in the values
pnpm install --ignore-workspace
pnpm dev                    # http://localhost:4000
```

Then in the repo root: `cp .env.example .env.local` and `pnpm dev` for the site on :3000.
Google sign-in works on localhost out of the box (Firebase allows `localhost` by default).
On Windows, if Atlas fails with `querySrv ECONNREFUSED`, set `DNS_SERVERS=8.8.8.8,1.1.1.1` in `.env`.

## Endpoints

| Method | Path | Who | What |
|---|---|---|---|
| GET | `/health` | anyone | Liveness + DB state (keep-alive target) |
| POST | `/auth/firebase` | anyone | `{ idToken }` from Firebase Google sign-in → sets session cookie |
| GET | `/auth/me` | signed in | Current user |
| POST | `/auth/logout` | anyone | Clears the session |
| GET | `/catalog` | anyone | Editions and prices |
| POST | `/orders` | signed in | Create order + Cashfree session → `{ code, paymentSessionId }` |
| GET | `/orders/mine` | signed in | Your orders |
| GET | `/orders/:code` | owner/admin | Order (re-checks Cashfree while pending) |
| POST | `/orders/:code/pay` | owner | Retry payment while the session is open |
| POST | `/orders/track` | anyone | `{ code, contact }` → status and history only |
| POST | `/webhooks/cashfree` | Cashfree | Signed payment notifications |
| GET | `/reviews?book=slug` | anyone | Approved reviews + average + writer avatar seeds |
| POST | `/reviews` | signed in | Write/update your review under your account name (hidden until approved) |
| GET | `/me/reviews` | signed in | Your reviews with status (pending/published) |
| DELETE | `/me/reviews/:id` | signed in | Delete your own review |
| GET | `/me/shelf` | signed in | Books you've marked read |
| PUT | `/me/shelf/:slug` | signed in | `{ read: true\|false }` |
| GET/PATCH | `/admin/orders[/:code]` | admin | List orders; set status (`shipped` + tracking note emails the customer) |
| GET/PATCH/DELETE | `/admin/reviews[/:id]` | admin | Moderate reviews |

Admins are the emails in `ADMIN_EMAILS`.

## Payment flow

1. `POST /orders` saves a `pending` order (`EZH-1001`…) with the price from `src/catalog.ts`
   (never from the browser) and creates a Cashfree order.
2. The site opens Cashfree checkout with the `paymentSessionId`.
3. Cashfree calls `/webhooks/cashfree`; the signature is checked, then the order status is
   read back from Cashfree's API. `pending → paid` is atomic, so the confirmation email is
   sent exactly once.
4. Cashfree redirects the customer to `ezhupira.in/orders/EZH-1001`, which also re-checks.

## Go-live checklist

1. **MongoDB Atlas**: create an M0 cluster in **Mumbai (ap-south-1)**, a database user, and
   under Network Access allow `0.0.0.0/0` (Render's free tier has no fixed IPs; use a strong
   password). Copy the `mongodb+srv://…` string into `MONGODB_URI`.
2. **Firebase console** (project `ezhupira`) → Authentication → Sign-in method → enable
   **Google**. Under Settings → Authorized domains add `ezhupira.in` and `www.ezhupira.in`.
   The server only needs `FIREBASE_PROJECT_ID=ezhupira` (tokens are checked against Google's
   public keys; no service account). The web config in `lib/firebase.ts` is public by design.
3. **Resend**: add and verify the domain `ezhupira.in` (DNS records), create an API key.
4. **Cashfree**: copy sandbox App ID + Secret Key. In Developers → Webhooks add
   `https://api.ezhupira.in/webhooks/cashfree`. Whitelist the domain `ezhupira.in` if asked.
   After KYC approval, switch to production keys and set `CASHFREE_ENV=production`.
5. **Render**: New → Blueprint → this repo (uses `render.yaml`). Fill in the secret env vars.
   Add the custom domain `api.ezhupira.in` and create the CNAME it shows in your DNS.
   The session cookie only works across the site and API when both are on `ezhupira.in`.
6. **Vercel**: nothing to set. Production builds call `https://api.ezhupira.in` by default
   (`lib/api.ts`); set `NEXT_PUBLIC_API_URL` only to point a deployment at a different API.
7. **Prices**: set the book's slug, title, prices and `onSale: true` in `src/catalog.ts`.
   When a book is added to the website, also add its slug to `KNOWN_BOOKS` there.

## Keeping Render awake

Render's free tier sleeps after 15 minutes without traffic and takes ~50 s to wake. The
server pings its own `PUBLIC_URL/health` every `KEEP_ALIVE_MINUTES` (10) in production.
After a crash or platform restart the self-ping stops until the next request, so also add an
external monitor (UptimeRobot or cron-job.org, free) hitting `https://api.ezhupira.in/health`
every 5–10 minutes. One always-on service uses ~744 of the free 750 instance hours a month,
so this only works for a single free service per workspace.
