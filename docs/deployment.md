# Deployment and operations

## Environments

| Environment | Purpose | Database |
| --- | --- | --- |
| Development | Local work | A Neon branch, or a separate Neon project |
| Preview | Vercel preview deployments per pull request | A Neon branch, never production |
| Production | `space.mentmw.org` | The production Neon database |

Never point a preview deployment at the production database. Neon branches are the cheapest way
to give each environment its own data.

## Environment variables

All four are required. The application validates them at boot and refuses to start with a clear
message if one is missing or too weak (`src/lib/env.ts`).

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Neon **pooled** connection string (host contains `-pooler`). Used at runtime. |
| `DIRECT_DATABASE_URL` | Neon **direct** connection string. Used by `prisma migrate`. |

### Required connection parameters

Keep these on the connection strings — each one fixes a failure we actually hit:

| Parameter | Why |
| --- | --- |
| `connect_timeout=30` | Neon suspends idle computes. The 5s default is too short for a cold start and fails with `P1001: Can't reach database server`. |
| `pool_timeout=60` | `next build` prerenders with several parallel workers, each holding its own Prisma pool. The 10s default times out mid-build. |
| `connection_limit=5` | Keeps total connections across those build workers sane. |

The direct string needs `connect_timeout` too, for the same cold-start reason.
| `AUTH_SECRET` | 32+ random characters. Keys session cookies, CSRF tokens, anonymous poll ballot hashes and IP hints. |
| `APP_URL` | Public origin, e.g. `https://space.mentmw.org`. Used for absolute URLs, cookie security and origin checking. |

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

**Rotating `AUTH_SECRET` signs every administrator out and resets anonymous vote identifiers.**
Rotate it if it is ever exposed; accept the sign-out as the cost.

Secrets live in Vercel's environment settings, never in the repository. `.env`, `.env*.local` and
`.env.production` are git-ignored.

## Neon setup

1. Create a Neon project (choose the region closest to your users).
2. Create a database named `unispace`.
3. From the connection details panel, copy **both** the pooled and the direct strings.
4. Put them in `.env` locally (both Prisma and Next read it), and in Vercel for
   preview and production.
5. Create a Neon branch for development and one for preview, so neither touches production data.

## Migrations

Migrations are version-controlled SQL under `prisma/migrations/` and must be committed.

```bash
npm run db:migrate            # development: create and apply a migration
npm run db:deploy             # preview/production: apply pending migrations only
```

`db:deploy` never generates or edits a migration, so production only ever runs reviewed SQL. Run
it as a release step before the new build serves traffic.

Two migrations ship with the foundation:

- `20261015000000_init` — the full schema.
- `20261015000100_nulls_not_distinct` — hand-written partial unique indexes. Postgres treats
  NULLs as distinct, so a compound unique key containing a nullable column does not prevent
  duplicates when that column is NULL. Three keys use NULL to mean "wider scope", and these
  partial indexes close that gap. Prisma's schema language cannot express them, so **do not
  delete this migration or regenerate the schema over it.**

### Checking a migration before production

```bash
npx prisma migrate diff \
  --from-url "$DIRECT_DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --script
```

This prints the SQL that would be applied, without applying it.

## Seeding

```bash
npm run db:seed
```

The seed is idempotent and safe to re-run. It upserts roles, platform settings, default
categories, the six initial universities with their themes, advertising placements, and version 1
of the legal documents.

It deliberately does **not**:

- create any administrator account or password;
- assert any campus for any university;
- overwrite legal text, settings or content an administrator has edited.

## Provisioning the first Super Admin

```bash
npm run provision:super-admin -- --email you@example.org --name "Your Name"
```

This prints a **single-use invitation link, valid for 48 hours**. Open it once in a browser to set
a password. The token is stored only as a SHA-256 hash, so it cannot be recovered from the
database or from logs.

There is no default Super Admin password in the source, the seed or this documentation, by design.
Send invitation links over a channel you trust, and do not paste them into shared logs or tickets.

Re-running the command for an account that already has a password is refused.

## Deploying to Vercel

1. Import the GitHub repository into Vercel.
2. Set the four environment variables for Preview and Production.
3. Build command: `npm run build` (it runs `prisma generate` first).
4. Add `space.mentmw.org` as a domain and point DNS at Vercel.
5. Add a release step that runs `npm run db:deploy` against the target database.

### After the first production deploy

1. Provision the Super Admin (above).
2. Sign in and set the contact addresses under **Settings** — the Privacy Policy, Terms of Use and
   contact routes read them from there. Until they are set, those pages say so rather than showing
   a non-working address.
3. Confirm each university's official website under **Universities**.
4. Have the legal documents reviewed, then set `legal.review_status` to `reviewed` to remove the
   "pending independent legal review" notice.

## Still to configure (not yet wired)

These are listed so nobody assumes they are done:

- **Email delivery.** No provider is configured. Invitations are currently delivered by copying
  the printed link. Wire a provider before inviting administrators at scale.
- **Image storage.** No upload pipeline yet; `logoUrl` / `coverImageUrl` accept URLs. Add the
  storage host to `images.remotePatterns` in `next.config.ts` when that lands.

## Backups and recovery

Neon keeps point-in-time restore history; confirm the retention window on your plan and set it to
the longest the plan allows.

**Routine:**

- Before any production migration, create a Neon branch from production. It is an instant,
  copy-on-write snapshot and your fastest rollback.
- Export a periodic logical backup to storage you control, so recovery does not depend on one
  provider: `pg_dump "$DIRECT_DATABASE_URL" -Fc -f unispace-$(date +%F).dump`.

**To recover:**

1. Restore the Neon branch (or `pg_restore` the dump into a new branch).
2. Point `DATABASE_URL` and `DIRECT_DATABASE_URL` at it.
3. Redeploy.

Test the restore path before launch. An untested backup is not a backup.

## Operational checks

- Audit log (`/admin/audit`) for sign-ins, publishing and role changes.
- `RateLimitCounter` rows expire and are cleaned opportunistically; no job is needed.
- Expired `AdminSession` rows are ignored at read time. A periodic delete keeps the table small.
