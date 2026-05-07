# Elevate Control — Claude Instructions

You are working on **Elevate Control**, the internal project-management system for Elevate Digital Studio.

## What this system is

A custom dashboard that lives between the studio's PMs, designers, and developers. It tracks every client project from kickoff to launch — pages, sections, statuses, designs, and decisions. Designers and developers interact with it primarily through Claude Code; the dashboard UI is mainly for the PM and for visual review.

## Tech stack

- **Next.js 15** (App Router) on Vercel
- **TypeScript** (strict mode)
- **Tailwind CSS** + **shadcn/ui**
- **Supabase** — Postgres + Auth (magic-link) + Storage + Realtime
- **`@supabase/ssr`** for server/client auth integration
- **MCP server** (planned) so Claude Code can read/write project state via tools

## Project structure

```
elevate-control/
├── .claude/
│   └── skills/
│       └── elevate-website-builder/  ← shared from parent agency
├── app/                              ← Next.js App Router routes
├── components/                       ← UI (shadcn/ui based)
├── lib/
│   ├── supabase/                     ← server.ts + client.ts + types
│   └── ...
├── supabase/
│   └── migrations/                   ← versioned SQL migrations
├── types/                            ← shared TS types (generated from DB)
├── mcp/                              ← MCP server (separate package)
└── docs/                             ← architecture notes
```

## Conventions

- **All UI is RTL-first** (Hebrew). English label translations live alongside.
- **All database changes go through versioned migrations** in `supabase/migrations/` — never edit the DB directly through Studio in production.
- **RLS is non-negotiable.** Every table has policies. Server-only operations use the `SUPABASE_SECRET_KEY` (service_role) — never expose it to the browser.
- **Use the `elevate-website-builder` skill** when generating any client-facing visual UI to stay consistent with the agency's design language.
- **Naming**: tables snake_case, columns snake_case, TypeScript camelCase, components PascalCase, files kebab-case.

## Key environmental rules

- Never commit `.env.local` or any file containing the secret key
- Never log the secret key, even in dev
- Migrations are run by the user (or in CI) — Claude writes them, doesn't apply them in production

## Working with the user

- The user is **the studio owner** (developer + PM hybrid). Communicates in Hebrew, technical English terms ok.
- They prefer concise responses with concrete code/decisions over long explanations.
- Stop and check before destructive DB operations (drops, truncates, RLS rewrites).

## Reference docs

- `docs/architecture.md` — system overview
- `docs/data-model.md` — schema deep-dive
- `docs/integration-claude.md` — how Claude Code talks to the system
- `supabase/migrations/` — current schema state
- `.claude/skills/elevate-website-builder/` — design system + WP conventions for client work
