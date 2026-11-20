# Razi Perfumes — Luxury Arabian Fragrances

Full-stack e-commerce store for Razi Perfumes / رازي, serving Kuwait and the GCC.

**Stack:** Next.js 16 (App Router), TypeScript, PostgreSQL with Prisma 6, Auth.js v5, next-intl (English + Arabic RTL), Zod, Resend/SMTP, Cloudinary. It deploys to Vercel.

The original design is unchanged: fonts (Cinzel, Montserrat, Cormorant Garamond), the gold/ivory palette, CSS Modules, the splash screen and every animation.

---

## Features

| Area | What works |
|---|---|
| Catalog | Homepage sections come from the database. `/shop` has filters (collection, gender, size, scent, price) and sorting (newest, price, best-selling) with pagination. `/collection/[slug]`, `/product/[slug]` (gallery, sizes, stock, notes, reviews, related products) and live search with a `/search` page |
| Cart | Slide-out drawer and a `/cart` page. Quantities are checked against stock, and coupons can be applied. Guest carts use a cookie and merge into the account on login |
| Buy Now | Goes straight to checkout with only that item. The basket is left untouched |
| Wishlist | Heart on every product card and product page, a badge count, a `/wishlist` page and "move to basket". Guest wishlists merge on login |
| Checkout | Guest or signed-in checkout, GCC address fields, saved addresses, shipping fee per country with a free-shipping threshold, coupons, and prices always recalculated on the server. Cash on Delivery plus a pluggable online gateway |
| Payments | **MyFatoorah** (KNET, Visa/Mastercard, mada, Apple Pay) plus Cash on Delivery. Online orders are confirmed by a webhook that is double-checked with MyFatoorah's API. Stock is deducted only when payment succeeds or a Cash on Delivery order is confirmed. Includes success and failure pages with retry or "switch to Cash on Delivery" |
| Account | Register, verify email, log in and out, forgot and reset password, Google login, profile, password, address book, order history with tracking timeline |
| Currency | Country selector (KW, SA, AE, QA, OM, BH). Prices are converted using database rates with correct decimals (KD/BHD/OMR use 3, SAR/AED/QAR use 2). Checkout charges in the selected currency |
| Language | English at `/…` and Arabic RTL at `/ar/…`. Translates all UI text and all database content |
| Content | About, Our Story, Terms, Shipping, Privacy, Return pages, Locations and the Contact form (saved to the database and emailed to admin). Newsletter signup in the footer and a custom 404 page |
| WhatsApp & CRM | "Enquire on WhatsApp" button on product pages, with the WhatsApp number and message set in Admin → WhatsApp & payments. Every enquiry is saved (Admin → WhatsApp enquiries) with status and notes. Admin customer pages show login history, recently viewed products, enquiries, wishlist, orders and addresses. Guest activity is linked to the customer's account when they sign in |
| Admin (`/admin`) | Dashboard (sales, revenue chart, low stock, recent orders). Products with sizes, stock and images. Collections, orders (status, mark Cash on Delivery as paid, refund, invoice), customers, coupons, shipping rates, currency rates, hero slides, content pages, locations, reviews, messages, newsletter CSV export |
| SEO | Page titles, descriptions and share images per page, English/Arabic language links, product structured data for Google, `sitemap.xml` and `robots.txt` |
| Security | Input validation on every API, rate limiting, blocking of cross-site requests, admin protection in proxy and API, bcrypt passwords, hashed reset tokens, signed payment webhooks, httpOnly cookies, upload file-type checking |

---

## 1. Local setup

Requirements: **Node 20+** and **PostgreSQL 14+** (Docker works well).

```bash
# 1. Install
npm install

# 2. Start a local Postgres (or use a Neon / Supabase URL instead)
docker run -d --name razi-postgres -e POSTGRES_USER=razi -e POSTGRES_PASSWORD=razi_dev_pw \
  -e POSTGRES_DB=razi -p 55432:5432 postgres:17-alpine

# 3. Environment
cp .env.example .env
#   DATABASE_URL / DIRECT_URL = postgresql://razi:razi_dev_pw@localhost:55432/razi
#   AUTH_SECRET = output of: npx auth secret
#   ADMIN_EMAIL / ADMIN_PASSWORD = your admin login
#   PAYMENT_PROVIDER = mock   (to test online payments locally)

# 4. Create the tables, then add the starting data
npm run db:migrate
npm run db:seed

# 5. Run
npm run dev          # http://localhost:3000   (admin: http://localhost:3000/admin)
```

