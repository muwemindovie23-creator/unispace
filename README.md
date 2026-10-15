# UniSpace

**Your campus. Your people. Your experience.**

UniSpace is a student-centred university discovery and campus-life platform for Malawi's
universities. One application serves every university: events, student representatives, societies,
campus tips, polls and student-focused businesses, each university with its own identity.

UniSpace covers the lived side of campus. It deliberately does **not** reproduce admissions,
academic programmes or entry requirements — it links to each university's own website for those.

UniSpace is independent of Menty: its own codebase, database and deployment.

---

## Status

**Milestones 1 (Foundation) and 2 (University & campus experience) are complete.** See
[`docs/milestones.md`](docs/milestones.md) for what is built, what is deliberately deferred, and
what each later milestone adds.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, CSS custom properties for per-university themes |
| Animation | `motion`, plus CSS transitions; all of it respects `prefers-reduced-motion` |
| Database | PostgreSQL on Neon, Prisma ORM, version-controlled migrations |
| Auth | First-party session auth — scrypt password hashing, hashed session tokens |
| Validation | Zod, on the server, for every mutation |
| Tests | Vitest |
| Hosting | Vercel |

## Quick start

```bash
npm install
cp .env.example .env         # then fill in the Neon URLs and AUTH_SECRET
npm run db:deploy            # apply migrations
npm run db:seed              # reference data: roles, categories, 6 universities, legal v1
npm run provision:super-admin -- --email you@example.org --name "Your Name"
npm run dev
```

The provisioning command prints a single-use invitation link. Open it to set your password.
No default password exists anywhere in this repository.

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Generates the Prisma client, then builds |
| `npm run test` | Vitest in watch mode (`test:run` for CI) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | Create and apply a migration in development |
| `npm run db:deploy` | Apply pending migrations (production) |
| `npm run db:seed` | Idempotent reference-data seed |
| `npm run db:studio` | Browse the database |

## How it is organised

```
prisma/
  schema.prisma          Data model for every module
  migrations/            Version-controlled SQL, including hand-written partial indexes
  seed.ts, seed-data.ts  Idempotent reference data (no invented people or businesses)
  legal/                 Markdown source for the seeded legal documents
scripts/
  provision-super-admin.ts
src/
  app/                   Routes: public site, university pages, /admin dashboard
  components/ui/         Design-system primitives
  components/site/       Public site composition
  components/admin/      Dashboard components
  lib/                   db, env, auth, rbac, theme, markdown, audit, rate limiting
  modules/               Feature domains: universities, legal, admin
tests/                   rbac, theme, security
docs/                    Deployment, administration, architecture, milestones
```

## The two rules that keep this one platform

1. **Nothing in a component names a university.** Colours, logos, campuses, sections and links
   are rows in the database, applied through `--us-*` CSS custom properties. Adding a seventh
   university is a dashboard task, not a deployment.
2. **Every mutation checks a permission and a scope on the server.** Hiding a button is a
   convenience, never a control. See [`docs/architecture.md`](docs/architecture.md).

## Honesty rules this codebase follows

These are product requirements, enforced in code and in review:

- No invented people, businesses, events, prices, coordinates or endorsements — in seeds or
  anywhere else. Empty sections say they are empty.
- An official university link shows as *confirmed* only after an administrator has confirmed it.
- Content carries an evidence level, so a student tip is never presented as a checked fact.
- Verification means only what the published verification policy says it means.
- Polls are labelled as informal, and the limits of anonymous voting are stated plainly.
- The legal documents describe what the code actually does, and say so when a feature is not
  live yet.

## Documentation

- [`docs/deployment.md`](docs/deployment.md) — environments, Neon, migrations, backups, recovery
- [`docs/administration.md`](docs/administration.md) — adding a university, assigning admins,
  themes, publishing, legal documents
- [`docs/architecture.md`](docs/architecture.md) — schema and security decisions, and why
- [`docs/milestones.md`](docs/milestones.md) — delivery plan and current status
