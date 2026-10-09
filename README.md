# STATUS

A dark-themed service status dashboard. It shows the live status of
**MW3, BO6, BO7, MW1, WARDOGS, ARC Raiders, Spoofer and MW4**, with a public
dashboard, a password-protected admin area, a full audit trail, and a real
database behind it.

- **Public dashboard** — overall status, per-service cards with game artwork,
  search, status filters and summary counts.
- **Admin area** (`/admin`) — create, edit, hide, reorder and delete services,
  upload an image per service, set statuses and announcements, and read the
  append-only audit log.
- **Real-time updates** — Supabase Realtime pushes changes to open dashboards,
  with 30-second polling as a fallback.

The app is built to run entirely on free tiers (Vercel Hobby + Supabase Free).
See [Deployment](#deployment-free) for the fine print.

---

## Contents

1. [What you need](#what-you-need)
2. [Run it locally in 2 minutes (demo mode)](#run-it-locally-in-2-minutes-demo-mode)
3. [Connect a real database (Supabase)](#connect-a-real-database-supabase)
4. [Create your first admin](#create-your-first-admin)
5. [Using the admin area](#using-the-admin-area)
6. [Everyday commands](#everyday-commands)
7. [Environment variables](#environment-variables)
8. [How it works](#how-it-works)
9. [Testing](#testing)
10. [Deployment (free)](#deployment-free)
11. [Security notes](#security-notes)
12. [Troubleshooting](#troubleshooting)
13. [Honest limitations](#honest-limitations)

---

## What you need

- **Node.js 20.6 or newer** (this project was built on Node 24). Download from
  <https://nodejs.org> — choose the LTS installer.
- **npm** (comes with Node).
- A free **Supabase** account — only needed for real data and the admin area.
- A free **Vercel** account — only needed to publish it on the internet.

You do **not** need Docker, PostgreSQL, or the Supabase CLI for the normal path.

---

## Run it locally in 2 minutes (demo mode)

This shows the interface with **sample data**. No accounts or database needed.

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```

Open <http://localhost:3000>. You will see the dashboard with a clear
**"Demo data — not live"** banner. That banner only appears when there is no
database configured *and* you are not in a production build, so fake data can
never appear on a real deployment.

> Demo mode is development-only. A production build with no database shows a
> configuration error instead of sample data — this is intentional.

Next, [connect a real database](#connect-a-real-database-supabase) to go live.

---

## Connect a real database (Supabase)

### Step 1 — Create a Supabase project

1. Go to <https://supabase.com> and sign up (free).
2. Click **New project**. Give it a name, choose a region close to your users,
   and set a database password. Wait a minute for it to be provisioned.

### Step 2 — Copy your keys

In your Supabase project, open **Project Settings → API** and copy:

| Value | Where to put it | Secret? |
| --- | --- | --- |
| **Project URL** | `NEXT_PUBLIC_SUPABASE_URL` | No |
| **anon / publishable key** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No (protected by RLS) |
| **service_role key** | `SUPABASE_SERVICE_ROLE_KEY` | **YES — server only** |

Create your local environment file:

```bash
cp .env.example .env.local
```

Open `.env.local` and paste the URL, anon key and service_role key.

> **Never** prefix the service_role key with `NEXT_PUBLIC_`, commit it, or paste
> it into browser code. It bypasses all security rules. It is only used by the
> local scripts under `scripts/`.

### Step 3 — Create the database schema

Open your Supabase project → **SQL Editor → New query**. Run the four migration
files **in order**, pasting each one and clicking **Run**:

1. `supabase/migrations/0001_init.sql` — tables, constraints, triggers
2. `supabase/migrations/0002_rls.sql` — Row Level Security and grants
3. `supabase/migrations/0003_realtime.sql` — turns on Realtime for `services`
4. `supabase/migrations/0004_storage.sql` — creates the `service-icons` bucket
   and its policies (needed for image uploads)

Then run the seed to add the eight services:

5. `supabase/seed.sql`

The seed is **repeatable**: running it again never creates duplicates and never
overwrites statuses or text you have changed in the admin area.

<details>
<summary>Prefer the command line? (optional, needs the Supabase CLI)</summary>

```bash
supabase link --project-ref <your-project-ref>
supabase db push          # applies migrations
supabase db execute --file supabase/seed.sql
```

Or, once `.env.local` is filled in, use the Node seeder instead of `seed.sql`:

```bash
npm run seed
```

</details>

### Step 4 — Reload the dashboard

Restart `npm run dev` (so it picks up `.env.local`) and open
<http://localhost:3000>. The demo banner is gone and the eight services appear
with status **Unknown** — which is correct until you set a real status.

---

## Create your first admin

There is **no public sign-up**. Admins are created deliberately from the
command line. With `.env.local` filled in:

```bash
npm run admin:create -- you@example.com "a-strong-password"
```

This creates a Supabase Auth user (if needed) and adds them to the `admins`
allow-list. Now:

1. Open <http://localhost:3000/login>
2. Sign in with that email and password
3. You land on `/admin`

To verify your database at any time:

```bash
npm run db:verify
```

---

## Using the admin area

- **Services** (`/admin`) — every service, in display order. Use the arrows to
  reorder, the dropdown to change status, **Edit** for the full form, and
  **Delete** to remove.
- **Add / edit service** — name, slug (auto-generated if left blank),
  description, **image** (upload a file or paste a URL), status, status mode,
  announcement and visibility.
- **Service images** — uploads go to the public `service-icons` Supabase Storage
  bucket (max 3 MB; PNG, JPG, WEBP, GIF or AVIF). Only allow-listed admins can
  upload or delete, and the card falls back to a text monogram when a service has
  no image. This requires `0004_storage.sql` to have been applied.
- **Audit log** (`/admin/audit`) — an append-only history of every change, who
  made it, and when.

A few rules the app enforces for you:

- Status changes made by hand are recorded with `status_mode = manual` and
  `status_source = manual`, unless you explicitly state otherwise.
- An audit entry is written **only when the status actually changes** (plus on
  create and delete), so the history stays meaningful.
- The audit log cannot be edited or deleted through the app, and an admin cannot
  record a change as a different admin.

---

## Everyday commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the local dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build locally |
| `npm run typecheck` | TypeScript, no emit |
| `npm run lint` | ESLint |
| `npm test` | Unit, component and database tests (Vitest) |
| `npm run test:watch` | Tests in watch mode |
| `npm run verify` | typecheck + lint + tests + production build |
| `npm run seed` | Seed the eight services (needs `.env.local`) |
| `npm run admin:create -- <email> [password]` | Create/promote an admin |
| `npm run db:verify` | Check tables and seed (read-only) |

---

## Environment variables

Copy `.env.example` to `.env.local`. Nothing here is required for demo mode.

| Variable | Required | Public? | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | For live data | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For live data | Yes | Browser key, protected by RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | For scripts only | **No** | Server-side scripts (seed/admin/verify) |
| `NEXT_PUBLIC_SITE_URL` | No | Yes | Canonical site URL |
| `NEXT_PUBLIC_POLL_INTERVAL_MS` | No | Yes | Polling fallback interval (min 5000, default 30000) |
| `NEXT_PUBLIC_FORCE_DEMO` | No | Yes | Show sample data in production (do not use for real deploys) |

---

## How it works

```
Browser ──► Public dashboard (/)            ── reads visible services (RLS: is_visible)
        ──► Admin area (/admin)             ── requires a session in the `admins` allow-list
        ──► API routes (/api/...)           ── authorize server-side, validate with Zod

Supabase Postgres ── services, admins, audit_log
Supabase Auth     ── email + password sign-in (no public registration)
Supabase Realtime ── pushes service changes to open dashboards
Supabase Storage  ── public `service-icons` bucket for dashboard artwork
```

Key ideas:

- **Authorization is server-side.** `src/proxy.ts` only refreshes the auth
  session cookie. Every admin page and API route independently verifies the
  session and the `admins` allow-list (`src/lib/auth.ts`).
- **RLS is the real security boundary.** The anon key in the browser can only
  read rows where `is_visible = true`; only allow-listed admins can write. The
  same rule protects the service image bucket.
- **Validation happens in one place.** Zod schemas in `src/lib/validation.ts`
  are shared by the client and re-run on the server.
- **Statuses are defined once.** `src/lib/types.ts` is the single source of
  truth for status values, labels, symbols and severities — the UI never relies
  on colour alone.
- **The seed is honest.** New services start as `unknown`; the app never invents
  a live status.

### Project layout

```
src/
  app/                     # Next.js App Router pages and API routes
    api/                   # Route Handlers (public + admin)
    admin/                 # Admin pages (guarded by the layout)
    login/                 # Sign-in
  components/              # Dashboard, admin and shared UI
  lib/                     # Types, validation, auth, repository, env, errors
supabase/
  migrations/              # 0001 schema, 0002 RLS, 0003 realtime, 0004 storage
  seed.sql                 # Repeatable seed
scripts/                   # seed / make-admin / verify-db (service-role)
tests/                     # Unit, component and real-Postgres (PGlite) tests
```

---

## Testing

```bash
npm test        # everything
npm run verify  # typecheck + lint + tests + production build
```

The suite includes:

- **Logic tests** — status computation, filtering, slugs, validation.
- **Repository tests** — create/update/delete + audit behaviour against an
  in-memory Supabase fake.
- **Database tests** — the real migrations run inside an embedded PostgreSQL
  (PGlite), verifying constraints, the repeatable seed, and Row Level Security
  for anonymous, user and admin roles.
- **Component tests** — search, filters and status rendering (jsdom + Testing
  Library).
- **Seed-sync test** — guarantees `supabase/seed.sql` and `scripts/seed-data.mjs`
  list the same services.
- **Storage + card tests** — image type/size validation, unique storage paths,
  and the image → monogram fallback on the dashboard card.

---

## Deployment (free)

This project fits on **Vercel Hobby** (free) + **Supabase Free**.

### Deploy to Vercel

1. Push this repository to GitHub.
2. Go to <https://vercel.com>, sign in with GitHub, click **Add New → Project**,
   and import the repo. Vercel detects Next.js automatically.
3. Under **Environment Variables**, add (for Production and Preview):

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | your project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key |
   | `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` |

   Do **not** add `SUPABASE_SERVICE_ROLE_KEY` to Vercel — it is only used by the
   local scripts. If you ever need a server-side task in production, add it as a
   server-only variable *without* the `NEXT_PUBLIC_` prefix.
4. Click **Deploy**.

### Finish Supabase setup for production

1. **Redirect URLs** — in Supabase, go to **Authentication → URL Configuration**
   and set the **Site URL** to your Vercel URL. Add
   `https://your-app.vercel.app/**` to **Redirect URLs**.
2. **Create your production admin** — point `scripts` at your production project
   by filling `.env.local` with the production keys, then run
   `npm run admin:create -- you@example.com "password"`.
3. Open `https://your-app.vercel.app` and sign in.

### The free-tier fine print (please read)

- **Vercel Hobby is for non-commercial, personal use.** Commercial use requires
  Vercel **Pro** (~$20 per user/month). Nothing here requires a card to start.
- **Supabase Free** includes ~500 MB database, 50,000 monthly active users and
  unlimited API requests, with a 2-project limit.
- **Supabase Free projects pause after about one week of inactivity.** A paused
  project stops serving data until you resume it from the dashboard. If uptime
  matters, visit the project occasionally or upgrade.
- Both providers can change their free-tier terms. Check their pricing pages
  before relying on them commercially.

---

## Security notes

- The browser only ever sees the **anon** key. Row Level Security (not hidden
  URLs) is what protects your data.
- `SUPABASE_SERVICE_ROLE_KEY` lives only in `.env.local` (gitignored) and is
  used only by `scripts/`. It is never imported into `src/`.
- `.env*` files are gitignored, but `.env.example` is committed as a template.
- The audit log is append-only for API clients — there are no UPDATE/DELETE RLS
  policies on it, and the actor must match the signed-in user.
- Admin API routes are rate-limited (best-effort, per server instance).

If a key is ever exposed, rotate it immediately in Supabase → Project Settings →
API.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Dashboard shows the "Demo data" banner | `.env.local` is missing/blank — add your Supabase URL and anon key, then restart `npm run dev`. |
| "STATUS is not configured" in production | Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel and redeploy. |
| Can't sign in | Make sure you ran `npm run admin:create`. Being a Supabase Auth user is not enough — you must be in the `admins` table. |
| Sign-in seems to do nothing | Check Supabase **Authentication → URL Configuration** includes your URL. |
| `npm run seed` says "Missing ..." | Fill in `.env.local` (URL + service_role key). |
| Services don't update live | Realtime may be off; run `0003_realtime.sql`. Polling (every 30s) still works. |
| Image upload fails in the admin form | Make sure `0004_storage.sql` was run: it creates the `service-icons` bucket and its policies. |
| Images don't show on the dashboard | The bucket must be public (`public = true`). Re-run `0004_storage.sql`. |
| `npm` won't run in PowerShell | Use `cmd /c "npm run dev"` or the Node/npm Command Prompt. |

---

## Honest limitations

- **There is no automatic monitoring in this release.** Statuses are set
  manually by admins. The schema (`status_mode`, `status_source`,
  `last_checked_at`) is ready for a monitor later, but no monitor is included and
  no status is ever invented.
- **Realtime was exercised against a live Supabase project** during final
  acceptance testing: an anonymous subscriber received `postgres_changes` events
  when a service row changed (confirmed in the browser and by a scripted
  channel). It is not exhaustively load-tested, and the 30-second polling
  fallback still runs if Realtime is unavailable.
- **The free tiers are non-commercial / limited** as described above.
- This is a single-admin-role app; there is one `admin` role, not granular
  permissions.

---

Built with Next.js 16, React 19, TypeScript (strict), Tailwind CSS v4,
Supabase, Zod and Vitest.