The seed can be run again safely. It loads the 7 collections, 16 products with sizes and stock, GCC shipping rates, currency rates, the 6 policy pages, 3 hero slides, a sample location, the `WELCOME10` coupon (10% off) and the admin user.

**Without external accounts**, everything still works in development:
- **Email:** with no `RESEND_API_KEY` or `SMTP_HOST`, every email (order confirmation, password reset and others) is printed in the terminal.
- **Images:** with no Cloudinary keys, admin uploads are saved to `public/uploads/`.
- **Google login:** the button only appears once `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set.

## 2. Payments (MyFatoorah)

Set `PAYMENT_PROVIDER` in `.env`:

| Value | Checkout offers |
|---|---|
| `myfatoorah` | Cash on Delivery, KNET, Card (Visa/Mastercard, with mada and AMEX as fallbacks), Apple Pay |
| `mock` | Cash on Delivery plus a built-in sandbox page (local testing only; disabled in production) |
| `none` | Cash on Delivery only |

**How it works:**
1. At checkout the server creates a MyFatoorah invoice for the order total, in the customer's currency.
2. The customer is redirected to MyFatoorah's secure payment page.
3. MyFatoorah sends them back to `/api/payments/callback`, and the server confirms the result with MyFatoorah's `GetPaymentStatus` API.
4. Webhooks to `/api/payments/webhook` are also re-checked against the API, so a forged webhook can't mark an order as paid.
5. Stock is deducted and the confirmation emails are sent only once payment is confirmed.

### Test mode (sandbox)

```
PAYMENT_PROVIDER="myfatoorah"
MYFATOORAH_BASE_URL="https://apitest.myfatoorah.com"
MYFATOORAH_API_KEY="SK_KWT_vVZlnnAqu8jRByOWaRPNId4ShzEDNt256dvnjebuyzo52dXjAfRx2ixW5umjWSUx"   # MyFatoorah's public test token
```

MyFatoorah's test cards are listed at https://docs.myfatoorah.com/docs/test-cards. For example:
- Mastercard `5123450000000008`, expiry 01/39, CVV 100
- KNET `8888880000000001`, expiry 09/30, any 4-digit PIN

**Localhost doesn't work with MyFatoorah.** It rejects `localhost` callback URLs, so test real MyFatoorah payments on a Vercel preview deployment, or through a public tunnel with `NEXT_PUBLIC_SITE_URL` set to the tunnel address. For quick local testing, use `PAYMENT_PROVIDER="mock"`.

### Going live
1. In your MyFatoorah portal, create a live API token and enable KNET, cards and Apple Pay.
2. Set `MYFATOORAH_API_KEY` to the live token, and `MYFATOORAH_BASE_URL` to your country's address:
   - Kuwait, Bahrain or Oman: `https://api.myfatoorah.com`
   - Saudi Arabia: `https://api-sa.myfatoorah.com`
   - UAE: `https://api-ae.myfatoorah.com`
   - Qatar: `https://api-qa.myfatoorah.com`
3. In the portal, under Integration settings → Webhook, set the URL to `https://YOUR-DOMAIN/api/payments/webhook` (event: Transaction status changed).
4. Apple Pay also needs domain verification in the MyFatoorah portal.
5. Admin → WhatsApp & payments shows which gateway is active and whether it's in TEST or LIVE mode.

## 2b. WhatsApp enquiries & customer activity

- **Set your number:** Admin → **WhatsApp & payments**. Enter the full number with country code, e.g. `96551234567`. You can also edit the opening message in English and Arabic.
- **What customers see:** an **Enquire on WhatsApp** button on each product page. It opens WhatsApp with the product name, the selected size and a link to the product.
- **What you see:** each click is saved under Admin → **WhatsApp enquiries**, with the customer's details (or "Guest"), last login and how many products they've viewed. You can mark it Contacted or Closed, add notes, or reply on WhatsApp in one click.
- **Customer profiles:** Admin → **Customers** → a customer shows last login and sign-in count, recently viewed products (with view counts), enquiries, wishlist, orders and addresses.
- **Guests:** their views and enquiries are tracked with an anonymous cookie, and linked to their account automatically when they register or sign in.

## 3. Deploy to Vercel

