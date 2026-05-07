#!/usr/bin/env node
/**
 * Elevate Control — MCP server.
 *
 * Exposes the studio's project state (projects, pages, sections, designs,
 * activity) to Claude Code as a tool surface, so the agent can read the
 * current plan and update statuses while building a client website.
 *
 * Transport: stdio (the standard way Claude Code launches MCP servers).
 *
 * Required env vars:
 *   SUPABASE_URL          — same as NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SECRET_KEY   — service_role key (BYPASSES RLS — careful)
 *
 * Optional:
 *   ELEVATE_PROJECT_SLUG  — pre-scopes the server to one project. Most tools
 *                            then accept fewer args.
 *   ELEVATE_ACTOR_LABEL   — label for activity_log.actor_label
 *                            (default: 'Claude Code')
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

// ─── Setup ──────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const DEFAULT_PROJECT_SLUG = process.env.ELEVATE_PROJECT_SLUG ?? null;
const ACTOR_LABEL = process.env.ELEVATE_ACTOR_LABEL ?? 'Claude Code';

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('[elevate-control-mcp] Missing SUPABASE_URL or SUPABASE_SECRET_KEY env');
  process.exit(1);
}

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ─── Helpers ────────────────────────────────────────────────────────────

async function resolveProjectId(slug: string): Promise<{ id: string; slug: string; name: string }> {
  const { data, error } = await supabase
    .from('projects')
    .select('id, slug, name')
    .eq('slug', slug)
    .single();
  if (error || !data) throw new Error(`Project not found: ${slug}`);
  return data as { id: string; slug: string; name: string };
}

async function logActivity(args: {
  projectId: string;
  kind: string;
  entityType: string;
  entityId: string | null;
  summary: string;
}) {
  await supabase.from('activity_log').insert({
    project_id:  args.projectId,
    actor_id:    null,
    actor_label: ACTOR_LABEL,
    kind:        args.kind,
    entity_type: args.entityType,
    entity_id:   args.entityId,
    summary:     args.summary,
  });
}

function ok(value: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] };
}

// ─── Tool schemas (Zod) ─────────────────────────────────────────────────

const slugArg = (name: string) =>
  DEFAULT_PROJECT_SLUG
    ? z.string().default(DEFAULT_PROJECT_SLUG).describe(`${name} (defaults to ${DEFAULT_PROJECT_SLUG})`)
    : z.string().describe(name);

const Tools = {
  list_projects: {
    description: 'List all projects visible to this MCP server. Returns slug, name, status, target date.',
    schema: z.object({}),
    handler: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, slug, name, client_name, status, target_at, updated_at')
        .is('archived_at', null)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return ok(data ?? []);
    },
  },

  get_project: {
    description: 'Get a single project by slug, including page list, member count, and CPT count.',
    schema: z.object({ slug: slugArg('Project slug') }),
    handler: async (args: { slug: string }) => {
      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('slug', args.slug)
        .single();
      if (error || !project) throw new Error(`Project not found: ${args.slug}`);

      const [{ data: pages }, { data: members }, { data: cpts }] = await Promise.all([
        supabase.from('pages').select('id, slug, name_he, type, status, order')
          .eq('project_id', project.id).order('order'),
        supabase.from('project_members').select('user_id, role').eq('project_id', project.id),
        supabase.from('cpts').select('id, slug, name_he, has_archive, has_single').eq('project_id', project.id),
      ]);

      return ok({ project, pages: pages ?? [], members: members ?? [], cpts: cpts ?? [] });
    },
  },

  list_pages: {
    description: 'List pages in a project with type, status, and section counts.',
    schema: z.object({ project_slug: slugArg('Project slug') }),
    handler: async (args: { project_slug: string }) => {
      const project = await resolveProjectId(args.project_slug);
      const { data: pages } = await supabase
        .from('pages')
        .select('id, slug, name_he, name_en, type, cpt_id, status, order, notes')
        .eq('project_id', project.id)
        .order('order');

      const pageIds = (pages ?? []).map(p => p.id);
      const { data: sections } = pageIds.length
        ? await supabase.from('sections').select('page_id').in('page_id', pageIds)
        : { data: [] as { page_id: string }[] };

      const counts = new Map<string, number>();
      (sections ?? []).forEach(s => counts.set(s.page_id, (counts.get(s.page_id) ?? 0) + 1));

      return ok((pages ?? []).map(p => ({ ...p, section_count: counts.get(p.id) ?? 0 })));
    },
  },

  get_page: {
    description: 'Get a single page with all its sections and section definitions resolved.',
    schema: z.object({
      project_slug: slugArg('Project slug'),
      page_slug:    z.string().describe('Page slug'),
    }),
    handler: async (args: { project_slug: string; page_slug: string }) => {
      const project = await resolveProjectId(args.project_slug);
      const { data: page } = await supabase
        .from('pages')
        .select('*')
        .eq('project_id', project.id)
        .eq('slug', args.page_slug)
        .single();
      if (!page) throw new Error(`Page not found: ${args.page_slug}`);

      const { data: sections } = await supabase
        .from('sections')
        .select('id, definition_slug, status, notes, order, content')
        .eq('page_id', page.id)
        .order('order');

      const slugs = Array.from(new Set((sections ?? []).map(s => s.definition_slug)));
      const { data: defs } = slugs.length
        ? await supabase.from('section_definitions')
            .select('slug, name_he, name_en, category, recipe_id, content_schema, cpt_driven')
            .in('slug', slugs)
        : { data: [] };

      const defsMap = new Map((defs ?? []).map(d => [d.slug, d]));
      const enriched = (sections ?? []).map(s => ({ ...s, definition: defsMap.get(s.definition_slug) }));

      return ok({ page, sections: enriched });
    },
  },

  update_page_status: {
    description: 'Set the status of a page (planned, designed, sectioned, in_dev, built, reviewed, live).',
    schema: z.object({
      project_slug: slugArg('Project slug'),
      page_slug:    z.string().describe('Page slug'),
      status: z.enum(['planned','designed','sectioned','in_dev','built','reviewed','live']),
    }),
    handler: async (args: { project_slug: string; page_slug: string; status: string }) => {
      const project = await resolveProjectId(args.project_slug);
      const { data: page, error } = await supabase
        .from('pages')
        .update({ status: args.status })
        .eq('project_id', project.id)
        .eq('slug', args.page_slug)
        .select('id, slug, name_he, status')
        .single();
      if (error || !page) throw new Error(error?.message ?? `Page not found: ${args.page_slug}`);

      await logActivity({
        projectId: project.id,
        kind: 'updated',
        entityType: 'page',
        entityId: page.id,
        summary: `סטטוס "${page.name_he ?? page.slug}" עודכן ל-${args.status}`,
      });
      return ok(page);
    },
  },

  update_section_status: {
    description: 'Set the status of a section (planned, confirmed, in_dev, built, reviewed).',
    schema: z.object({
      section_id: z.string().describe('Section UUID'),
      status: z.enum(['planned','confirmed','in_dev','built','reviewed']),
    }),
    handler: async (args: { section_id: string; status: string }) => {
      const { data: section, error } = await supabase
        .from('sections')
        .update({ status: args.status })
        .eq('id', args.section_id)
        .select('id, page_id, definition_slug, status')
        .single();
      if (error || !section) throw new Error(error?.message ?? `Section not found: ${args.section_id}`);

      const { data: page } = await supabase.from('pages').select('project_id').eq('id', section.page_id).single();
      if (page?.project_id) {
        await logActivity({
          projectId: page.project_id,
          kind: 'updated',
          entityType: 'section',
          entityId: section.id,
          summary: `סטטוס סקשן ${section.definition_slug} עודכן ל-${args.status}`,
        });
      }
      return ok(section);
    },
  },

  update_section_notes: {
    description: 'Append or replace notes on a section (developer/designer notes, not user content).',
    schema: z.object({
      section_id: z.string(),
      notes:      z.string().describe('Free-text notes. Replaces existing notes.'),
    }),
    handler: async (args: { section_id: string; notes: string }) => {
      const { data, error } = await supabase
        .from('sections')
        .update({ notes: args.notes })
        .eq('id', args.section_id)
        .select('id, definition_slug')
        .single();
      if (error || !data) throw new Error(error?.message ?? 'Update failed');
      return ok(data);
    },
  },

  list_section_definitions: {
    description: 'List the global catalog of section definitions (the section_recipes mirror).',
    schema: z.object({
      category: z.string().optional().describe('Filter by category (hero, feature, listing, content, ...)'),
    }),
    handler: async (args: { category?: string }) => {
      let q = supabase.from('section_definitions')
        .select('slug, name_he, name_en, category, recipe_id, cpt_driven, description')
        .order('category').order('slug');
      if (args.category) q = q.eq('category', args.category);
      const { data, error } = await q;
      if (error) throw error;
      return ok(data ?? []);
    },
  },

  list_designs: {
    description: 'List uploaded designs for a project, optionally filtered by viewport or page.',
    schema: z.object({
      project_slug: slugArg('Project slug'),
      viewport:     z.enum(['desktop','tablet','mobile']).optional(),
      page_slug:    z.string().optional(),
    }),
    handler: async (args: { project_slug: string; viewport?: string; page_slug?: string }) => {
      const project = await resolveProjectId(args.project_slug);

      let pageIdFilter: string | null = null;
      if (args.page_slug) {
        const { data: pg } = await supabase.from('pages').select('id').eq('project_id', project.id).eq('slug', args.page_slug).single();
        if (pg) pageIdFilter = pg.id;
      }

      let q = supabase.from('designs')
        .select('id, viewport, file_url, mime_type, notes, created_at, page_id')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });
      if (args.viewport) q = q.eq('viewport', args.viewport);
      if (pageIdFilter)  q = q.eq('page_id', pageIdFilter);

      const { data, error } = await q;
      if (error) throw error;
      return ok(data ?? []);
    },
  },

  list_recent_activity: {
    description: 'Return the most recent activity entries for a project.',
    schema: z.object({
      project_slug: slugArg('Project slug'),
      limit:        z.number().int().min(1).max(200).default(50),
    }),
    handler: async (args: { project_slug: string; limit: number }) => {
      const project = await resolveProjectId(args.project_slug);
      const { data, error } = await supabase
        .from('activity_log')
        .select('id, kind, entity_type, entity_id, summary, actor_label, created_at')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false })
        .limit(args.limit);
      if (error) throw error;
      return ok(data ?? []);
    },
  },

  log_note: {
    description: 'Append a free-form note to the activity log. Useful for recording decisions Claude made.',
    schema: z.object({
      project_slug: slugArg('Project slug'),
      summary:      z.string().describe('Short one-line summary'),
    }),
    handler: async (args: { project_slug: string; summary: string }) => {
      const project = await resolveProjectId(args.project_slug);
      await logActivity({
        projectId: project.id,
        kind: 'updated',
        entityType: 'project',
        entityId: project.id,
        summary: args.summary,
      });
      return ok({ logged: true });
    },
  },
} as const;

// Convert each Zod schema to the JSON Schema MCP expects.
function zodToJsonSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  // Tiny ad-hoc converter — handles the shapes we use above.
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape as Record<string, z.ZodTypeAny>;
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    for (const [key, value] of Object.entries(shape)) {
      properties[key] = zodFieldToJsonSchema(value);
      if (!value.isOptional() && !(value instanceof z.ZodDefault)) required.push(key);
    }
    return { type: 'object', properties, required, additionalProperties: false };
  }
  return { type: 'object' };
}

function zodFieldToJsonSchema(value: z.ZodTypeAny): Record<string, unknown> {
  const description = value.description;
  let inner = value;
  while (inner instanceof z.ZodOptional || inner instanceof z.ZodDefault) {
    inner = inner instanceof z.ZodOptional ? inner.unwrap() : inner._def.innerType;
  }
  if (inner instanceof z.ZodString) return { type: 'string', ...(description && { description }) };
  if (inner instanceof z.ZodNumber) return { type: 'number', ...(description && { description }) };
  if (inner instanceof z.ZodBoolean) return { type: 'boolean', ...(description && { description }) };
  if (inner instanceof z.ZodEnum) {
    return { type: 'string', enum: inner.options, ...(description && { description }) };
  }
  return { type: 'string', ...(description && { description }) };
}

// ─── Server ─────────────────────────────────────────────────────────────

const server = new Server(
  { name: 'elevate-control', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: Object.entries(Tools).map(([name, tool]) => ({
    name,
    description: tool.description,
    inputSchema: zodToJsonSchema(tool.schema),
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  const tool = (Tools as Record<string, typeof Tools[keyof typeof Tools]>)[name];
  if (!tool) throw new Error(`Unknown tool: ${name}`);

  const parsed = tool.schema.parse(args);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await (tool.handler as any)(parsed);
});

const transport = new StdioServerTransport();
await server.connect(transport);

console.error(`[elevate-control-mcp] ready (project: ${DEFAULT_PROJECT_SLUG ?? '<any>'}, actor: ${ACTOR_LABEL})`);
