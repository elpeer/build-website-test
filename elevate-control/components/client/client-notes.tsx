'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setWorkspaceSetting } from '@/app/actions/client-workspace';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, CheckCircle2 } from 'lucide-react';

interface Props {
  projectId: string;
  projectSlug: string;
  workspace: string;
  settingKey: string;
  label: string;
  placeholder?: string;
  initialValue: string | null;
  /** Read-only when false. */
  canEdit: boolean;
}

export function ClientNotes({
  projectId, projectSlug, workspace, settingKey, label, placeholder,
  initialValue, canEdit,
}: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue ?? '');
  const [savedValue, setSavedValue] = useState(initialValue ?? '');
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Auto-save 2 seconds after last keystroke
  useEffect(() => {
    if (!canEdit) return;
    if (value === savedValue) return;
    const t = setTimeout(() => {
      startTransition(async () => {
        await setWorkspaceSetting(projectId, projectSlug, workspace, settingKey, value || null);
        setSavedValue(value);
        setSavedAt(Date.now());
        router.refresh();
      });
    }, 1500);
    return () => clearTimeout(t);
  }, [value, savedValue, canEdit, projectId, projectSlug, workspace, settingKey, router]);

  if (!canEdit) {
    return (
      <div className="rounded-md border border-border bg-background p-4">
        <h3 className="mb-2 text-sm font-semibold">{label}</h3>
        {value ? (
          <p className="whitespace-pre-wrap text-sm">{value}</p>
        ) : (
          <p className="text-sm italic text-muted-fg">לא נכתבו הערות.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-border bg-background p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{label}</h3>
        {savedAt && Date.now() - savedAt < 3000 && (
          <span className="inline-flex items-center gap-1 text-xs text-green-600">
            <CheckCircle2 className="h-3 w-3" />
            נשמר
          </span>
        )}
      </div>
      <Textarea rows={6} value={value} onChange={e => setValue(e.target.value)}
                placeholder={placeholder} />
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-fg">
          {isPending ? 'שומר...' : 'נשמר אוטומטית אחרי כמה שניות'}
        </p>
        {value !== savedValue && (
          <Button type="button" variant="ghost" size="sm"
                  onClick={() => {
                    startTransition(async () => {
                      await setWorkspaceSetting(projectId, projectSlug, workspace, settingKey, value || null);
                      setSavedValue(value); setSavedAt(Date.now());
                      router.refresh();
                    });
                  }} disabled={isPending}>
            <Save className="ms-1 h-3.5 w-3.5" />
            שמור עכשיו
          </Button>
        )}
      </div>
    </div>
  );
}
