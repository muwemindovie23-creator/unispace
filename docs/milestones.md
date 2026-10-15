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

## Milestone 3 — Events and student life

Events hub with filtering by university, campus, category and date. SRC directory with council
terms, positions and verification. Societies directory. "Did You Know?" tips with evidence levels
and review dates. Public submission and moderation workflows.

## Milestone 4 — Polls

Admin-created polls, public voting without an account, configurable result visibility, and
proportionate anti-abuse protection. Update the Privacy Policy's poll section to match what ships.

## Milestone 5 — Campus businesses

Directory, application form, the `PENDING → VERIFIED → NEEDS_REVIEW → REJECTED → EXPIRED`
verification workflow with evidence and reviewer recorded, renewals, reporting, and the "Become a
Verified Campus Business" landing page with an explicit statement of what the badge means.

## Milestone 6 — Advertising

Advertise With Us page, enquiry capture and statuses, configurable placements, clearly labelled
sponsored content. **No payment processing.**

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
