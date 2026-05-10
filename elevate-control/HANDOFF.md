# Session Handoff — Elevate Control

**Read this file first when starting a new Claude Code session on this repo.**
Combined with `CLAUDE.md` (auto-loaded), this captures everything you need to know
to be productive in 2 minutes. The codebase, git history, and migrations contain
the full truth — this doc points at them.

---

## Quick orientation

```
elevate-control/
├── app/                          ← Next.js 15 App Router routes
│   ├── (dashboard)/              ← studio-side (PMs, designers, devs)
│   │   ├── projects/[slug]/      ← project page + tree + per-page editor
│   │   ├── clients/              ← client list (role='client')
│   │   ├── admin/
│   │   │   ├── studio-members/   ← studio team management
│   │   │   ├── guides/           ← guides library admin (CRUD + categories)
│   │   │   └── section-definitions/  ← section catalog (no longer in nav,
│   │   │                              CRUD now lives inside /section-library)
│   │   ├── section-library/      ← unified catalog browser + edit
│   │   └── team/                 ← legacy users page (kept, not in nav)
│   ├── (client)/                 ← client-facing portal
│   │   └── client/[projectSlug]/ ← per-project workspaces (finance, design,
│   │                              development, qa, content, training, etc.)
│   └── actions/                  ← server actions (one file per domain)
├── components/
│   ├── client/                   ← workspace UI (approvals, files, checklist…)
│   ├── projects/                 ← studio project UI (page-tree, github panel…)
│   ├── admin/                    ← studio admin UI (guides, sections, members)
│   ├── auth/, dashboard/, team/, ui/  ← support
│   └── ui/sortable.tsx           ← reusable @dnd-kit wrapper
├── lib/
│   ├── supabase/                 ← server.ts, client.ts, database.types.ts
│   ├── client-workspaces.ts      ← workspace catalog + isWorkspaceUnlocked()
│   ├── preview-links.ts          ← match page slug → repo HTML file
│   └── ai/                       ← Claude prompt + schemas for design analysis
├── supabase/migrations/          ← versioned SQL (0001 → 0020 currently)
└── supabase/seed/                ← idempotent demo seeds (ninja-tours +
                                    full guide library)
```

---

## Database migrations status

These all exist in `supabase/migrations/`. **Several may not yet be applied
to the live Supabase project — check before assuming.**

| #  | File | What it does | Critical? |
|----|------|--------------|-----------|
| 0001–0014 | initial schema, projects, pages, sections, designs, comments, files, notifications | core tables | applied |
| 0015 | `qa_fix_notes_and_cms_creds.sql` | `checklist_items.client_note` + `amount_cents` | **may need to apply** |
| 0016 | `project_links_and_approval_kind.sql` | `project_links` table + `client_approvals.kind` | **may need to apply** |
| 0017 | `guide_categories_and_project_visibility.sql` | `guide_categories` table + `guide_articles.visibility` + `project_guide_assignments` | **may need to apply** |
| 0018 | `dev_workspace_page_aware.sql` | `client_approvals.page_id` + `pages.cms_url_override` | **may need to apply** |
| 0019 | `section_definitions_kind.sql` | `section_definitions.kind` (with heuristic backfill) | **may need to apply** |
| 0020 | `pages_preview_override_and_dev_status.sql` | `pages.preview_url_override` + `pages.dev_status` | **may need to apply** |

**To check what's applied**: any failing query like "column X does not exist"
in a server log = the corresponding migration hasn't run. The user (or CI)
runs migrations manually via Supabase SQL Editor; we don't apply them from
Claude.

If asked to apply, hand the user a raw GitHub URL like:
`https://raw.githubusercontent.com/elpeer/build-website-test/main/elevate-control/supabase/migrations/0020_pages_preview_override_and_dev_status.sql`

---

## Recent feature work (most recent first)

Use `git log --oneline -30` for the full list. Each commit message describes
what changed and why — read those before re-implementing anything.

### Page tree + dev workflow (commits c439170, 5c293b6)
- Per-row inline editors for **frontend link** (green pill) AND **CMS link**
  (purple pill). Manual override > auto-detect.
- Per-row `dev_status` dropdown (4 values: `in_dev` / `awaiting_pm` /
  `pm_approved` / `client_visible`).
- Client dev workspace **only shows pages with `dev_status='client_visible'`**.
- Same fields exposed in the inner page editor (`PageDevSettings` card).

### Page-tree-driven dev workspace (commit 79d4a64)
- Dev workspace pages come from the project's site tree, not free-form
  approvals. Bootstrapped lazily — first view auto-creates `client_approvals`
  rows for every page × kind ('frontend', 'cms').
- Frontend link from `findPagePreview()` (GitHub repo + Vercel URL).
- CMS link from `workspace_settings.development.staging_url + page.slug` or
  per-page `cms_url_override`.

### Compact page tree (commit fa7c4b7)
- Replaced big card-per-page with single-line rows.
- Drag-and-drop reorder within parent (uses indent ▶▶/◀◀ for cross-bucket).
- Inline preview status (replaces the old `PagesPreviewBoard`).

### Guides system (commits ecc08d7, e61e161, 2e69ec5, 1cf276d, 699d6f2, 25bbb80)
- Categories CRUD with reorder (drag + arrows) at `/admin/guides`.
- Per-guide visibility (`global` / `project`) + project assignments.
- 46 baseline guides across 8 categories (`supabase/seed/guides-library-part1/2/3.sql`).
- Tiptap editor with **slash-command menu** (Notion-style) — `components/ui/slash-{extension,items,menu}.tsx`.
- Frontend + admin both use the same `prose` typography classes for parity.
- Filters: chip-row by category + free-text search.

