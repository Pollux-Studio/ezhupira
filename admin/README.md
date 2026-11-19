# Ezhupira admin

Separate Next.js app for running ezhupira.in, deployed on its own at **admin.ezhupira.in**.
It uses the same API as the website (`api.ezhupira.in`) and is reachable only by its URL:
nothing on the public site links to it, and every page is `noindex`.

| Page | What it does |
|---|---|
| Overview | Revenue, paid orders, awaiting payment, reviews to approve, open tickets, 30-day revenue chart, sales by book |
| Orders | Search and filter; open an order to see the customer, address, history and live Cashfree payment attempts; mark shipped/delivered with a tracking note (emails the customer) |
| Payments | Money received and refunded, with Cashfree payment IDs and methods |
| Books | Add an upcoming book; edit its text, prices, release date and image paths; **start/stop pre-orders** for that book |
| Reviews | Approve, unpublish or delete reviews |
| Support | Messages from ezhupira.in/support; reply by email; close or reopen |

## Access

Sign in with Google. Only accounts listed in `ADMIN_EMAILS` on the API get in; the API enforces
the same rule on every `/admin` request.

## Run locally

```bash
cd admin
pnpm install --ignore-workspace
pnpm dev            # http://localhost:3002, talks to the API on http://localhost:4000
```

The API must allow the origin: `EXTRA_ORIGINS=http://localhost:3002` in `server/.env`.

## Deploy (Vercel)

1. Vercel → Add New → Project → this repo, **Root Directory: `admin`**.
   Install command: `pnpm install --ignore-workspace`.
2. Add the domain `admin.ezhupira.in` and create the DNS record Vercel shows.
3. On the API (Render), set `EXTRA_ORIGINS=https://admin.ezhupira.in`.
4. Firebase → Authentication → Settings → Authorized domains: add `admin.ezhupira.in`.

Production builds call `https://api.ezhupira.in`; set `NEXT_PUBLIC_API_URL` only to use a
different API. Sign-in shares the `.ezhupira.in` session cookie with the website.
