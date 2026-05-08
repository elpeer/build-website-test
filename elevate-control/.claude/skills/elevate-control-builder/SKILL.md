---
name: elevate-control-builder
description: "Build features for Elevate Control — the studio's internal project-management system. Covers Next.js 15 App Router patterns, Supabase server/client integration via @supabase/ssr, RLS-aware data access, the project/page/section/design data model, and the MCP server that lets Claude Code update project state. Trigger when working inside the elevate-control repo, when asked to add a new dashboard view, build a Server Action, write a Supabase migration, or extend the MCP server."
---

# Elevate Control Builder

Internal skill for building Elevate Control. Pairs with the `elevate-website-builder` skill (sibling folder) — that one covers client-facing visual conventions; this one covers the management system's own architecture.

## When to use this skill

- Adding a new dashboard route (project detail, settings, member management)
- Writing a Supabase migration (new table, new column, new RLS policy)
- Building a Server Action that mutates project state
- Extending the MCP server with a new tool
- Adding realtime subscriptions to a dashboard view

## When NOT to use this skill

- Designing client-site sections, pages, or HTML — that's `elevate-website-builder`
- Working on the Ninja Tours theme or any other client deliverable

## Reference docs

- `docs/architecture.md` — system overview
- `docs/data-model.md` — schema deep-dive
- `docs/integration-claude.md` — MCP server design
- `supabase/migrations/` — current schema state (canonical)
- `CLAUDE.md` (root) — project-level instructions

## Conventions

### Database / Supabase

- **Migrations only.** Never modify the DB through Studio in production. Every change is a numbered SQL file in `supabase/migrations/`.
- **RLS first.** Every new table MUST have RLS enabled and at minimum these policies:
  - `select` — restricted to project members (or studio admin)
  - `insert / update / delete` — restricted by role + project membership
- **`is_studio_admin()` and `is_project_member(uuid)`** are the two helper functions to use in policies. Don't rewrite that logic in raw SQL.
- **Service role usage** — only inside server-side code that's been authenticated/authorized externally. Never expose `SUPABASE_SECRET_KEY` to the browser.

### Next.js / React

- **App Router only.** No Pages Router additions.
- **Server Components by default.** Use `'use client'` only when you need interactivity (form fields, drag-drop, real-time subscriptions).
- **Server Actions** for all mutations. Form submissions never go through API routes — they go through `action="..."` on a `<form>` pointing at a server action.
- **Type the entire pipeline.** Generate types from the DB schema (`supabase gen types typescript`) and import them everywhere.
- **No raw fetch to Supabase.** Always go through the typed client (`lib/supabase/server.ts` and `lib/supabase/client.ts`).

### Auth

- **Magic-link via Supabase Auth.** Email-only.
- **Middleware** (`middleware.ts`) checks the session on every protected route and redirects to `/auth/sign-in` if missing.
- **Route groups** — `(auth)` for unauthed pages, `(dashboard)` for authed pages.

### UI

- **shadcn/ui** as the base layer. Customize tokens in `tailwind.config.ts`, not by patching shadcn components.
- **RTL-first.** All layouts use logical properties (`ms-`, `me-`, `ps-`, `pe-`). Avoid `ml-`, `mr-`, etc.
- **Hebrew is the primary language.** Provide English alongside via the same i18n approach as the agency sitemap (data attributes + a body class).

### MCP server

- **Tools, not prompts.** Each capability the user wants Claude to have becomes a typed MCP tool.
- **Idempotent.** A tool call should produce the same result if called twice in a row (or fail safely).
- **Auth via JWT.** Each tool call carries the calling user's Supabase JWT — the server validates and uses RLS-respecting queries.

## Quick reference — folder map

```
app/
  (auth)/sign-in/page.tsx             ← magic-link request form
  (auth)/callback/route.ts            ← OAuth callback handler
  (dashboard)/layout.tsx              ← authed shell with side nav
  (dashboard)/page.tsx                ← project list
  (dashboard)/projects/[id]/page.tsx  ← project detail
  api/                                ← API routes for webhooks, MCP, etc.
  layout.tsx                          ← root layout (RTL, fonts)

components/
  ui/                                 ← shadcn primitives (auto-generated)
  projects/                           ← project-specific components
  pages/                              ← page-tree components
  sections/                           ← section editors

lib/
  supabase/
    server.ts                         ← createClient() for Server Components / Actions
    client.ts                         ← createBrowserClient() for Client Components
    types.ts                          ← generated DB types

middleware.ts                         ← session check on every request

supabase/migrations/                  ← versioned SQL
```

## Output format

Same as `elevate-website-builder`: full working code first, 1–3 sentences max about what it does. Don't over-explain.
