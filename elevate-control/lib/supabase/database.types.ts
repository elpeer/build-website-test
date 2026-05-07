/**
 * Database types — placeholder until generated via Supabase CLI.
 *
 * Run `pnpm db:types` after applying the migration to overwrite this file
 * with auto-generated types from the live schema.
 *
 * This file's hand-written types are intentionally minimal — just enough
 * to keep TS happy until the CLI runs. No circular self-references, so
 * supabase-js inference works out of the box.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─── Enums ─────────────────────────────────────────────────────────────
export type ProjectStatus =
  | 'draft'
  | 'active'
  | 'on_hold'
  | 'review'
  | 'completed'
  | 'archived';

export type PageStatus =
  | 'planned'
  | 'designed'
  | 'sectioned'
  | 'in_dev'
  | 'built'
  | 'reviewed'
  | 'live';

export type SectionStatus =
  | 'planned'
  | 'confirmed'
  | 'in_dev'
  | 'built'
  | 'reviewed';

export type PageType = 'page' | 'archive' | 'single' | 'system' | 'service';

export type UserRole =
  | 'super_admin'
  | 'pm'
  | 'designer'
  | 'developer'
  | 'client';

export type MemberRole =
  | 'owner'
  | 'pm'
  | 'designer'
  | 'developer'
  | 'reviewer'
  | 'client';

export type DesignViewport = 'desktop' | 'tablet' | 'mobile';

// ─── Row types (one per table) ────────────────────────────────────────
export type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  studio_admin: boolean;
  created_at: string;
  updated_at: string;
};

export type ProjectRow = {
  id: string;
  slug: string;
  name: string;
  client_name: string | null;
  description: string | null;
  status: ProjectStatus;
  design_tokens: Json;
  logo_url: string | null;
  logo_dark_url: string | null;
  github_repo: string | null;
  github_html_path: string | null;
  github_theme_path: string | null;
  has_wordpress: boolean;
  has_mobile_design: boolean;
  kickoff_at: string | null;
  target_at: string | null;
  launched_at: string | null;
  created_by: string | null;
  pm_id: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

export type ProjectMemberRow = {
  project_id: string;
  user_id: string;
  role: MemberRole;
  added_at: string;
  added_by: string | null;
};

export type CptRow = {
  id: string;
  project_id: string;
  slug: string;
  name_he: string | null;
  name_en: string | null;
  description: string | null;
  has_archive: boolean;
  has_single: boolean;
  is_slider_only: boolean;
  field_schema: Json;
  order: number;
  created_at: string;
  updated_at: string;
};

export type TaxonomyRow = {
  id: string;
  project_id: string;
  cpt_id: string;
  slug: string;
  name_he: string | null;
  name_en: string | null;
  hierarchical: boolean;
  terms: Json;
  created_at: string;
};

export type PageRow = {
  id: string;
  project_id: string;
  slug: string;
  name_he: string | null;
  name_en: string | null;
  description: string | null;
  type: PageType;
  cpt_id: string | null;
  parent_id: string | null;
  url_pattern: string | null;
  status: PageStatus;
  order: number;
  notes: string | null;
  created_by: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

export type SectionRow = {
  id: string;
  page_id: string;
  definition_id: string | null;
  definition_slug: string;
  order: number;
  status: SectionStatus;
  section_id_override: string | null;
  content: Json;
  notes: string | null;
  design_id: string | null;
  design_crop: Json | null;
  created_at: string;
  updated_at: string;
};

export type SectionDefinitionRow = {
  id: string;
  slug: string;
  name_he: string | null;
  name_en: string | null;
  description: string | null;
  preview_url: string | null;
  recipe_id: string | null;
  content_schema: Json;
  cpt_driven: boolean;
  cpt_slug: string | null;
  category: string | null;
  is_global: boolean;
  created_at: string;
  updated_at: string;
};

export type DesignRow = {
  id: string;
  project_id: string;
  page_id: string | null;
  viewport: DesignViewport;
  storage_path: string;
  file_url: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  width_px: number | null;
  height_px: number | null;
  ai_analysis: Json | null;
  ai_analyzed_at: string | null;
  notes: string | null;
  uploaded_by: string | null;
  created_at: string;
};

export type ActivityLogRow = {
  id: string;
  project_id: string;
  actor_id: string | null;
  actor_label: string | null;
  kind: string;
  entity_type: string;
  entity_id: string | null;
  summary: string | null;
  metadata: Json | null;
  created_at: string;
};

// ─── Database envelope (shape supabase-js expects) ─────────────────────
export interface Database {
  public: {
    Tables: {
      profiles:            { Row: ProfileRow;            Insert: Partial<ProfileRow>            & { id: string; email: string };  Update: Partial<ProfileRow>;            Relationships: [] };
      projects:            { Row: ProjectRow;            Insert: Partial<ProjectRow>            & { slug: string; name: string }; Update: Partial<ProjectRow>;            Relationships: [] };
      project_members:     { Row: ProjectMemberRow;      Insert: ProjectMemberRow;                                                Update: Partial<ProjectMemberRow>;      Relationships: [] };
      cpts:                { Row: CptRow;                Insert: Partial<CptRow>                & { project_id: string; slug: string }; Update: Partial<CptRow>;          Relationships: [] };
      taxonomies:          { Row: TaxonomyRow;           Insert: Partial<TaxonomyRow>           & { project_id: string; cpt_id: string; slug: string }; Update: Partial<TaxonomyRow>; Relationships: [] };
      pages:               { Row: PageRow;               Insert: Partial<PageRow>               & { project_id: string; slug: string }; Update: Partial<PageRow>;        Relationships: [] };
      sections:            { Row: SectionRow;            Insert: Partial<SectionRow>            & { page_id: string; definition_slug: string }; Update: Partial<SectionRow>; Relationships: [] };
      section_definitions: { Row: SectionDefinitionRow;  Insert: Partial<SectionDefinitionRow>  & { slug: string }; Update: Partial<SectionDefinitionRow>; Relationships: [] };
      designs:             { Row: DesignRow;             Insert: Partial<DesignRow>             & { project_id: string; storage_path: string; file_url: string }; Update: Partial<DesignRow>; Relationships: [] };
      activity_log:        { Row: ActivityLogRow;        Insert: Partial<ActivityLogRow>        & { project_id: string; kind: string; entity_type: string }; Update: Partial<ActivityLogRow>; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: {
      is_studio_admin:   { Args: Record<string, never>; Returns: boolean };
      is_project_member: { Args: { p_project_id: string }; Returns: boolean };
    };
    Enums: {
      user_role:        UserRole;
      project_status:   ProjectStatus;
      page_status:      PageStatus;
      section_status:   SectionStatus;
      page_type:        PageType;
      member_role:      MemberRole;
      design_viewport:  DesignViewport;
    };
    CompositeTypes: Record<string, never>;
  };
}
