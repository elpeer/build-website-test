# Elevate Control

Internal project-management system for **Elevate Digital Studio**.

A custom dashboard that connects PMs, designers, and developers to every client project. The studio tracks pages, sections, statuses, designs, and decisions in one place. Designers and developers use Claude Code with an MCP server to read and update project state — the dashboard exists primarily for the PM and for visual review.

---

## Stack

- **Next.js 15** (App Router) deployed on Vercel
- **TypeScript** (strict)
- **Tailwind CSS** + **shadcn/ui**
- **Supabase** — Postgres + Auth (magic-link) + Storage + Realtime
- **MCP server** for Claude Code integration *(planned, Phase 3)*

---

## Quick start (local dev)

```bash
# 1. Clone the repo
git clone git@github.com:YOUR-USERNAME/elevate-control.git
cd elevate-control

# 2. Install deps
pnpm install            # or npm / yarn

# 3. Set env vars
cp .env.example .env.local
# Fill in: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SECRET_KEY

# 4. Apply the database schema to your Supabase project
# Option A — Supabase SQL Editor:
#   Dashboard → SQL Editor → paste supabase/migrations/0001_initial_schema.sql → Run

# Option B — Supabase CLI:
supabase db push

# 5. Run the dev server
pnpm dev
# → http://localhost:3000
```

---

## Repository structure

```
elevate-control/
├── .claude/
│   └── skills/
│       └── elevate-website-builder/   ← Shared agency skill (design system + WP conventions)
├── app/                               ← Next.js App Router (planned)
├── components/                        ← UI components (planned)
├── lib/
│   └── supabase/                      ← Supabase clients + types (planned)
├── supabase/
│   └── migrations/                    ← Versioned SQL migrations
│       └── 0001_initial_schema.sql    ← Initial schema (current)
├── docs/                              ← Architecture & data-model deep dives
├── mcp/                               ← MCP server for Claude Code (planned, Phase 3)
├── CLAUDE.md                          ← Instructions for Claude Code sessions
├── README.md
├── .env.example
└── .gitignore
```

---

## Roadmap

### Phase 1 — Foundation ✱ in progress
- [x] Initial schema (projects, pages, CPTs, sections, designs, activity log)
- [x] RLS policies and auth helpers
- [x] Seed of section definitions from the agency skill
- [ ] Next.js scaffold + Supabase clients (`@supabase/ssr`)
- [ ] Auth flow (magic-link)
- [ ] Dashboard MVP — list projects, see project tree

### Phase 2 — Design + Section Editor
- [ ] Upload designs to Supabase Storage (desktop + mobile)
- [ ] Drag-to-crop UI for marking sections on a design
- [ ] Per-section metadata editor (notes, custom fields, behaviors)
- [ ] Reference uploads (Figma links, mood boards)

### Phase 3 — AI integration
- [ ] MCP server (`@elevate/control-mcp` package)
- [ ] Claude Vision design analyzer → suggest pages and sections
- [ ] Auto-detect desktop vs mobile uploads
- [ ] Extract brand tokens from homepage design

### Phase 4 — Git sync + observability
- [ ] GitHub webhook → mark sections "built" on commit
- [ ] Activity feed in real-time via Supabase Realtime
- [ ] Slack / email notifications for PMs

---

## Roles

| Role        | Sees             | Can do                                        |
|-------------|------------------|-----------------------------------------------|
| `super_admin` | Everything       | Everything                                    |
| `pm`        | Their projects    | Create/edit projects, assign members, status  |
| `designer`  | Assigned projects | Upload designs, define sections, add notes    |
| `developer` | Assigned projects | Update build status, mark sections complete   |
| `client`    | Invited projects  | Read-only review                              |

Enforced via RLS on every table.

---

## Security

- **Service role key** lives in `SUPABASE_SECRET_KEY` env var only. Never committed, never exposed to the browser.
- **All user-facing tables have RLS enabled.** The service role bypasses RLS — used only by trusted server-side code (API routes, MCP server, migrations).
- **Magic-link auth** by default. Optional Google OAuth can be added later.

---

## Author

Built by **Elevate Digital Studio** for internal use.
