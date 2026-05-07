/**
 * Database types — placeholder until generated via Supabase CLI.
 *
 * Run `pnpm db:types` after applying the migration to overwrite this file
 * with auto-generated types from the live schema.
 *
 * This file's hand-written types are intentionally minimal — just enough
 * to keep TS happy until the CLI runs.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: UserRole;
          studio_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string; email: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
        Relationships: [];
      };
      projects: {
        Row: {
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
        Insert: Partial<Database['public']['Tables']['projects']['Row']> & { slug: string; name: string };
        Update: Partial<Database['public']['Tables']['projects']['Row']>;
        Relationships: [];
      };
      project_members: {
        Row: {
          project_id: string;
          user_id: string;
          role: MemberRole;
          added_at: string;
          added_by: string | null;
        };
        Insert: Database['public']['Tables']['project_members']['Row'];
        Update: Partial<Database['public']['Tables']['project_members']['Row']>;
        Relationships: [];
      };
      // Other tables — types will be filled in by `supabase gen types`
      cpts: { Row: { id: string; project_id: string; slug: string; name_he: string | null; name_en: string | null; [k: string]: unknown }; Insert: { project_id: string; slug: string }; Update: Record<string, unknown>; Relationships: [] };
      taxonomies: { Row: { id: string; cpt_id: string; slug: string; [k: string]: unknown }; Insert: { cpt_id: string; slug: string }; Update: Record<string, unknown>; Relationships: [] };
      pages: { Row: { id: string; project_id: string; slug: string; status: PageStatus; type: PageType; [k: string]: unknown }; Insert: { project_id: string; slug: string }; Update: Record<string, unknown>; Relationships: [] };
      sections: { Row: { id: string; page_id: string; definition_slug: string; status: SectionStatus; [k: string]: unknown }; Insert: { page_id: string; definition_slug: string }; Update: Record<string, unknown>; Relationships: [] };
      section_definitions: { Row: { id: string; slug: string; name_he: string | null; name_en: string | null; category: string | null; [k: string]: unknown }; Insert: { slug: string }; Update: Record<string, unknown>; Relationships: [] };
      designs: { Row: { id: string; project_id: string; viewport: DesignViewport; storage_path: string; file_url: string; [k: string]: unknown }; Insert: { project_id: string; storage_path: string; file_url: string }; Update: Record<string, unknown>; Relationships: [] };
      activity_log: { Row: { id: string; project_id: string; kind: string; entity_type: string; [k: string]: unknown }; Insert: { project_id: string; kind: string; entity_type: string }; Update: Record<string, unknown>; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: {
      is_studio_admin: { Args: Record<string, never>; Returns: boolean };
      is_project_member: { Args: { p_project_id: string }; Returns: boolean };
    };
    Enums: {
      user_role: UserRole;
      project_status: ProjectStatus;
      page_status: PageStatus;
      section_status: SectionStatus;
      page_type: PageType;
      member_role: MemberRole;
      design_viewport: DesignViewport;
    };
  };
}
