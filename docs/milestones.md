# Milestones

Each milestone should be functional, tested and reviewed before the next begins.

## Milestone 1 — Foundation ✅

**Built**

- Next.js 16 / TypeScript / Tailwind v4 project, with a design system whose colours all resolve
  to per-university CSS custom properties.
- Full Prisma schema for every module in the specification, with version-controlled migrations
  including hand-written partial unique indexes.
- University and campus data model, with university-wide vs campus-specific content scoping.
- Six universities seeded, published, each with its own theme. No campuses asserted.
- Configurable theme system: draft/published variants, a live-preview editor, and a contrast gate
  that blocks publishing an unreadable theme.
- Database-backed RBAC: permission catalogue in code, role grants and scoped assignments in the
  database, checked on the server for every protected action.
- First-party authentication: scrypt passwords, hashed session tokens, session epochs for instant
  revocation, rate limiting, lockout, generic failure messages.
- Secure Super Admin provisioning by single-use invitation link. No default password anywhere.
- University-selection homepage, themed university pages, section routes, official-websites
  directory, legal pages and the full footer structure.
- Privacy Policy and Terms of Use as versioned database documents, published as version 1, with a
  visible "pending legal review" notice.
- Audit logging with secret scrubbing; dashboard overview, universities, settings, audit,
  administrators and legal screens.
- 53 tests across RBAC, theming, accessibility and security.

**Deliberately deferred**

- Inviting and assigning administrators from the dashboard (Milestone 7) — the model and the
  enforcement are live; the screens are not.
- In-dashboard legal editing (Milestone 7).
- Email delivery and image uploads (see `docs/deployment.md`).

## Milestone 2 — University and campus experience ✅

**Built**

- University create and edit from the dashboard: identity, descriptions, images, city, profile
  status, display order and publishing. Publishing is a separate permission from editing.
- Campus CRUD: add, edit, publish/unpublish and delete, with one main campus per university
  enforced on save. Deletion is refused while any content or administrator assignment still
  points at the campus, and asks the administrator to type the campus name first.
- Campus homepages at `/universities/<university>/campus/<campus>`, inheriting the university's
  theme, listed in the sitemap and statically generated.
- A reusable campus selector, rendered only where a university has two or more published
  campuses. Plain links, so it works without JavaScript and each campus has a shareable URL.
- Admin-configurable homepage sections, for the university and per campus, with ordering by
  keyboard-operable up/down controls. A campus with no configuration of its own inherits the
  university's layout.
- Honest profile states throughout: `COMING_SOON` / `IN_PROGRESS` / `COMPLETE` are editable and
  drive the badges visitors see.

**Verified against the live database**

A university was given two campuses through the dashboard alone — no code change — the selector
appeared at two campuses, a section was disabled for one campus only and the other correctly
inherited the university layout, and a campus was then deleted. Every step was audited.

**Fixed during verification**

- `isHomepageSectionKey` used `in`, which walks the prototype chain, so a forged `constructor`
  or `__proto__` section key passed validation. Now `Object.hasOwn`.
- Saving a homepage layout ran an interactive transaction with a query per section — over a
  dozen sequential round trips, which exceeded Prisma's 5s transaction timeout against a pooled
  remote database and made saves fail silently. Now one batched transaction.

## Milestone 3 — Businesses, advertising and the campus tour ✅ (partial)

Rescoped on request: **societies were dropped from the product** and replaced by a virtual campus
tour, and the business directory and advertising were pulled forward from Milestones 5 and 6
because they are the MVP priority.

**Built**

- **Campus business directory** — public listing with category filtering and search, a detail
  page with contact details, opening information and a map, and admin CRUD. Sponsored listings
  sort first and are always labelled.
- **Verification workflow** — a public application form, a scoped review queue, and a decision
  that records *what was actually checked*. Approving creates a **draft** listing, because
  confirming a business exists is not the same as deciding its copy is ready to publish. Badges
  carry an expiry so they must be renewed.
- **Public reporting** — anyone can report a listing as closed, wrong or misleading. Reports go
  to a moderation queue; nothing is removed automatically.
- **Advertising** — a public enquiry form, an admin queue with statuses, and placements that are
  unavailable until a Super Admin switches them on. Paying never affects verification or polls.
- **Virtual campus tour** — ordered, mapped stops with evidence labelling, admin CRUD, and a
  per-campus view. A stop cannot be published without a map, so visitors never see an empty panel.
- **Safe map embeds** — `lib/maps.ts` accepts only Google Maps embed URLs, extracts the `src`
  from a pasted `<iframe>`, and refuses everything else. It is the only iframe in UniSpace.

**Fixed during verification**

- Optional form fields rejected *missing* keys, not just empty ones. A university with no
  campuses did not render the campus `<select>`, so the whole public application form failed with
  "expected string, received undefined". All form parsing now goes through `lib/form-fields.ts`.
  (In Zod 4 the key must be `.optional()`; a `z.union([z.string(), z.undefined()])` still reports
  it as required.)
- `looksLikeHtml` rejected a bare `<`, so a business writing "Prices < MK1000" was told to remove
  HTML tags. It now requires a complete tag.

**Still open from the original Milestone 3**

Events hub, SRC directory and "Did You Know?" tips, plus the general submissions queue. The
business reporting path exercises the moderation model, but the other modules still need theirs.

**Not built, by request:** business reviews. The directory is shaped for them — see the reserved
section at the end of `prisma/schema.prisma` for the intended model and why verification and
reviews stay separate.

## Milestone 4 — Polls

Admin-created polls, public voting without an account, configurable result visibility, and
proportionate anti-abuse protection. Update the Privacy Policy's poll section to match what ships.

## Milestone 5 — Events, SRC and tips

The parts of the original Milestone 3 not yet built: the events hub with filtering by university,
campus, category and date; the SRC directory with council terms, positions and verification; and
"Did You Know?" tips with evidence levels and review dates. Plus the general public submissions
queue and its moderation workflow.

## Milestone 6 — Business reviews and advertising delivery

Student reviews of campus businesses — see the reserved design note at the end of
`prisma/schema.prisma` for the intended model, and why a review and a verification badge must
stay separate things. Plus sponsored placement delivery and reporting.
**Still no payment processing.**

## Milestone 7 — Legal, moderation and administration

Administrator invitation and assignment screens. In-dashboard legal editing with drafts, preview,
publishing and version history. Contact and report forms with category routing. Moderation queue.
Verify every permission boundary again.

## Milestone 8 — Production readiness

Test all six universities and theme switching on real devices. Verify a seventh university can be
added with no code change. Security and accessibility audits. Performance against the LCP / CLS /
INP targets. Backup and restore rehearsal. **Independent legal review of the Privacy Policy and
Terms of Use**, then flip `legal.review_status` to `reviewed`.

## Standing requirements

Carried into every milestone:

- Never invent people, businesses, events, prices, coordinates or endorsements.
- Keep the legal documents in step with what the code actually does.
- Server-side permission and scope checks on every mutation.
- Public browsing stays account-free; public submissions never bypass moderation.
- Respect `prefers-reduced-motion`; never rely on animation alone to convey meaning.
- No academic programmes directory — link to the university's own website.
