# Architecture — Elevate Control

## What this system is

A custom dashboard for Elevate Digital Studio that tracks every client project from kickoff to launch. It centralizes:

- The **page tree** of every site (Pages, CPTs, taxonomies, sections)
- The **design assets** (desktop + mobile, with section-level crops)
- The **build status** (planned → designed → in-dev → built → live)
- The **decisions** (notes, custom fields, behaviors per section)
- The **history** (who did what, when)

The interaction model is deliberately split:

- **Designers and developers** primarily interact through Claude Code, talking to the system through an MCP server. They upload designs in chat, ask Claude to propose a structure, and Claude writes the result back to the database. Status updates flow automatically as work progresses.
- **Project managers** work in the dashboard UI. They see real-time progress across all projects, intervene when needed, assign people, and keep the studio running.
- **Clients** (optional, read-only) get an invite link to a stripped-down view of their project's progress.

## Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | Next.js 15 (App Router) | RSC + Server Actions = the smallest amount of client-side JavaScript for a CRUD-heavy admin |
| Hosting | Vercel | Native Next.js, edge for fast global access, simple env management |
| Database | Supabase (Postgres) | Real RDBMS, RLS for multi-tenant safety, easy local dev |
| Auth | Supabase Auth (magic-link) | No passwords to manage, internal-team friendly |
| Storage | Supabase Storage | Same project, one access token, simple CDN |
| Realtime | Supabase Realtime | Free dashboard updates as Claude/devs change state |
| Styling | Tailwind + shadcn/ui | Consistent base, RTL-friendly, easy to customize |
| AI | Anthropic Claude API | Vision for design analysis; same provider as Claude Code |

## Three layers, one DB

```
                ┌─────────────────────────────────────────┐
                │     CLAUDE CODE (designer / dev)        │
                │     ─────────────────────────────       │
                │     reads/writes via MCP tools          │
                └────────────────────┬────────────────────┘
                                     │
                                     ▼
┌──────────────────────────┐   ┌────────────────────┐   ┌──────────────────────────┐
│   DASHBOARD UI (PM)      │◄─►│   SUPABASE DB      │◄─►│   SCHEDULED JOBS         │
│   ──────────────────     │   │   ──────────────   │   │   ──────────────────     │
│   Next.js + Tailwind     │   │   Postgres         │   │   GitHub webhooks,       │
│   Real-time via channels │   │   RLS-enforced     │   │   nightly snapshots,     │
│                          │   │                    │   │   stale-project alerts   │
└──────────────────────────┘   └────────────────────┘   └──────────────────────────┘
                                     │
                                     ▼
                                STORAGE
                                ───────
                                designs/  (images)
                                logos/    (brand)
                                previews/ (rendered)
```

## Auth & RLS model

Supabase Auth identifies users; RLS in Postgres restricts what they see.

- **`is_studio_admin()`** — true if the user's `profiles.role = 'super_admin'` OR `studio_admin = true`. Sees everything.
- **`is_project_member(project_id)`** — true if there's a row in `project_members` for the user + project. Sees that project's data only.
- All policies use these two functions. Adding a new table = enable RLS + add a `select` and a `for all` policy that delegates to one of these helpers.

The **service role key** (`SUPABASE_SECRET_KEY`) bypasses RLS and is used only by trusted server code (Server Actions, Route Handlers, MCP server) where authorization has already been done at a higher layer.

## Data flow examples

### Designer uploads a design and Claude proposes sections

1. Designer in Claude Code: "Here's the homepage design" + image
2. Claude calls MCP tool `analyze_design(image)` → server route uploads to Supabase Storage, calls Claude Vision, parses sections from the response
3. Claude calls MCP tool `propose_structure(project_id, design_id)` → server inserts a Page row + Section rows (status = `planned`)
4. Designer opens dashboard → sees the new page tree appear in real-time (Supabase Realtime channel on `pages` table)
5. Designer clicks a section → opens an editor where they can edit notes, mark fields, change layout type
6. When done → designer marks "ready for dev" → status flips → developer's dashboard surfaces the new work

### Developer commits and the dashboard auto-updates

1. Developer pushes to GitHub
2. GitHub webhook hits `/api/github/webhook` route in the Next.js app
3. Route inspects commit metadata for tags like `[section:abc123]` or path patterns
4. Route updates section status (`built`) + writes an `activity_log` entry
5. Dashboard streams the change to anyone viewing that project

## Phases (per roadmap in README)

- **Phase 1 — Foundation**: schema, auth, dashboard MVP (this is what we're building first)
- **Phase 2 — Designs**: upload + crop UI, section metadata editor
- **Phase 3 — AI**: MCP server, Vision analyzer, brand-token extraction
- **Phase 4 — Sync**: GitHub webhooks, real-time activity feed, notifications

## Non-goals

- This is **not** a public client portal. Limited client access only via explicit invite.
- This is **not** a Trello/Asana replacement. Project status is tracked here because it's tied to actual data (pages, sections), not just abstract tasks.
- This does **not** replace the WordPress admin. The WP theme is generated *from* this system; runtime content edits stay in WP.
