'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateSection, deleteSection, moveSection } from '@/app/actions/sections';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ChevronUp, ChevronDown, Trash2, Edit2, Save, X, AlertCircle } from 'lucide-react';
import { SectionPromptButtons } from '@/components/sections/section-prompt-buttons';
import type { SectionStatus, Json } from '@/lib/supabase/database.types';
import type { FieldDefForPrompt } from '@/lib/section-prompts';

interface SectionRow {
  id: string;
  definition_slug: string;
  status: SectionStatus;
  notes: string | null;
  order: number;
  content?: Json;
}

interface SectionContentMeta {
  field_schema?: FieldDefForPrompt[];
  cpt_driven?: boolean;
  cpt_slug?: string | null;
  cpt_name_he?: string | null;
}

interface PromptCtx {
  pageNameHe: string;
  pageSlug: string;
  pageType: string;
  projectName: string;
}

interface Definition {
  slug: string;
  name_he: string | null;
  name_en: string | null;
  category: string | null;
}

interface PageContext {
  pageId: string;
  projectId: string;
  projectSlug: string;
  pageSlug: string;
}

interface Props {
  section: SectionRow;
  definition: Definition | undefined;
  ctx: PageContext;
  promptCtx?: PromptCtx;
  isFirst: boolean;
  isLast: boolean;
  index: number;
}

const STATUS_LABELS: Record<SectionStatus, string> = {
  planned:   'מתוכנן',
  confirmed: 'אושר',
  in_dev:    'בפיתוח',
  built:     'נבנה',
  reviewed:  'נסקר',
};

const STATUS_PILLS: Record<SectionStatus, string> = {
  planned:   'bg-zinc-100 text-zinc-700',
  confirmed: 'bg-blue-50 text-blue-700',
  in_dev:    'bg-amber-50 text-amber-800',
  built:     'bg-purple-50 text-purple-700',
  reviewed:  'bg-green-50 text-green-700',
};

export function SectionRow({ section, definition, ctx, promptCtx, isFirst, isLast, index }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [notes, setNotes]     = useState(section.notes ?? '');
  const [status, setStatus]   = useState<SectionStatus>(section.status);
  const [error, setError]     = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateSection(section.id, ctx, { notes, status });
      if (result.ok) {
        setEditing(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleDelete() {
    if (!confirm('למחוק את הסקשן? לא ניתן לשחזר.')) return;
    startTransition(async () => {
      const result = await deleteSection(section.id, ctx);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  function handleMove(direction: 'up' | 'down') {
    startTransition(async () => {
      await moveSection(section.id, ctx, direction);
      router.refresh();
    });
  }

  const title = definition?.name_he ?? definition?.name_en ?? section.definition_slug;

  return (
    <li className="rounded-md border border-border bg-background">
      <div className="flex items-start gap-3 p-4">

        {/* Order indicator + reorder buttons */}
        <div className="flex flex-col items-center gap-1">
          <span className="font-mono text-xs font-bold text-muted-fg">{(index + 1).toString().padStart(2, '0')}</span>
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => handleMove('up')}
              disabled={isFirst || isPending}
              className="text-muted-fg hover:text-brand disabled:opacity-30"
              aria-label="הזז למעלה"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleMove('down')}
              disabled={isLast || isPending}
              className="text-muted-fg hover:text-brand disabled:opacity-30"
              aria-label="הזז למטה"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium">{title}</p>
              <p className="mt-0.5 text-xs text-muted-fg">
                <code className="rounded bg-muted px-1.5 py-0.5" dir="ltr">{section.definition_slug}</code>
                {definition?.category && (
                  <>
                    <span className="mx-2">·</span>
                    <span>{definition.category}</span>
                  </>
                )}
              </p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_PILLS[section.status]}`}>
              {STATUS_LABELS[section.status]}
            </span>
          </div>

          {!editing && section.notes && (
            <p className="mt-3 whitespace-pre-wrap rounded-md bg-muted/40 p-2 text-sm text-foreground">
              {section.notes}
            </p>
          )}

          {!editing && promptCtx && (() => {
            const meta = (section.content ?? {}) as SectionContentMeta;
            return (
              <div className="mt-3">
                <SectionPromptButtons
                  input={{
                    pageNameHe:     promptCtx.pageNameHe,
                    pageSlug:       promptCtx.pageSlug,
                    pageType:       promptCtx.pageType,
                    projectName:    promptCtx.projectName,
                    sectionNameHe:  title,
                    definitionSlug: section.definition_slug,
                    description:    section.notes ?? '',
                    fieldSchema:    meta.field_schema ?? [],
                    cptDriven:      meta.cpt_driven ?? false,
                    cptSlug:        meta.cpt_slug ?? null,
                    cptNameHe:      meta.cpt_name_he ?? null,
                  }}
                />
              </div>
            );
          })()}

          {editing && (
            <div className="mt-3 space-y-3 border-t border-border pt-3">
              <div className="space-y-1.5">
                <Label htmlFor={`status-${section.id}`}>סטטוס</Label>
                <select
                  id={`status-${section.id}`}
                  value={status}
                  onChange={e => setStatus(e.target.value as SectionStatus)}
                  className="block h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                >
                  {(Object.keys(STATUS_LABELS) as SectionStatus[]).map(s => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`notes-${section.id}`}>הערות</Label>
                <Textarea
                  id={`notes-${section.id}`}
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="הוראות לסקשן, שדות מותאמים, התנהגויות מיוחדות..."
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-col items-center gap-1">
          {!editing ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setEditing(true)}
                aria-label="ערוך"
                className="h-8 w-8"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                disabled={isPending}
                aria-label="מחק"
                className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="accent"
                size="icon"
                onClick={handleSave}
                disabled={isPending}
                aria-label="שמור"
                className="h-8 w-8"
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => { setEditing(false); setNotes(section.notes ?? ''); setStatus(section.status); setError(null); }}
                aria-label="ביטול"
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}
