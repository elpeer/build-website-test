# Claude Code Integration — Elevate Control

How Claude Code talks to Elevate Control, and how we want it to talk in the future.

## Phase 1 — REST + curl (today)

Until the MCP server ships, Claude Code interacts with Elevate Control by calling Supabase's auto-generated REST endpoints via `curl` from the Bash tool.

```bash
# Read all projects the user is a member of
curl -s "$SUPABASE_URL/rest/v1/projects?select=*" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN"

# Insert a section
curl -s -X POST "$SUPABASE_URL/rest/v1/sections" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "page_id": "...", "definition_slug": "home_hero", "order": 1 }'
```

**Setup**: each Claude Code session needs `SUPABASE_URL` + `SUPABASE_ANON_KEY` + a user access token (logged-in JWT) in env vars. Functional but clunky.

## Phase 3 — MCP server (planned)

We ship `@elevate/control-mcp` as an npm package. Devs install once:

```bash
claude mcp add elevate-control npx @elevate/control-mcp
```

The MCP server reads the user's auth token from a config file (`~/.elevate-control`), exposes typed tools to Claude, and handles all the Supabase round-trips.

### Tool surface (planned)

```
list_my_projects()                            → Project[]
open_project(slug or id)                      → ProjectDetail
get_page_tree(project_id)                     → Page[] with nested sections

create_page(project_id, name, type, ...)      → Page
update_page(page_id, partial)                 → Page
add_section(page_id, definition_slug, ...)    → Section
update_section(section_id, partial)           → Section
reorder_sections(page_id, [section_ids])      → ok

upload_design(project_id, page_id?, file)     → Design
analyze_design(design_id)                     → AnalysisResult (proposed sections)

set_status(entity_type, entity_id, status)    → ok
log_activity(kind, summary, metadata?)        → ok

list_section_definitions()                    → SectionDefinition[]
get_section_definition(slug)                  → SectionDefinition
```

### Auth model

The MCP server holds the user's Supabase JWT and forwards it on every request. RLS applies normally — Claude can only do what the calling user can do.

For studio-admin operations that should bypass RLS (e.g., creating a new project), the user authorizes once via the dashboard, which mints a short-lived elevated token the MCP server can use.

### Auto-detection of current project

When Claude Code runs in a directory like `clients/sushi-bar/` and the MCP server is connected, the first MCP call reads `pwd` and looks up the project by `github_html_path` or by a `.elevate-control.json` file in the folder. The user doesn't have to specify the project explicitly.

```
clients/
└── sushi-bar/
    ├── .elevate-control.json   ← { "project_id": "..." }
    ├── static-html/             ← github_html_path
    └── wp-theme/                ← github_theme_path
```

## How Claude updates status

Three mechanisms, in order of automation:

1. **Explicit MCP call** — Claude finishes building a section, calls `set_status('section', id, 'built')`. Most common in the design + dev workflow.
2. **GitHub webhook** — A commit hits the repo. The webhook parses commit messages for tags like `[section:abc123:built]` and updates statuses automatically.
3. **Manual via dashboard** — PM or designer flips a status by hand.

All three write to `activity_log` with the appropriate `actor_id` / `actor_label`.

## Cross-skill coordination

When Claude Code is running in an Elevate Control project, it should have access to:

- `elevate-website-builder` skill — for any client-facing visual code (the agency's design system + WP conventions)
- `elevate-control-builder` skill — for management system internals (Next.js, Supabase, MCP)

Both live in `.claude/skills/` of this repo.

When Claude is running in a *client* project (like `ninja-tours`), only `elevate-website-builder` is needed.

## Security boundaries

- Service role key never leaves the server. Claude Code talks to the MCP server, the MCP server talks to Supabase. Even with a malicious tool call, RLS contains the blast radius to the calling user's projects.
- Storage signed URLs expire after 1 hour; Claude only ever holds a short-lived URL, never a permanent file path.
- Activity log captures every Claude action (with `actor_label = 'Claude on behalf of <user>'`) so a malicious script can be traced and reverted.
