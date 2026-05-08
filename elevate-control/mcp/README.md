# Elevate Control MCP server

Lets Claude Code read and update Elevate Control project state via tools.

## Install

```bash
cd mcp
pnpm install
pnpm build
```

## Configure Claude Code

Add to `~/.config/claude-code/mcp.json` (or the project's `.claude/mcp.json`):

```json
{
  "mcpServers": {
    "elevate-control": {
      "command": "node",
      "args": ["/absolute/path/to/elevate-control/mcp/dist/server.js"],
      "env": {
        "SUPABASE_URL": "https://<project-ref>.supabase.co",
        "SUPABASE_SECRET_KEY": "sb_secret_...",
        "ELEVATE_PROJECT_SLUG": "ninja-tours",
        "ELEVATE_ACTOR_LABEL": "Claude Code (Opus 4.7)"
      }
    }
  }
}
```

`ELEVATE_PROJECT_SLUG` scopes most tools to a single project so the agent
doesn't need to pass the slug every call.

## Tools

- `list_projects` — all visible projects
- `get_project { slug }` — single project + page list + members + CPTs
- `list_pages { project_slug }` — pages with type, status, section count
- `get_page { project_slug, page_slug }` — page + sections (with definitions)
- `update_page_status { project_slug, page_slug, status }` — set status enum
- `update_section_status { section_id, status }`
- `update_section_notes { section_id, notes }`
- `list_section_definitions { category? }` — section catalog
- `list_designs { project_slug, viewport?, page_slug? }` — design files
- `list_recent_activity { project_slug, limit? }` — audit feed
- `log_note { project_slug, summary }` — append a one-line note to activity_log

## Activity attribution

All writes are logged to `activity_log` with `actor_label = ELEVATE_ACTOR_LABEL`
so you can tell agent actions apart from human ones in the dashboard.

## Security

The server uses `SUPABASE_SECRET_KEY` (service_role) and BYPASSES RLS.
Treat the env file like the secret it is — never commit it.
