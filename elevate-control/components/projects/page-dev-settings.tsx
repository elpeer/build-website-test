'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  setPagePreviewUrlOverride, setPageCmsUrlOverride, setPageDevStatus,
  type PageDevStatus,
} from '@/app/actions/pages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, ExternalLink, AlertCircle } from 'lucide-react';

interface Props {
  pageId: string;
  projectSlug: string;
  initial: {
    preview_url_override: string | null;
    cms_url_override: string | null;
    dev_status: PageDevStatus;
  };
}

const DEV_STATUS_LABELS: Record<PageDevStatus, string> = {
  awaiting_dev:        'ממתין לפיתוח',
  in_dev:              'בפיתוח',
  awaiting_pm:         'ממתין לבדיקת מנהל',
  pm_approved:         'מאושר ע״י מנהל',
  client_visible:      'מאושר לצפיית לקוח פרונט',
  client_visible_full: 'מאושר לצפיית לקוח ניהול',
};

const DEV_STATUS_COLORS: Record<PageDevStatus, string> = {
  awaiting_dev:        'border-zinc-200 bg-zinc-50 text-zinc-600',
  in_dev:              'border-amber-200 bg-amber-50 text-amber-800',
  awaiting_pm:         'border-blue-200 bg-blue-50 text-blue-700',
  pm_approved:         'border-purple-200 bg-purple-50 text-purple-700',
  client_visible:      'border-green-200 bg-green-50 text-green-700',
  client_visible_full: 'border-emerald-300 bg-emerald-100 text-emerald-800',
};

export function PageDevSettings({ pageId, projectSlug, initial }: Props) {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState(initial.preview_url_override ?? '');
  const [cmsUrl, setCmsUrl]         = useState(initial.cms_url_override ?? '');
  const [status, setStatus]         = useState<PageDevStatus>(initial.dev_status);
  const [error, setError]           = useState<string | null>(null);
  const [savedAt, setSavedAt]       = useState<number>(0);
  const [, startTransition] = useTransition();

  function savePreview() {
    setError(null);
    startTransition(async () => {
      const r = await setPagePreviewUrlOverride(pageId, projectSlug, previewUrl || null);
      if (!r.ok) { setError(r.error); return; }
      setSavedAt(Date.now());
      router.refresh();
    });
  }
  function saveCms() {
    setError(null);
    startTransition(async () => {
      const r = await setPageCmsUrlOverride(pageId, projectSlug, cmsUrl || null);
      if (!r.ok) { setError(r.error); return; }
      setSavedAt(Date.now());
      router.refresh();
    });
  }
  function changeStatus(next: PageDevStatus) {
    if (next === status) return;
    setError(null);
    startTransition(async () => {
      const r = await setPageDevStatus(pageId, projectSlug, next);
      if (!r.ok) { setError(r.error); return; }
      setStatus(next);
      setSavedAt(Date.now());
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3 text-base">
          <span>הגדרות פיתוח של העמוד</span>
          <select value={status}
                  onChange={e => changeStatus(e.target.value as PageDevStatus)}
                  title={(status === 'client_visible' || status === 'client_visible_full') ? 'גלוי ללקוח בעמוד הפיתוח' : 'לא גלוי ללקוח בעמוד הפיתוח'}
                  className={`rounded-full border px-3 py-1 text-xs font-medium focus:outline-none ${DEV_STATUS_COLORS[status]}`}>
            {(Object.keys(DEV_STATUS_LABELS) as PageDevStatus[]).map(s => (
              <option key={s} value={s}>{DEV_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">לינק תצוגה (פרונט) — דריסה ידנית</Label>
          <div className="flex items-center gap-2">
            <Input value={previewUrl} dir="ltr" className="font-mono text-sm"
                   placeholder="https://staging.example.co.il/about"
                   onChange={e => setPreviewUrl(e.target.value)} />
            {previewUrl && (
              <a href={previewUrl} target="_blank" rel="noopener noreferrer"
                 className="rounded-md p-2 text-muted-fg hover:bg-muted hover:text-brand"
                 title="פתח לינק בטאב חדש">
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
            <Button type="button" variant="accent" size="sm" onClick={savePreview}>
              <Save className="ms-1 h-3.5 w-3.5" />
              שמור
            </Button>
          </div>
          <p className="text-[11px] text-muted-fg">
            אם ריק, נשתמש בקובץ HTML שזוהה אוטומטית מ-GitHub. הלינק הידני דורס.
          </p>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">לינק CMS — דריסה ידנית</Label>
          <div className="flex items-center gap-2">
            <Input value={cmsUrl} dir="ltr" className="font-mono text-sm"
                   placeholder="https://example.co.il/about"
                   onChange={e => setCmsUrl(e.target.value)} />
            {cmsUrl && (
              <a href={cmsUrl} target="_blank" rel="noopener noreferrer"
                 className="rounded-md p-2 text-muted-fg hover:bg-muted hover:text-brand"
                 title="פתח לינק בטאב חדש">
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
            <Button type="button" variant="accent" size="sm" onClick={saveCms}>
              <Save className="ms-1 h-3.5 w-3.5" />
              שמור
            </Button>
          </div>
          <p className="text-[11px] text-muted-fg">
            אם ריק, נחשב מ-staging_url + ה-slug של העמוד.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{error}</span>
          </div>
        )}
        {savedAt > 0 && !error && (
          <p className="text-xs text-green-700">נשמר ✓</p>
        )}
      </CardContent>
    </Card>
  );
}
