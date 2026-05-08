'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateCpt } from '@/app/actions/cpts';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, AlertCircle, Code2 } from 'lucide-react';
import type { Json } from '@/lib/supabase/database.types';

interface Props {
  cptId: string;
  projectId: string;
  projectSlug: string;
  initialSchema: Json;
}

const PLACEHOLDER = `[
  { "key": "image",       "label": "תמונה ראשית", "type": "image", "required": true },
  { "key": "subtitle",    "label": "כותרת משנה",  "type": "text" },
  { "key": "description", "label": "תיאור",       "type": "wysiwyg" },
  { "key": "duration",    "label": "משך",         "type": "text" }
]`;

export function FieldSchemaEditor({ cptId, projectId, projectSlug, initialSchema }: Props) {
  const router = useRouter();
  const [text, setText] = useState(JSON.stringify(initialSchema ?? [], null, 2));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    setSuccess(false);
    let parsed: Json;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      setError(`JSON לא תקין: ${(e as Error).message}`);
      return;
    }
    if (!Array.isArray(parsed)) {
      setError('הסכמה חייבת להיות מערך של שדות');
      return;
    }

    startTransition(async () => {
      const result = await updateCpt(cptId, { projectId, projectSlug }, { field_schema: parsed });
      if (result.ok) {
        setSuccess(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-fg">
        <Code2 className="h-3.5 w-3.5" />
        <span>סכמת שדות (JSON) — מבנה ה-ACF של ה-CPT הזה</span>
      </div>

      <Textarea
        value={text}
        onChange={e => { setText(e.target.value); setSuccess(false); }}
        rows={14}
        dir="ltr"
        className="font-mono text-xs"
        placeholder={PLACEHOLDER}
      />

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          הסכמה נשמרה בהצלחה.
        </div>
      )}

      <div className="flex items-center justify-end">
        <Button type="button" variant="accent" onClick={handleSave} disabled={isPending}>
          <Save className="ms-1 h-4 w-4" />
          {isPending ? 'שומר...' : 'שמור סכמה'}
        </Button>
      </div>
    </div>
  );
}
