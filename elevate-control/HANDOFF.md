# Session Handoff — Elevate Control

**Read this file first when starting a new Claude Code session on this repo.** It captures where we left off, what's done, and what's next.

---

## Where we are

**Phase 1 — Foundation** is **code-complete** (committed locally on `main`, commit `e86e703`). The DB migration has been **written but not yet applied** to the live Supabase project. The app has **not yet been deployed** to Vercel.

### What exists in the repo

| Area | Status | Files |
|------|--------|-------|
| Database schema | ✅ written | `supabase/migrations/0001_initial_schema.sql` (470 lines, 12 tables, RLS, 26 seeded section_definitions) |
| Next.js 15 scaffold | ✅ complete | `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `app/layout.tsx`, `app/globals.css` |
| Supabase clients | ✅ complete | `lib/supabase/{server,client,middleware,database.types}.ts` |
| Auth flow | ✅ complete (magic-link) | `app/sign-in/page.tsx`, `app/auth/callback/route.ts`, `app/actions/auth.ts`, `components/auth/sign-in-form.tsx` |
| Middleware | ✅ complete | `middleware.ts` — protects all routes, redirects unauthed → `/sign-in` |
| Dashboard shell | ✅ complete | `app/projects/{layout,page}.tsx`, `components/dashboard/{sidebar,topbar}.tsx` |
| UI primitives | ✅ minimal set | `components/ui/{button,card,input}.tsx` (shadcn-style) |
| Skills | ✅ in `.claude/skills/` | `elevate-website-builder` (copied from agency repo), `elevate-control-builder` (new — for working on this repo) |
| Docs | ✅ written | `README.md`, `CLAUDE.md`, `NEXT_STEPS.md`, `docs/architecture.md`, `docs/data-model.md`, `docs/integration-claude.md` |

### What does NOT yet exist

- `/projects/new` — form to create a new project (we never built it; manual SQL insert is the workaround)
- `/projects/[slug]` — project detail page (page tree, members, designs)
- Page CRUD UI
- Section editor UI
- Design upload UI
- MCP server (Phase 3)
- Vercel deployment (env vars not set, redirect URLs not configured in Supabase Auth)

---

## Pre-flight checklist (do these BEFORE the new session)

If any of these fail, do them in this order. Each one is independent and can be re-run safely.

### 1. Push the code to GitHub (if not already done)

```bash
cd elevate-control       # whatever path you cloned to
git push -u origin main
```

The initial commit `e86e703` should already exist locally. If `git push` succeeds, skip.

### 2. Apply the DB migration

Supabase Dashboard → SQL Editor → paste `supabase/migrations/0001_initial_schema.sql` → Run.

Verify in Table Editor that 10 tables appeared:
`profiles`, `projects`, `project_members`, `cpts`, `taxonomies`, `pages`, `sections`, `section_definitions`, `designs`, `activity_log`.

### 3. Become a studio admin

In Supabase SQL Editor, run:
```sql
-- After you've signed in via magic-link at least once,
-- this elevates your auth user to studio admin.
update profiles
set studio_admin = true,
    role = 'super_admin'
where email = 'YOUR-EMAIL@example.com';
```

### 4. Configure local env

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL` = `https://siohhswzfuckkdhpuyop.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the publishable key
- `SUPABASE_SECRET_KEY` = the service_role JWT (kept secret)
- `NEXT_PUBLIC_APP_URL` = `http://localhost:3000` (for dev) or your Vercel URL (for prod env vars)

### 5. Verify locally

```bash
pnpm install      # or npm install
pnpm dev
```

Open http://localhost:3000 → should redirect to `/sign-in`. Magic-link flow should work end to end.

### 6. Grant the new sandbox access to this repo

In Claude Code settings (claude.ai/code → Permissions / Repository access), add `elpeer/elevate-managment-system` to the allowed list so the new session's MCP/proxy can read & write.

---

## Starting the new session

Open Claude Code in the repo's working directory (whatever you cloned to). Send this as your **first message**:

> אני ממשיך את הפרויקט elevate-control. תקרא את `HANDOFF.md` ו-`CLAUDE.md`, תוודא שאתה מבין איפה עצרנו, ותגיד לי מה אתה רואה ועל מה ממליץ להמשיך מ-Phase 2.

