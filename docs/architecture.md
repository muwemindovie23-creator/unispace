# Architecture

The decisions here are the ones that keep UniSpace a single platform rather than six websites,
and that keep a campus administrator inside their own campus.

## One application, many universities

`University → Campus → campus-scoped content`.

Content tables carry a **required `universityId`** and an **optional `campusId`**:

- `campusId = null` → university-wide (an event for the whole institution).
- `campusId = <id>` → that campus only (a food vendor beside one campus).

No component, route or query names a university. A seventh university is six form fields in the
dashboard.

### Campuses are not assumed

Nothing in the seed asserts how many campuses a university has, or what they are called. Several
Malawian universities have been restructured recently, and guessing would publish wrong
information under an institution's name. Administrators who know the institution add them.

## Theming

A theme is a row (`UniversityTheme`), not a stylesheet. Two rows per university at most:
`PUBLISHED` (what visitors see) and `DRAFT` (what the editor works on).

The flow is: `lib/theme/tokens.ts` turns a row into `--us-*` CSS custom properties →
`ThemeScope` renders them as inline styles on a server component → `globals.css` maps Tailwind
colour utilities onto those properties.

Consequences worth knowing:

- The correct colours are in the first byte of HTML. No flash of the wrong theme, no client-side
  theme script.
- `bg-brand` means "this university's primary colour" everywhere, with no per-university branch.
- **Publishing is blocked while any text/background pairing fails WCAG AA** (`auditThemeContrast`).
  A brand colour cannot quietly make a university's pages unreadable. A test asserts every shipped
  theme passes.

## Authorisation

Three pieces:

| Piece | Lives in | Role |
| --- | --- | --- |
| Permission keys | `lib/rbac/permissions.ts` (code) | The vocabulary, declared once |
| Which keys a role grants | `AdminRole.permissions` (database) | Editable; new roles need no code |
| Where a role applies | `AdminAssignment` (database) | Platform, university or campus scope |

Server code checks `can(actor, PERMISSIONS.X, { universityId, campusId })` — **never a role name.**
That is what stops `role === 'SUPER_ADMIN'` checks scattering through the codebase as roles are
added.

### The scope rules

- **PLATFORM** covers everything.
- **UNIVERSITY** covers resources whose `universityId` matches. Platform-wide resources are out of
  reach.
- **CAMPUS** covers resources whose `campusId` matches — and **not** university-wide content,
  which has no campus. If a university is also supplied it must match.

Both escalation paths are tested in `tests/rbac.test.ts`:

- *Horizontal* — a UNIMA admin acting on MUST, or a campus admin acting on a sibling campus.
- *Vertical* — any non-super role reaching settings, audit, role management or theme publishing.

`canGrantRole` additionally stops an administrator granting a permission they do not already hold
in that scope, so nobody can promote themselves.

### Rules that hold everywhere

1. Never trust a university or campus id from the client. Resolve a campus to its university in
   the database (`resolveCampusScope`) and check against that.
2. Every mutation calls `requirePermission` (or `assertCan`) before it touches data.
3. Hiding a navigation link is a convenience. The page and the action check again.
4. There is no public registration for administrator accounts.

## Authentication

First-party, no auth library. The requirements — invitation-only accounts, scoped roles, audit
logging, forced sign-out on role change — are simpler to meet directly than to bend a general
library around.

- **Passwords:** Node's built-in `scrypt` (N=2^15), salted, self-describing hash string, verified
  in constant time. A memory-hard KDF with no native module to compile on Windows or Vercel.
- **Sessions:** 32 random bytes in an `httpOnly`, `SameSite=Lax`, `Secure`-in-production cookie.
  The database stores only the SHA-256 hash, so a database copy yields no live sessions.
- **Instant revocation:** `AdminUser.sessionEpoch` is snapshotted into each session. Incrementing
  it invalidates every existing session — used on suspension, role change and password reset.
- **Invitations:** single-use, 48 hours, stored hashed, consumed in the same transaction that sets
  the password and activates the account.
- **Brute force:** rate limited per caller *and* per targeted email, plus account lockout after
  repeated failures. Sign-in returns one generic message for every failure, so the form cannot be
  used to discover which addresses have accounts.

## Privacy by construction

- Public browsing needs no account; there is no public sign-up.
- **No raw IP address is ever stored.** `ipHint()` keeps a keyed, truncated HMAC — enough to rate
  limit and investigate abuse, not enough to identify a person, and different between deployments.
- **Anonymous voting** (Milestone 4) stores a keyed `ballotHash` derived from a short-lived,
  poll-scoped browser identifier. Not reversible, never exposed by a public API, and described
  honestly as making repeat voting harder rather than impossible.
- **Audit metadata is scrubbed** — any key containing `password`, `token`, `secret`, `cookie` or
  similar is redacted before it is written.
- Public query helpers select explicit field lists, so private contact details in applications and
  submissions cannot leak into a public response by accident.

## Content integrity

Every content table carries `status` (`DRAFT → NEEDS_REVIEW → PUBLISHED → ARCHIVED`),
`evidenceLevel`, `sourceUrl`, `sourceNote` and `lastCheckedAt`; tips add `reviewDueAt` so stale
prices get re-checked rather than quietly ageing.

`evidenceLevel` drives the public label — `STUDENT_REPORTED` renders as a student tip, not as a
checked fact. An official link shows as confirmed only once an administrator has ticked the
confirmation box, which writes `officialWebsiteVerifiedAt` and an audit entry.

## Other decisions

**Rate limiting in Postgres, not Redis.** Serverless instances share no memory, and Redis would be
another service to operate for this volume. Fixed windows, rows expire, cleaned opportunistically.

**Categories are rows, not enums.** `TaxonomyTerm` covers events, tips, businesses and
SRC portfolios, so adding a category is a dashboard task. A null `universityId` means
platform-wide.

**NULL in compound unique keys.** Postgres treats NULLs as distinct, so a unique key containing a
nullable column does *not* prevent duplicates when that column is NULL — exactly the case for our
"wider scope" rows. Partial unique indexes in `20261015000100_nulls_not_distinct` close the gap.
Prisma cannot express them, which is also why the seed uses find-then-create rather than `upsert`
for those three tables.

**Markdown without a library.** `lib/markdown.tsx` renders a small subset to React elements, not
to an HTML string. There is no `dangerouslySetInnerHTML` anywhere in UniSpace, raw HTML in admin
or submitted text renders as visible text, and `javascript:` links degrade to plain text.

**Conventional ISR, not Cache Components.** Public pages use `export const revalidate`; the
dashboard is `force-dynamic`. The two models are mutually exclusive in Next 16, and ISR is easier
for a team to reason about. *Note: the build prerenders public pages, so it requires a reachable
database.*

## What is deliberately absent

No microservices, no second database, no shared database with Menty, no payment processing, no
third-party analytics or trackers, and no academic programmes directory.
