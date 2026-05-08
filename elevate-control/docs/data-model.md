# Data Model — Elevate Control

Canonical schema lives in `supabase/migrations/0001_initial_schema.sql`. This doc is a higher-level walkthrough of why the tables exist and how they relate.

## Top-level entities

```
auth.users (Supabase) ──────────► profiles (1:1)
                                    │
                                    │ (referenced by many tables as actor)
                                    ▼
                                 projects ◄──────── project_members (M:N with profiles)
                                    │
                            ┌───────┴────────┐
                            ▼                ▼
                          pages              cpts ──── taxonomies
                            │                  ▲
                       ┌────┴────┐             │
                       ▼         ▼             │
                    sections   designs ────────┘ (single/archive pages link to a CPT)
                       ▲
                       │ (definition_id)
                       │
                section_definitions (global catalog)
```

## Tables

### `profiles`
Mirrors Supabase Auth. Created automatically by a trigger on `auth.users` insert. Holds the studio role, display name, avatar.

### `projects`
The client project. Has a slug, name, status, brand tokens (JSON), Git path, and key dates (kickoff, target, launched). The **`design_tokens`** column holds whatever the homepage analysis extracted — primary colors, fonts, radii — and downstream features can read from it instead of re-extracting.

### `project_members`
Junction table linking `projects` to `profiles` with a role per project. A person could be a `pm` on one project and a `designer` on another.

### `cpts`
Custom post types per project. Holds the slug (`attraction`, `hotel`, ...), Hebrew + English labels, and the field schema (JSON, ACF-style). The **`is_slider_only`** flag indicates a CPT that's never a public page (like client reviews).

### `taxonomies`
Per-CPT taxonomies with their terms inline as JSON (no separate `terms` table — terms are simple strings, this keeps queries fast).

### `pages`
The list of WordPress Pages in the project, including:
- Regular Pages (`type='page'`)
- CPT archive Pages (`type='archive'`, FK to `cpts`)
- CPT single templates (`type='single'`, FK to `cpts`)
- System pages (`type='system'` — 404, search)
- Service pages (`type='service'` — non-CPT specialized pages like /service/ for rail)

The **`status`** enum (planned → designed → sectioned → in_dev → built → reviewed → live) reflects the actual workflow.

### `sections`
Section instances on pages. Each row = one occurrence of a `section_definition` on a specific page, in a specific order, with its own content (JSON, mirroring the FC group structure).

The **`design_id` + `design_crop`** pair captures what part of the design this section corresponds to. `design_crop` is `{x, y, width, height}` as percentages of the design's natural size — viewport-independent.

### `section_definitions`
The global catalog (~25 entries, seeded by migration). Keep in sync with the agency skill's `section-recipes.md` and the WP theme's flexible-content layouts. **Don't** create per-project section_definitions in normal flow — push agency-wide changes to this table; project content lives in `sections`.

### `designs`
Uploaded design files in Supabase Storage. Each design is associated with a project and optionally a specific page + viewport. The **`ai_analysis`** column stores Claude Vision's structured output (proposed sections, detected colors, fonts) — set once at upload time, not regenerated.

### `activity_log`
Audit trail. Every significant action writes an entry. The **`actor_id`** is null for non-user actors (e.g., GitHub webhook); **`actor_label`** is a human-readable string ("Claude (claude-opus-4-7)") used in the activity feed.

## Status flows

### Project
```
draft  →  active  →  review  →  completed  →  archived
                ↑↓
             on_hold
```

### Page
```
planned  →  designed  →  sectioned  →  in_dev  →  built  →  reviewed  →  live
```
Pages can advance non-linearly when the editor manually overrides — these are guidance, not enforced state machines.

### Section
```
planned  →  confirmed  →  in_dev  →  built  →  reviewed
```

## RLS in 30 seconds

Every user-facing table:
- `select` policy: `is_studio_admin() OR is_project_member(project_id)`
- `for all` policy: same
- `section_definitions`: select-only for everyone, all-mutations for studio admins
- `profiles`: select for everyone, update for self, all for studio admins

Service role (used by server-side code with the secret key) bypasses everything.

## Why some choices

- **Why `definition_slug` denormalized on `sections`** — saves a JOIN on the hot read path (rendering a page tree). The FK to `section_definitions.id` exists for integrity, but `definition_slug` is what most queries use.
- **Why `terms` as JSON inside `taxonomies`** — taxonomy terms are simple labels with no per-term metadata in this domain. JSON keeps the table count down and queries simpler. If we ever need rich term data (translations, icons), we'd add a `taxonomy_terms` table.
- **Why no separate `tasks` table** — page+section status enums cover the workflow tracking the studio actually does. Adding tasks introduces a parallel system to keep in sync. If we discover we need it, add it later.
- **Why `pages.cpt_id` is nullable** — most pages aren't CPT-related. Only `type IN ('archive', 'single')` use it.
- **Why `activity_log` has both `actor_id` and `actor_label`** — `actor_id` is for users; `actor_label` is for non-user actors (Claude, GitHub bot, scheduled jobs). Both fields can be set when a user triggers a Claude action — `actor_id` = user, `actor_label` = "Claude on behalf of [user]".

## When to add a table vs a JSON column

- **Add a table** when the data has its own lifecycle, RLS needs, or queries (filter / sort / aggregate).
- **Use a JSON column** when the data is bag-of-properties for a single owning row (e.g., `design_tokens`, `field_schema`).
- **Borderline cases** — start with JSON, migrate to a table when query needs emerge.