The new Claude will:
1. Read `HANDOFF.md` (this file) → understand the state
2. Read `CLAUDE.md` → understand the conventions
3. Read at least one of the docs (probably `architecture.md`) → understand the system
4. Confirm with you what to build next

---

## Phase 2 priorities (what's next)

In rough order — pick whatever you want first. They're independent:

### 2.1 — Create-project form (`/projects/new`)
Server action that inserts a new `projects` row + creates the creator as `owner` in `project_members`. Form fields: name, slug (auto-suggested from name), client_name, has_wordpress, has_mobile_design, target_at.

### 2.2 — Project detail page (`/projects/[slug]`)
Tabs: **Overview** (status, dates, members) · **Pages** (page tree) · **CPTs** · **Designs** · **Activity**. Read-only initially, edits come in 2.3.

### 2.3 — Page tree CRUD
Add/remove/reorder pages within a project. Per-page status update via dropdown. Page detail panel showing assigned designer + sections.

### 2.4 — Section editor
List of `section_definitions` to pick from. Click → adds a `sections` row to the page. Edit notes, content (basic JSON editor for now), reorder via drag.

### 2.5 — Design upload
Drag-and-drop into a project page. Upload to Supabase Storage bucket `designs/`. Auto-detect viewport (desktop/mobile) by aspect ratio. Show thumbnail in the page detail.

### 2.6 — Real-time activity feed
Right rail in project detail showing recent `activity_log` entries via Supabase Realtime channel. Format: "Designer X uploaded design for Hero section · 5 min ago".

---

## Working conventions (carryovers)

- **Hebrew RTL** is the default in all UI. English text via dual `data-i18n` spans + body class toggle when we add a language switcher.
- **All mutations through Server Actions**, not API routes. API routes only for webhooks (GitHub) and the future MCP server.
- **All tables have RLS.** Use `is_studio_admin()` and `is_project_member()` helpers — don't rewrite the policy logic.
- **Service role key** only inside server-side code. Never in browser bundles.
- **Migrations**: every schema change is a new numbered file in `supabase/migrations/`. Never edit `0001_initial_schema.sql` retroactively.

---

## If anything goes wrong

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Cannot read properties of null (reading 'auth')` | Env vars not loaded | Check `.env.local` exists, restart `pnpm dev` |
| `magic-link redirects to localhost from prod` | `NEXT_PUBLIC_APP_URL` not set in Vercel | Add it to Vercel env vars + Supabase Auth allow-list |
| `RLS denied` on a query | Not yet `studio_admin`, not yet `project_member` | Run step 3 SQL above |
| Migration error: `type already exists` | DB has stale partial state | Drop + recreate the project, OR drop offending types manually |
| New Claude session has no MCP access | Permission not granted on session start | Re-do step 6, then close + reopen the Claude Code session |

---

## File this came with

```
elevate-control/
├── HANDOFF.md              ← THIS FILE
├── README.md
├── CLAUDE.md
├── NEXT_STEPS.md
├── .env.example
├── .gitignore
├── .eslintrc.json
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── middleware.ts
├── app/
│   ├── layout.tsx
│   ├── page.tsx                       (redirects /  →  /projects)
│   ├── globals.css
│   ├── actions/auth.ts
│   ├── auth/callback/route.ts
│   ├── sign-in/page.tsx
│   └── projects/
│       ├── layout.tsx                 (authed shell)
│       └── page.tsx                   (project list)
├── components/
│   ├── ui/{button,card,input}.tsx
│   ├── auth/sign-in-form.tsx
│   ├── dashboard/{sidebar,topbar}.tsx
│   └── projects/project-card.tsx
├── lib/
│   ├── utils.ts                       (cn, formatDateHe, slugify)
│   └── supabase/
│       ├── server.ts                  (createClient + createServiceClient)
│       ├── client.ts
│       ├── middleware.ts              (updateSession)
│       └── database.types.ts          (placeholder until `pnpm db:types`)
├── supabase/
│   └── migrations/0001_initial_schema.sql
├── docs/
│   ├── architecture.md
│   ├── data-model.md
│   └── integration-claude.md
└── .claude/
    └── skills/
        ├── elevate-website-builder/   (8 reference files)
        └── elevate-control-builder/   (this system's own skill stub)
```