### Workspace UX (commits 7404e2a, 5105299, 23ae3f5, 6668b04, 052e361, 95530d7, 908a090)
- Reject button removed from approvals (only Approve / Request Fix).
- Workspace-level comments hidden in finance/spec/design/dev/launch/training.
- Finance: per-milestone amount + invoice upload, quote-sent vs signed-quote.
- Content: CMS credentials block (URL+user+password with copy buttons).
- QA: standard checklist seed button + inline fix-request per item.
- Approvals: ClickUp-style dense table; Dev workspace splits into Frontend/CMS tabs.
- Files: rename inline; new `project_links` for "link or file" cases (spec materials, design brand book).

### Nav + people (commits 3941408, dfe6306)
- Sidebar "חברי צוות" → "לקוחות" (`/clients`, role='client' only).
- Studio members (`/admin/studio-members`) excludes clients; per-row password reset via `SetPasswordButton`.
- "קטלוג סקשנים" admin entry removed; CRUD lives inside `/section-library`.
- Mobile drawer side-flip (right edge, RTL), portal-rendered to escape backdrop-filter container.

### Auth (commits 1f2893d, 44a496f)
- Password sign-in alongside magic-link to bypass Supabase SMTP rate limits.
- Studio admins get `SetPasswordButton` to set/reset any user's password.

---

## Architecture decisions worth knowing

1. **All UI is RTL-first Hebrew.** Use logical CSS (`start`/`end`, `inline-start`,
   `ms-`/`me-`). Test with `dir="rtl"` (set globally on `<html>`).

2. **RLS is strict.** Every table has policies. Studio admins get `is_studio_admin()`
   blanket access; other users go through `is_project_member()`.

3. **Server actions are the API.** Never expose `SUPABASE_SECRET_KEY` to the
   browser. `createServiceClient()` (in `lib/supabase/server.ts`) is for
   server-only privileged ops (e.g. inviting users).

4. **Client visibility in dev workspace is gated by `pages.dev_status`** — only
   `client_visible` shows up. This is the studio's "publish to client" lever.

5. **Sections catalog (`section_definitions`) is the AI's vocabulary.** When
   Claude analyzes a design upload, it must pick a `definition_slug` from the
   catalog — variant content goes into the per-instance `sections.content` JSONB,
   the canonical type stays consistent across projects.

6. **Drag-and-drop uses `@dnd-kit`** with optimistic UI mirror state. The shared
   wrapper is `components/ui/sortable.tsx`. Always pair drag with arrow buttons
   (accessibility + filtered views).

7. **Tiptap editor:** `prose prose-sm max-w-none ...` Tailwind Typography on both
   the editor surface AND the read-only render so what writers see matches what
   clients see.

---

## Pushing to main

Direct pushes to `main` from the Claude harness are blocked by the proxy with
`ERR Unable to parse branch information from push data`. **Workaround that
works:**

1. `git push origin main:claude/rebuild-hero-component-n9Caj` (the designated branch)
2. Open a PR via `mcp__github__create_pull_request` (base=main, head=claude/...)
3. Merge via `mcp__github__merge_pull_request`
4. `git fetch origin main && git reset --hard origin/main` to sync local

The user has explicitly approved this PR-merge flow.

---

## Open ideas the user has expressed interest in (not yet implemented)

From the "growth ideas" brainstorm — pick one and ask before starting:

- **Account/Client hierarchy** — group multiple projects under one client
  organization (Meir Group with Volvo + Honda + ...). Highest ROI for
  multi-project clients.
- **Maintenance contracts + hours bank** — recurring revenue + automatic
  hours deduction per ticket. Foundation for upsells.
- **ClickUp two-way sync** — biggest daily-efficiency win. Webhooks both
  directions, time tracking → hours bank.
- **Smart upsell triggers** — Claude-driven "client X likely needs SEO
  package" surfaced on the studio dashboard.
- **Vercel auto-pull tree** — listed pages auto-discovered from the project's
  Vercel deployment instead of hand-entered. Originally deferred.
- **Per-milestone invoices** — partially done (attachment_url on checklist
  items), inline upload UI built.

---

## Common workflows for the next session

### "Add a feature to the dev workspace"
1. Read this file + `CLAUDE.md`.
2. `grep` for `case 'development'` in `components/client/workspace-content.tsx`.
3. The dev workspace is **page-tree-driven** — see `buildDevPageRows()` in the
   same file. Pages are filtered by `dev_status='client_visible'`.

### "Fix something in the page tree"
1. Main file: `components/projects/page-tree.tsx` (~700 lines, has its own
   sortable, drag, indent, link inputs, status picker).
2. Server actions: `app/actions/pages.ts`.

### "Touch the database"
1. Add a new migration: `supabase/migrations/00XX_<descriptive>.sql`. Increment
   sequentially. Always idempotent (`if not exists`, `on conflict do nothing`).
2. Update `lib/supabase/database.types.ts` to add the new column to the row type.
3. After commit, hand the user the raw GitHub URL of the new migration.

### "Show me what changed recently"
- `git log --oneline -20`
- `git show <sha>` for any commit
- Each commit message is detailed (read them, don't guess)

---

_Last updated: end of a long session that built page-tree + dev workspace +
guides system + nav split + clients page + section library + auth password +
many UX polishes. The user is at 90% context and starting fresh._
