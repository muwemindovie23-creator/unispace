<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## UniSpace project rules

Read `docs/architecture.md` before changing the schema, theming or authorisation.

**One platform, many universities.** No component, route or query may name a university or
hard-code a brand colour. University identity is rows in the database, applied through `--us-*`
CSS custom properties. If you find yourself writing `if (slug === 'must')`, stop.

**Authorisation.** Every mutation calls `requirePermission` / `assertCan` with a permission key
from `lib/rbac/permissions.ts` and a resolved scope. Never check a role name. Never trust a
university or campus id from the client — resolve the campus to its university in the database.
Hiding a UI control is never the control.

**Honesty rules** (product requirements, not style preferences):

- Never invent people, businesses, events, prices, coordinates or endorsements, in seeds or
  anywhere else. Render an empty state instead.
- An official link is "confirmed" only after an administrator confirms it.
- Respect `evidenceLevel` — a student tip must never be labelled as verified information.
- Keep the legal documents in `prisma/legal/` in step with what the code actually does.

**Gotchas**

- Postgres treats NULLs as distinct in unique indexes. Three tables rely on partial unique indexes
  in `prisma/migrations/20261015000100_nulls_not_distinct`. Do not drop that migration, and use
  find-then-create rather than `upsert` on those compound keys.
- Cache Components is off; public pages use `export const revalidate`, the dashboard is
  `force-dynamic`. The two models are mutually exclusive.
- `next build` prerenders public pages, so it needs a reachable database.
- No `dangerouslySetInnerHTML` anywhere. Admin-authored text goes through `lib/markdown.tsx`.

**Before finishing:** `npm run typecheck && npx eslint . && npm run test:run`.