1. Create a Postgres database on **Neon** or **Supabase**. Copy the pooled URL into `DATABASE_URL` and the direct URL into `DIRECT_URL`.
2. Import the GitHub repo in Vercel. The framework (Next.js) is detected automatically.
3. In Vercel → Settings → Environment Variables, add everything from `.env.example`. At minimum:
   - `DATABASE_URL`, `DIRECT_URL`
   - `AUTH_SECRET`
   - `NEXT_PUBLIC_SITE_URL=https://your-domain` and `AUTH_URL=https://your-domain`
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`
   - `RESEND_API_KEY` and `EMAIL_FROM` (on a domain verified in Resend)
   - `ADMIN_NOTIFY_EMAIL`
   - `CLOUDINARY_*`. This is required on Vercel, because its filesystem is read-only.
4. Create the tables and load the starting data from your computer, against the production database:
   ```bash
   DATABASE_URL="…prod…" DIRECT_URL="…prod…" npx prisma migrate deploy
   DATABASE_URL="…prod…" ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run db:seed
   ```
   Future schema changes: run `npx prisma migrate deploy` before or after each deploy.
5. **Google login (optional):** in Google Cloud Console → OAuth client, add the redirect URI `https://your-domain/api/auth/callback/google`.
6. **Before going live**, update the currency rates, shipping fees, policy pages and store locations in the admin panel. Replace the product images, which are currently loaded from `kw.gissah.com`, by uploading your own in Admin → Products.

## 4. Project structure

```
prisma/                 schema.prisma, migrations/, seed.ts
messages/               en.json, ar.json — all UI text
src/proxy.ts            locale routing, admin guard, blocking of cross-site API requests
src/auth.ts             Auth.js (email/password + Google)
src/i18n/               next-intl routing and navigation
src/lib/                server logic: catalog, pricing, cart, wishlist, orders, payments/, email, storage, validators
src/app/[locale]/       storefront pages (English unprefixed, Arabic under /ar)
src/app/admin/          admin panel (separate layout)
src/app/api/            REST API (/api/…, /api/admin/…)
src/components/         storefront components (original CSS Modules kept)
src/components/admin/   admin UI
```

Prices are stored in **KWD**. Every amount the customer is shown or charged is calculated on the server by `src/lib/pricing.ts`. The catalog is cached and refreshed instantly whenever the admin edits a product.

## 5. Feature checklist — verified

These were tested end to end against a local Postgres. The checks used an automated Chromium browser (Playwright) and direct API calls.

- [x] Homepage sections load from the database. The country/language popup appears on first visit.
- [x] Country switch to Saudi Arabia: all prices show in SAR with 2 decimals, and the shipping fee follows the delivery country.
- [x] Add to cart: the drawer opens and the badge updates. Quantity changes and removals work. The `/cart` page works, and the `WELCOME10` coupon applies.
- [x] Wishlist: the heart toggles, the badge updates, the `/wishlist` page works and "move to basket" works.
- [x] Live search suggestions and the `/search?q=` page.
- [x] `/shop` filters (scent, sorting by price) and the collection pages. An unknown collection returns 404.
- [x] Product page: size selection, stock status, Buy Now goes to checkout with only that item.
- [x] Checkout with **Cash on Delivery**: order confirmed, stock deducted, cart emptied, coupon usage counted, customer and admin emails sent.
- [x] Checkout with **Card (sandbox)**: declined → failure page → retry → paid → success page.
- [x] Register → signed in → address book → order history.
- [x] Contact form saved to the admin inbox and emailed to the admin. Newsletter signup.
- [x] Arabic `/ar`: `dir="rtl"`, mirrored header and drawers, Arabic text from the database.
- [x] Mobile (390px): no horizontal scrolling.
- [x] All footer links lead to real pages. Custom 404 page.
- [x] Admin: login, every section loads, order status change emails the customer, product toggles work, coupons can be created, newsletter CSV exports, non-admins are blocked (401/403).
- [x] `npm run build` passes. The production server answers on all routes, with `robots.txt`, `sitemap.xml` (with English/Arabic links) and product structured data.

- [x] **MyFatoorah sandbox:** invoices created for KNET, Card, Apple Pay and SAR. A real test-card payment (Mastercard 3-D Secure) completed, was redirected back to `/api/payments/callback`, and was confirmed as PAID by the integration.
- [x] **WhatsApp:** admin sets the number; a guest enquiry opens WhatsApp with the product, size and link; the enquiry is saved; after sign-up, the guest's views and enquiry are linked to the account; admin marks it contacted; the customer page shows last login, recently viewed and enquiries.

Not yet tested against real external services, because no keys have been set up yet: Resend/SMTP delivery, Cloudinary uploads, Google OAuth, a live (non-sandbox) MyFatoorah account and Apple Pay domain verification. A declined MyFatoorah card couldn't be tested because the sandbox's card form rejects MyFatoorah's documented decline card. Unpaid invoices are correctly reported as pending and sent to the retry page.

Rate limiting runs in memory on each server instance. For strict limits across all instances, use Upstash Redis behind the same `rateLimit()` function.
