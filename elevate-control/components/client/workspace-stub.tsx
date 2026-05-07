import type { WorkspaceMeta, WorkspaceSlug } from '@/lib/client-workspaces';

const PLANNED_FEATURES: Record<WorkspaceSlug, { title: string; items: string[] }[]> = {
  finance: [
    { title: 'הצעות מחיר וחשבוניות', items: [
      'הצגת הצעת המחיר הראשית עם סטטוס אישור',
      'רשימת חשבוניות עם לינק להורדה',
      'הצעות מחיר נוספות לתוספות בפרויקט',
    ]},
  ],
  spec: [
    { title: 'אפיון', items: [
      'סיכום ראיון העומק שעשינו',
      'שאלון אפיון להשלמה',
      'מסמכים — אפיון טכני, sitemap, user flows',
      'שיתוף קבצים עם הצוות',
    ]},
  ],
  design: [
    { title: 'עיצוב', items: [
      'Brand book (לוגו, צבעים, פונטים, סגנון)',
      'רשימת עמודי האתר עם סטטוס לכל אחד',
      'לינק לפיגמה',
      'אישור / בקשת תיקון על כל עמוד',
      'מערכת תגובות עם צילום מסך, שיוך לרכיב, וציור חופשי',
      'Sync ל-ClickUp',
    ]},
  ],
  development: [
    { title: 'פיתוח', items: [
      'לינקים לעמודי הפרונט-אנד שעלו לאישור',
      'מערכת תגובות (כמו בעיצוב)',
      'לינק לעורך התוכן (CMS) של האתר',
      'שאלות ותשובות מהצוות',
    ]},
  ],
  qa: [
    { title: 'QA וטסטינג', items: [
      'דיווח באגים והערות',
      'ClickUp (משימות + תגובות)',
      'מדריך עבודה עם ClickUp',
      'Checklist בדיקות ללקוח',
      'FAQ',
    ]},
  ],
  content: [
    { title: 'ניהול תוכן', items: [
      'ארגון חומרי תוכן',
      'העלאת תמונות, וידאו, מסמכים',
      'מעקב אחרי מה הוגש ומה חסר',
    ]},
  ],
  integrations: [
    { title: 'אינטגרציות', items: [
      'Checklist מותאם לפרויקט (Google Tag Manager, פיקסלים, מערכות שיווק)',
      'לכל פריט: הסבר + העלאת קוד / מפתחות',
    ]},
  ],
  launch: [
    { title: 'עליה לאוויר', items: [
      'Checklist: סביבת פיתוח, שרת, דומיין, מעבר לפרודקשן, בדיקות',
      'בחירת תאריך ושעת עליה (Calendly-style)',
    ]},
  ],
  training: [
    { title: 'הדרכה', items: [
      'מדריכים לשימוש באתר',
      'טיפים',
      'שאלות ותשובות (FAQ)',
    ]},
  ],
};

interface Props { workspace: WorkspaceMeta; projectSlug: string }

export function WorkspaceStub({ workspace, projectSlug }: Props) {
  const sections = PLANNED_FEATURES[workspace.slug];
  void projectSlug;

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">בקרוב</p>
        <p className="mt-1">
          האזור הזה נמצא בפיתוח. בקרוב תוכלו לראות כאן את כל מה שמתואר למטה.
          בינתיים — צרו קשר עם מנהל הפרויקט.
        </p>
      </div>

      {sections.map((s, i) => (
        <div key={i} className="rounded-lg border border-border bg-background p-5">
          <h3 className="text-lg font-semibold">{s.title}</h3>
          <ul className="mt-3 space-y-1.5">
            {s.items.map((it, j) => (
              <li key={j} className="flex gap-2 text-sm">
                <span className="text-muted-fg">·</span>
                <span>{it}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
