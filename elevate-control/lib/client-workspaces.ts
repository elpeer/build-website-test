// ─────────────────────────────────────────────────────────────────────
//  Client dashboard — stages + workspaces.
//
//  STAGES are the funnel: quote → spec → ... → live. Order matters.
//  WORKSPACES are the cards on the client dashboard. Each card has a
//  "minimum stage" — until the project reaches that stage, the card is
//  locked. The studio can override per-workspace with a row in
//  client_workspace_overrides.
// ─────────────────────────────────────────────────────────────────────

export type ProjectStage =
  | 'quote' | 'spec' | 'design' | 'frontend' | 'backend' | 'qa'
  | 'integrations' | 'launch' | 'live';

export const PROJECT_STAGES: ProjectStage[] = [
  'quote', 'spec', 'design', 'frontend', 'backend', 'qa',
  'integrations', 'launch', 'live',
];

export const STAGE_LABELS: Record<ProjectStage, string> = {
  quote:        'הצעת מחיר',
  spec:         'אפיון',
  design:       'עיצוב',
  frontend:     'פרונט-אנד',
  backend:      'בק-אנד',
  qa:           'QA',
  integrations: 'אינטגרציות',
  launch:       'עליה לאוויר',
  live:         'באוויר',
};

export type WorkspaceSlug =
  | 'finance' | 'spec' | 'design' | 'development' | 'qa'
  | 'content' | 'integrations' | 'launch' | 'training';

export interface WorkspaceMeta {
  slug:      WorkspaceSlug;
  label:     string;
  emoji:     string;
  blurb:     string;       // one-line description on the card
  minStage:  ProjectStage; // unlocks at this stage or later
  lockedMsg: string;       // shown when locked
}

export const WORKSPACES: WorkspaceMeta[] = [
  {
    slug: 'finance', label: 'כספים', emoji: '💰',
    blurb: 'הצעות מחיר, חשבוניות, תוספות',
    minStage: 'quote',
    lockedMsg: 'יוצג ברגע שתישלח הצעת המחיר.',
  },
  {
    slug: 'spec', label: 'אפיון', emoji: '📄',
    blurb: 'שאלון עומק, סיכום ראיון, מסמכי אפיון טכני',
    minStage: 'spec',
    lockedMsg: 'ייפתח כשנתחיל את שלב האפיון.',
  },
  {
    slug: 'design', label: 'עיצוב', emoji: '🎨',
    blurb: 'Brand book, חומרים, פיגמה, אישורים והערות',
    minStage: 'design',
    lockedMsg: 'ייפתח כשנתחיל בעיצוב.',
  },
  {
    slug: 'development', label: 'פיתוח', emoji: '💻',
    blurb: 'לינקים לאישור, מערכת תגובות, CMS',
    minStage: 'frontend',
    lockedMsg: 'ייפתח כשהפיתוח יתחיל.',
  },
  {
    slug: 'qa', label: 'QA', emoji: '🧪',
    blurb: 'דיווח באגים, ClickUp, Checklist',
    minStage: 'qa',
    lockedMsg: 'ייפתח בשלב הבדיקות.',
  },
  {
    slug: 'content', label: 'תוכן', emoji: '📝',
    blurb: 'ניהול תוכן, ארגון חומרים, העלאות',
    minStage: 'spec',
    lockedMsg: 'ייפתח עם תחילת האפיון.',
  },
  {
    slug: 'integrations', label: 'אינטגרציות', emoji: '🔌',
    blurb: 'Checklist מותאם — קודי SDK, פיקסלים, מערכות צד שלישי',
    minStage: 'integrations',
    lockedMsg: 'ייפתח כשנתחיל את האינטגרציות.',
  },
  {
    slug: 'launch', label: 'עליה לאוויר', emoji: '🚀',
    blurb: 'Checklist עליה, בחירת תאריך, דומיין',
    minStage: 'launch',
    lockedMsg: 'ייפתח לקראת עליה לאוויר.',
  },
  {
    slug: 'training', label: 'הדרכה', emoji: '🎓',
    blurb: 'מדריכים, FAQ, טיפים לעבודה עם האתר',
    minStage: 'live',
    lockedMsg: 'ייפתח אחרי שהאתר עולה לאוויר.',
  },
];

export const WORKSPACE_BY_SLUG: Record<WorkspaceSlug, WorkspaceMeta> =
  Object.fromEntries(WORKSPACES.map(w => [w.slug, w])) as Record<WorkspaceSlug, WorkspaceMeta>;

/** Has the project reached this stage (or later)? */
export function isStageReached(current: ProjectStage, target: ProjectStage): boolean {
  return PROJECT_STAGES.indexOf(current) >= PROJECT_STAGES.indexOf(target);
}

/** Is a workspace unlocked, given current stage + per-workspace override? */
export function isWorkspaceUnlocked(
  workspace: WorkspaceMeta,
  currentStage: ProjectStage,
  override: { unlocked: boolean } | null | undefined
): boolean {
  if (override) return override.unlocked;
  return isStageReached(currentStage, workspace.minStage);
}
