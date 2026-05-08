'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setWorkspaceSetting } from '@/app/actions/client-workspace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Eye, EyeOff, Edit2, Save, X, Check, ExternalLink, KeyRound } from 'lucide-react';

interface Props {
  projectId: string;
  projectSlug: string;
  workspace: string;
  cmsUrl: string | null;
  cmsUser: string | null;
  cmsPassword: string | null;
  isStudio: boolean;
}

/**
 * CMS access block — shows the CMS URL plus user/password with copy buttons.
 * Studio can edit; client can copy and use. Password is masked by default.
 */
export function CmsCredentials({
  projectId, projectSlug, workspace,
  cmsUrl, cmsUser, cmsPassword, isStudio,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [url, setUrl] = useState(cmsUrl ?? '');
  const [user, setUser] = useState(cmsUser ?? '');
  const [pwd, setPwd] = useState(cmsPassword ?? '');
  const [, startTransition] = useTransition();
  const [copied, setCopied] = useState<'user' | 'pwd' | null>(null);

  function copy(value: string, kind: 'user' | 'pwd') {
    navigator.clipboard.writeText(value);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1200);
  }

  function save() {
    startTransition(async () => {
      await Promise.all([
        setWorkspaceSetting(projectId, projectSlug, workspace, 'cms_url',      url || null),
        setWorkspaceSetting(projectId, projectSlug, workspace, 'cms_user',     user || null),
        setWorkspaceSetting(projectId, projectSlug, workspace, 'cms_password', pwd || null),
      ]);
      setEditing(false);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <div className="space-y-3 rounded-lg border border-brand bg-brand/5 p-4">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-brand" />
          <h3 className="font-semibold">פרטי גישה ל-CMS</h3>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">כתובת מערכת הניהול</Label>
          <Input value={url} dir="ltr" className="font-mono text-sm"
                 placeholder="https://example.com/wp-admin"
                 onChange={e => setUrl(e.target.value)} />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs">שם משתמש</Label>
            <Input value={user} dir="ltr" className="font-mono text-sm"
                   onChange={e => setUser(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">סיסמה</Label>
            <Input value={pwd} dir="ltr" className="font-mono text-sm"
                   onChange={e => setPwd(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm"
                  onClick={() => {
                    setEditing(false);
                    setUrl(cmsUrl ?? ''); setUser(cmsUser ?? ''); setPwd(cmsPassword ?? '');
                  }}>
            <X className="ms-1 h-3.5 w-3.5" />
            ביטול
          </Button>
          <Button type="button" variant="accent" size="sm" onClick={save}>
            <Save className="ms-1 h-3.5 w-3.5" />
            שמור
          </Button>
        </div>
      </div>
    );
  }

  const hasAny = cmsUrl || cmsUser || cmsPassword;

  return (
    <div className="rounded-lg border border-border bg-background p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-brand" />
          <h3 className="font-semibold">פרטי גישה ל-CMS</h3>
        </div>
        {isStudio && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Edit2 className="ms-1 h-3.5 w-3.5" />
            {hasAny ? 'ערוך' : 'הוסף'}
          </Button>
        )}
      </div>

      {!hasAny ? (
        <p className="text-sm text-muted-fg italic">פרטי הגישה טרם הוגדרו.</p>
      ) : (
        <div className="space-y-2 text-sm">
          {cmsUrl && (
            <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
              <span className="w-20 shrink-0 text-xs font-semibold text-muted-fg">כתובת</span>
              <a href={cmsUrl} target="_blank" rel="noopener noreferrer" dir="ltr"
                 className="min-w-0 flex-1 truncate font-mono text-brand hover:underline">
                {cmsUrl}
              </a>
              <a href={cmsUrl} target="_blank" rel="noopener noreferrer"
                 className="shrink-0 text-muted-fg hover:text-brand" aria-label="פתח">
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}
          {cmsUser && (
            <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
              <span className="w-20 shrink-0 text-xs font-semibold text-muted-fg">משתמש</span>
              <code dir="ltr" className="min-w-0 flex-1 truncate font-mono">{cmsUser}</code>
              <button type="button" onClick={() => copy(cmsUser, 'user')}
                      className="shrink-0 rounded-md p-1 text-muted-fg hover:bg-muted hover:text-brand"
                      aria-label="העתק שם משתמש">
                {copied === 'user' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          )}
          {cmsPassword && (
            <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
              <span className="w-20 shrink-0 text-xs font-semibold text-muted-fg">סיסמה</span>
              <code dir="ltr" className="min-w-0 flex-1 truncate font-mono">
                {showPwd ? cmsPassword : '•'.repeat(Math.min(12, cmsPassword.length))}
              </code>
              <button type="button" onClick={() => setShowPwd(s => !s)}
                      className="shrink-0 rounded-md p-1 text-muted-fg hover:bg-muted hover:text-brand"
                      aria-label={showPwd ? 'הסתר סיסמה' : 'הצג סיסמה'}>
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button type="button" onClick={() => copy(cmsPassword, 'pwd')}
                      className="shrink-0 rounded-md p-1 text-muted-fg hover:bg-muted hover:text-brand"
                      aria-label="העתק סיסמה">
                {copied === 'pwd' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
