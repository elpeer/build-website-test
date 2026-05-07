'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateDigestSettings } from '@/app/actions/profile';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Save, CheckCircle2, AlertCircle, Mail } from 'lucide-react';

interface Props {
  enabled: boolean;
  hour: number;
}

export function DigestSettings({ enabled: initialEnabled, hour: initialHour }: Props) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [hour, setHour] = useState(initialHour);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null); setSuccess(false);
    startTransition(async () => {
      const result = await updateDigestSettings({ enabled, hour });
      if (result.ok) { setSuccess(true); router.refresh(); }
      else setError(result.error);
    });
  }

  return (
    <div className="space-y-3">
      <label className="flex items-start gap-3 rounded-md border border-border bg-background p-3">
        <input type="checkbox" checked={enabled}
               onChange={e => setEnabled(e.target.checked)}
               className="mt-1 h-4 w-4" />
        <div className="flex-1">
          <p className="flex items-center gap-2 font-medium">
            <Mail className="h-4 w-4" />
            סיכום יומי במייל
          </p>
          <p className="text-sm text-muted-fg">
            תקבל מייל כל יום עם סיכום פעילות מהיום הקודם בכל הפרויקטים שאתה חבר בהם — תגובות חדשות, אישורים, commits.
          </p>
        </div>
      </label>

      {enabled && (
        <div className="rounded-md border border-border bg-muted/30 p-3">
          <Label htmlFor="digest_hour" className="text-xs">שעת שליחה (זמן ישראל)</Label>
          <div className="mt-1 flex items-center gap-2">
            <select id="digest_hour" value={hour}
                    onChange={e => setHour(Number(e.target.value))}
                    className="block h-10 rounded-md border border-border bg-background px-3 text-sm">
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
              ))}
            </select>
            <span className="text-sm text-muted-fg">בכל יום</span>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><span>נשמר.</span>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="button" variant="accent" onClick={handleSave} disabled={isPending}>
          <Save className="ms-1 h-4 w-4" />
          {isPending ? 'שומר...' : 'שמור'}
        </Button>
      </div>
    </div>
  );
}
