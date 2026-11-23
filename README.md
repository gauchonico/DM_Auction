# DMAuctionHub Uganda

The digital auction marketplace that sits alongside Daily Monitor auction notices. Built with Next.js 15 (App Router), Tailwind CSS 3 and Prisma 6, on **Neon Postgres** and **Neon Object Storage**.

## Setup

```bash
npm install
neon deploy          # provisions neon.ts services and writes .env.local
npm run db:push      # create tables (uses the direct, unpooled URL)
npm run db:seed      # optional: fictional sample data, photos and PDF uploaded to the bucket
npm run dev
```

The `db:*` and `media:upload` scripts load `.env.local` through `dotenv-cli`, because the Prisma CLI only reads `.env` on its own. Next.js reads `.env.local` itself.

## Neon services (`neon.ts`)

| Service | How the app uses it |
| --- | --- |
| Postgres | The app uses the pooled `DATABASE_URL` through Neon's serverless driver over **WebSockets on port 443** (`@prisma/adapter-neon`). This works on networks that block Postgres port 5432; set `DATABASE_TRANSPORT=tcp` to use Prisma's native TCP connection instead. Connection failures that happen before a query runs, such as a cold start or a network drop, are retried automatically. `prisma db push` and migrations always use TCP via `directUrl` = `DATABASE_URL_UNPOOLED`, so run them from a network where port 5432 is open. |
| Object Storage, bucket `assets` (`public_read`) | Listing photos and notice PDFs. Postgres stores the object **key** (`listings/<id>/<uuid>.png`), and [lib/media-url.ts](lib/media-url.ts) turns it into a URL under `AWS_ENDPOINT_URL_S3`, so data works on any branch. Anonymous reads are allowed. Writes need the branch credentials. |

Attach media to a listing (staff only; the web app has no public upload endpoint):

```bash
npm run media:upload -- DM-2026-0142 ./photo.jpg "Front view"
```

Health check: `GET /api/health` runs `SELECT 1` against Postgres and `HeadBucket` against storage.

## Admin panel (`/admin`)

Create the first admin from the command line. A temporary password is printed once; change it under **My account**.

```bash
npm run admin:create -- you@nationmedia.example "Your Name"
```

The same command resets an existing account to ADMIN with a new password, in case of lockout.

| Section | ADMIN | EDITOR |
| --- | --- | --- |
| Auctions: create and edit, upload, reorder and delete photos and PDFs | ✓ | ✓, but every save goes back to **Pending** |
| Publish, unpublish, feature, delete auctions; bulk-expire past auctions | ✓ | — |
| Clients | create, edit, delete | view |
| Categories, sub-types, tags | manage | view |
| Advertiser enquiries | ✓ | ✓ |
| Staff accounts (create, role, reset password, deactivate) | ✓ | — |

Security model:

- Passwords are hashed with scrypt.
- Sessions are server-side (the cookie holds a random token; only its SHA-256 hash is stored), last 12 hours, and are revoked on password reset or deactivation.
- After 5 failed logins an email is locked out for 15 minutes.
- The middleware only redirects visitors without a session cookie. The real checks (`requireStaff` / `requireAdmin` in `lib/auth.ts`) run in **every** admin page and **every** Server Action, because Server Actions are public endpoints.
- Server Actions take record IDs from hidden fields, not `.bind()`. A bound action that returns state hangs when a form is submitted before JavaScript loads.

## Audit trail (`/admin/audit`, admins only)

Every admin action is written to the `AuditLog` table: who (a snapshot of email and role that survives account deletion), what (a dotted action such as `listing.publish`, plus a summary), which record (a snapshot label such as the notice reference), the before → after values of changed fields, and the IP address and browser.

- **Coverage:**
  - Sign-in, failed sign-in (with reason), lockout, sign-out and password change
  - Auctions: create, edit, publish, unpublish, expire (single and bulk), feature, delete, and media upload, delete and reorder
  - Clients, categories, sub-types and tags
  - Enquiries marked handled or reopened
  - Staff: create, role change, password reset, deactivate and reactivate
  - CSV exports of the log
  - The `admin:create` and `media:upload` command-line scripts (logged as `cli (user@host)`)
- **Integrity:** entries are written in the same database transaction as the change wherever possible. Uploads to object storage and sign-in events are logged on a best-effort basis, so a logging failure never blocks a sign-in. The app never updates or deletes entries.
- **Viewing:** filter by type, staff member, action, Kampala date range or free text (reference, name, email, IP). Auction and client pages show their own **History** panel. **Export CSV** downloads up to 20,000 rows (formula-safe), and the export is itself logged.
- **Not yet enforced at database level:** anyone with direct database credentials could still alter the table. If you need tamper-evidence, add a Postgres trigger that rejects `UPDATE`/`DELETE` on `"AuditLog"`, or ship entries to an external log store.

## Structure

| Path | Purpose |
| --- | --- |
| `prisma/schema.prisma` | Client, Listing, Category, SubType, Tag, ListingTag, ListingMedia, AdvertiserEnquiry |
| `lib/queries.ts` | All database reads (only published, upcoming listings are public) |
| `lib/storage.ts` | S3 client (path-style), uploads with validation, and cleanup of orphaned objects |
| `lib/search-params.ts` | Parses and serialises `/search` query strings |
| `lib/whatsapp.ts` | Ugandan phone normalisation and `wa.me` enquiry links |
| `components/` | Navbar, Footer, ListingCard, LatestListingsGrid, ClientAuctionsGrid, SearchFilterForm, ImageGallery |
| `app/` | Home, `/search`, `/listings/[id]`, `/clients/[id]`, `/categories`, `/verify`, `/advertisers`, `/api/health` |

## Low-data design choices

- Search and filter forms are plain GET forms that work without JavaScript.
- The mobile menu, filter drawer and image gallery use `<details>` and CSS scroll-snap, not client JavaScript.
- Images go through `next/image` (AVIF/WebP, responsive sizes). Bucket objects are uploaded with `Cache-Control: immutable`.
- System font stack, so no web-font download.

## Before launch

- Put a CDN in front of the storage endpoint for public images. Each page view currently counts as Neon egress.
- Replace the fictional seed data.
