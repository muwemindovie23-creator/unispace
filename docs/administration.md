# Administering UniSpace

Written for campus administrators and Super Admins. Nothing here needs a developer.

## Signing in

`/admin/login`. Accounts are created by invitation only — there is no sign-up link, because there
is no public registration for administrator accounts.

If your invitation link has expired or been used, ask a Super Admin for a new one. Links work once
and last 48 hours.

## The roles

| Role | Scope | Can do |
| --- | --- | --- |
| **Super Admin** | Whole platform | Everything: universities, themes, administrators, settings, legal documents, audit log |
| **University Admin** | One university | All campus-life content across that university's campuses, plus official links and homepage layout |
| **Campus Admin** | Named campuses | Events, SRC, tips, polls, tour stops and business listings **for those campuses only** |
| **Content Editor** | University or campus | Draft and edit content; cannot publish |
| **Business Reviewer** | University or campus | Process business verification applications |

Two boundaries worth stating plainly:

- A Campus Admin **cannot** edit university-wide content (content with no campus), nor any other
  campus, nor another university.
- Nobody can grant a permission they do not already hold in that scope. Administrators cannot
  promote themselves.

## Adding a university

*Super Admin only. No code change, no deployment.*

1. **Universities → Add university.**
2. Fill in name, acronym and URL slug (the slug becomes `/universities/<slug>`).
3. Add a short description — what a student would want to know, not an institutional blurb.
4. Save. The profile starts unpublished.
5. Set its theme (below) and add its campuses.
6. Record and confirm the official website.
7. Publish when the profile is ready. It then appears on the homepage automatically.

Use the profile status honestly: **Coming soon** or **Profile being built** show a badge to
visitors, which is better than an empty page with no explanation.

## Adding campuses

**Universities → <university> → Campuses → Add campus.** Give each a name, a slug and, where it
applies, a kind (constituent college, faculty, campus). Mark one as the main campus.

Add only campuses you can confirm. A missing campus is better than a wrong one.

## Editing a theme

**Universities → <university> → Edit theme.**

1. Change colours with the picker or by typing a hex value.
2. Watch the **live preview** on the right — it is the real components with your colours.
3. Check the **contrast panel**. WCAG AA needs 4.5:1 for body text.
4. Record **where these colours came from** — a brand guideline, or a note that it is a
   placeholder. The next administrator needs to know.
5. **Save draft.** Visitors still see the published theme.
6. **Publish theme** when you are happy.

**Publishing is blocked while any pairing fails the contrast check.** This is deliberate: a brand
colour must not make a university's pages unreadable. Adjust the colour, or the label colour
drawn on it, until every row passes.

> The themes shipped with the platform are **placeholders or design directions, not confirmed
> brand colours**. Replace them with each university's real brand guideline before launch.

## Official university information

UniSpace does not reproduce admissions, programmes or entry requirements. It links out.

**Universities → <university> → Official website.** Paste the URL, then **open it and check it is
the university's own site** before ticking the confirmation box. Until you tick it, visitors are
told the link is awaiting confirmation. Confirming is recorded in the audit log under your name.

## Publishing content

All content modules follow the same path:

```
DRAFT  →  NEEDS_REVIEW  →  PUBLISHED  →  ARCHIVED
```

Not every item passes through every state — if you may publish directly, you can. Either way the
decision is recorded in the audit log.

Before publishing, set:

- **Evidence level** — is this a student report, something you checked, or an official source?
  This drives the label a visitor sees. Do not mark a student tip as verified information.
- **Source** — a URL or a note saying how you know.
- **Date checked** — and for anything with a price, a review date so it gets re-checked rather
  than quietly ageing.

## Platform settings

*Super Admin only.* **Settings.**

Contact addresses are read from here everywhere they appear, including the Privacy Policy and
Terms of Use. They are empty until you set them, and the pages say so rather than showing an
address nobody reads. Set them before launch.

`legal.review_status` stays `pending` until a qualified legal practitioner has reviewed the
Privacy Policy and Terms of Use. While it is `pending`, both pages carry a visible notice. Set it
to `reviewed` only after that review has actually happened.

## Legal documents

**Legal documents** shows each document and its version history. Version 1 of the Privacy Policy
and Terms of Use is published and live.

Publishing a change creates a **new version** — published text is never silently overwritten, and
earlier versions are kept. Record a summary of what changed, and mark material changes as such.

*In-dashboard editing arrives in Milestone 7; until then changes go through a developer so the
version history stays intact.*

## Audit log

**Audit log** records sign-ins, role changes, publishing decisions, verification outcomes and
settings changes. Passwords, tokens and raw IP addresses are never recorded.

## Inviting administrators

*Arrives in Milestone 7.* Until then, the first Super Admin is provisioned from the command line:

```bash
npm run provision:super-admin -- --email someone@example.org --name "Their Name"
```

This prints a single-use link. Send it over a channel you trust — anyone holding it can set that
account's password. Do not paste it into shared logs, tickets or group chats.

## If something is wrong on the site

Visitors can report content, and reports enter a moderation queue rather than deleting anything
automatically. Correct the content, record what you changed and why, and escalate anything serious
to a Super Admin.

For anything involving a named person — particularly SRC profiles — remove or correct first and
investigate afterwards. Do not publish personal contact details without authorisation; prefer an
official office channel.
