'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setWorkspaceSetting } from '@/app/actions/client-workspace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, ExternalLink, Edit2, X } from 'lucide-react';

interface Props {
  projectId: string;
  projectSlug: string;
  workspace: string;
  settingKey: string;
  label: string;
  placeholder?: string;
  currentValue: string | null;
  isStudio: boolean;
  isUrl?: boolean;
}

export function WorkspaceSettingInput({
  projectId, projectSlug, workspace, settingKey, label, placeholder,
  currentValue, isStudio, isUrl,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentValue ?? '');
  const [, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const result = await setWorkspaceSetting(projectId, projectSlug, workspace, settingKey, value || null);
      if (result.ok) { setEditing(false); router.refresh(); }
    });
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-background p-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-muted-fg">{label}</p>
          {currentValue ? (
            isUrl ? (
              <a href={currentValue} target="_blank" rel="noopener noreferrer"
                 dir="ltr"
                 className="inline-flex items-center gap-1 truncate text-sm text-brand hover:underline">
                {currentValue}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <p className="truncate text-sm">{currentValue}</p>
            )
          ) : (
            <p className="text-sm text-muted-fg italic">לא הוגדר</p>
          )}
        </div>
        {isStudio && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Edit2 className="ms-1 h-3.5 w-3.5" />
            ערוך
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-brand bg-brand/5 p-3">
      <Label className="text-xs">{label}</Label>
      <Input value={value} dir={isUrl ? 'ltr' : undefined}
             className={isUrl ? 'font-mono text-sm' : ''}
             placeholder={placeholder}
             onChange={e => setValue(e.target.value)} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm"
                onClick={() => { setEditing(false); setValue(currentValue ?? ''); }}>
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
