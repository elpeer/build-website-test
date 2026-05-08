'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { analyzeDesign, materializeAnalysis, updateAnalysis,
         type DesignAnalysis, type AnalysisSection, type FieldDef, type SuggestedPage, type FieldType } from '@/app/actions/ai';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Sparkles, Wand2, AlertCircle, CheckCircle2, ChevronRight,
  Plus, Trash2, Save, RefreshCw, Database, FileText, Link as LinkIcon,
} from 'lucide-react';
import type { Json } from '@/lib/supabase/database.types';

interface Props {
  designId: string;
  projectId: string;
  projectSlug: string;
  pageId: string;
  pageSlug: string;
  isImage: boolean;
  initialAnalysis: Json | null;
  analyzedAt: string | null;
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text',       label: 'טקסט קצר' },
  { value: 'textarea',   label: 'טקסט ארוך' },
  { value: 'wysiwyg',    label: 'WYSIWYG' },
  { value: 'number',     label: 'מספר' },
  { value: 'email',      label: 'מייל' },
  { value: 'url',        label: 'URL' },
  { value: 'tel',        label: 'טלפון' },
  { value: 'select',     label: 'בחירה (select)' },
  { value: 'true_false', label: 'כן/לא' },
  { value: 'image',      label: 'תמונה' },
  { value: 'gallery',    label: 'גלריה' },
  { value: 'file',       label: 'קובץ' },
  { value: 'link',       label: 'לינק' },
  { value: 'color',      label: 'צבע' },
  { value: 'date',       label: 'תאריך' },
  { value: 'icon',       label: 'אייקון' },
  { value: 'repeater',   label: 'Repeater' },
  { value: 'group',      label: 'קבוצה' },
];

function emptyField(): FieldDef {
  return { key: '', label_he: '', type: 'text', required: false };
}

export function DesignAnalysisPanel({
  designId, projectId, projectSlug, pageId, pageSlug, isImage, initialAnalysis, analyzedAt,
}: Props) {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<DesignAnalysis | null>(
    initialAnalysis ? (initialAnalysis as unknown as DesignAnalysis) : null
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [isAnalyzing, startAnalyze] = useTransition();
  const [isSaving, startSave] = useTransition();
  const [isMaterializing, startMaterialize] = useTransition();

  function update<K extends keyof DesignAnalysis>(key: K, value: DesignAnalysis[K]) {
    if (!analysis) return;
    setAnalysis({ ...analysis, [key]: value });
    setDirty(true);
    setSuccess(null);
  }

  function updateSection(idx: number, patch: Partial<AnalysisSection>) {
    if (!analysis) return;
    const next = [...analysis.sections];
    next[idx] = { ...next[idx], ...patch };
    update('sections', next);
  }

  function addSection() {
    if (!analysis) return;
    update('sections', [
      ...analysis.sections,
      {
        definition_slug: '',
        name_he:         'סקשן חדש',
        description_he:  '',
        order_hint:      analysis.sections.length + 1,
        cpt_driven:      false,
        suggested_cpt:   null,
        field_schema:    [],
      },
    ]);
  }

  function removeSection(idx: number) {
    if (!analysis) return;
    update('sections', analysis.sections.filter((_, i) => i !== idx));
  }

  function moveSection(idx: number, dir: -1 | 1) {
    if (!analysis) return;
    const target = idx + dir;
    if (target < 0 || target >= analysis.sections.length) return;
    const next = [...analysis.sections];
    [next[idx], next[target]] = [next[target], next[idx]];
    next.forEach((s, i) => { s.order_hint = i + 1; });
    update('sections', next);
  }

  function addField(sectionIdx: number) {
    if (!analysis) return;
    const section = analysis.sections[sectionIdx];
    updateSection(sectionIdx, { field_schema: [...(section.field_schema ?? []), emptyField()] });
  }

  function updateField(sectionIdx: number, fieldIdx: number, patch: Partial<FieldDef>) {
    if (!analysis) return;
    const section = analysis.sections[sectionIdx];
    const fields = [...(section.field_schema ?? [])];
    fields[fieldIdx] = { ...fields[fieldIdx], ...patch };
    if (patch.type && patch.type !== 'repeater' && patch.type !== 'group') {
      delete fields[fieldIdx].sub_fields;
    } else if (patch.type === 'repeater' || patch.type === 'group') {
      fields[fieldIdx].sub_fields = fields[fieldIdx].sub_fields ?? [];
    }
    updateSection(sectionIdx, { field_schema: fields });
  }

  function removeField(sectionIdx: number, fieldIdx: number) {
    if (!analysis) return;
    const section = analysis.sections[sectionIdx];
    updateSection(sectionIdx, {
      field_schema: (section.field_schema ?? []).filter((_, i) => i !== fieldIdx),
    });
  }

  function addSubField(sectionIdx: number, fieldIdx: number) {
    if (!analysis) return;
    const section = analysis.sections[sectionIdx];
    const fields = [...(section.field_schema ?? [])];
    fields[fieldIdx] = {
      ...fields[fieldIdx],
      sub_fields: [...(fields[fieldIdx].sub_fields ?? []), emptyField()],
    };
    updateSection(sectionIdx, { field_schema: fields });
  }

  function updateSubField(sectionIdx: number, fieldIdx: number, subIdx: number, patch: Partial<FieldDef>) {
    if (!analysis) return;
    const section = analysis.sections[sectionIdx];
    const fields = [...(section.field_schema ?? [])];
    const subs = [...(fields[fieldIdx].sub_fields ?? [])];
    subs[subIdx] = { ...subs[subIdx], ...patch };
    fields[fieldIdx] = { ...fields[fieldIdx], sub_fields: subs };
    updateSection(sectionIdx, { field_schema: fields });
  }

  function removeSubField(sectionIdx: number, fieldIdx: number, subIdx: number) {
    if (!analysis) return;
    const section = analysis.sections[sectionIdx];
    const fields = [...(section.field_schema ?? [])];
    fields[fieldIdx] = {
      ...fields[fieldIdx],
      sub_fields: (fields[fieldIdx].sub_fields ?? []).filter((_, i) => i !== subIdx),
    };
    updateSection(sectionIdx, { field_schema: fields });
  }

  function addAdditionalPage() {
    if (!analysis) return;
    update('additional_pages', [
      ...(analysis.additional_pages ?? []),
      { slug: '', name_he: '', type: 'page', parent_slug: null, reason_he: '' },
    ]);
  }
  function updateAdditionalPage(idx: number, patch: Partial<SuggestedPage>) {
    if (!analysis) return;
    const next = [...(analysis.additional_pages ?? [])];
    next[idx] = { ...next[idx], ...patch };
    update('additional_pages', next);
  }
  function removeAdditionalPage(idx: number) {
    if (!analysis) return;
    update('additional_pages', (analysis.additional_pages ?? []).filter((_, i) => i !== idx));
  }

  function handleAnalyze() {
    setError(null); setSuccess(null);
    startAnalyze(async () => {
      const result = await analyzeDesign(designId, { projectSlug, pageSlug });
      if (result.ok) {
        setAnalysis(result.data.analysis);
        setDirty(false);
        setSuccess('הניתוח עודכן.');
      } else {
        setError(result.error);
      }
    });
  }

  function handleSave() {
    if (!analysis) return;
    setError(null); setSuccess(null);
    startSave(async () => {
      const result = await updateAnalysis(designId, { projectSlug, pageSlug }, analysis);
      if (result.ok) { setDirty(false); setSuccess('השינויים נשמרו.'); }
      else setError(result.error);
    });
  }

  function handleMaterialize() {
    setError(null); setSuccess(null);
    startMaterialize(async () => {
      // Auto-save first if dirty
      if (analysis && dirty) {
        const save = await updateAnalysis(designId, { projectSlug, pageSlug }, analysis);
        if (!save.ok) { setError(save.error); return; }
        setDirty(false);
      }
      const result = await materializeAnalysis(designId, { projectId, projectSlug });
      if (result.ok) {
        setSuccess(
          `נוצרו: עמוד ${result.data.pageSlug}, ${result.data.sectionsAdded} סקשנים, ${result.data.cptsCreated} CPTs, ${result.data.pagesCreated} עמודים`
        );
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (!isImage) {
    return (
      <div className="rounded-md border border-border bg-muted/30 p-4 text-sm text-muted-fg">
        ניתוח אוטומטי תומך כרגע רק בתמונות.
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="space-y-3 rounded-md border border-border bg-background p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-brand" />
          ניתוח עם Claude
        </div>
        <p className="text-sm text-muted-fg">
          לחצו לניתוח אוטומטי של העיצוב. Claude יזהה את הסקשנים, יציע סכמת שדות, יציע CPTs, ויאתר עמודים נוספים שצריך באתר.
        </p>
        <Button type="button" variant="accent" onClick={handleAnalyze} disabled={isAnalyzing} className="w-full">
          <Sparkles className="ms-1 h-4 w-4" />
          {isAnalyzing ? 'Claude מנתח...' : 'נתחו את העיצוב'}
        </Button>
        {error && <ErrorBox text={error} />}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="rounded-md border border-brand/30 bg-brand/5 p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand" />
            <span className="text-sm font-semibold">ניתוח Claude</span>
            {analyzedAt && (
              <span className="text-xs text-muted-fg">
                {new Date(analyzedAt).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            )}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={handleAnalyze} disabled={isAnalyzing}>
            <RefreshCw className={`ms-1 h-3.5 w-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? '...' : 'נתח שוב'}
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label htmlFor="ana_name_he" className="text-xs">שם העמוד</Label>
            <Input id="ana_name_he" value={analysis.page_name_he}
                   onChange={e => update('page_name_he', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ana_slug" className="text-xs">Slug</Label>
            <Input id="ana_slug" value={analysis.page_slug} dir="ltr"
                   className="font-mono"
                   onChange={e => update('page_slug', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ana_type" className="text-xs">סוג עמוד</Label>
            <select id="ana_type"
                    value={analysis.page_type}
                    onChange={e => update('page_type', e.target.value as DesignAnalysis['page_type'])}
                    className="block h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
              <option value="page">עמוד רגיל</option>
              <option value="archive">ארכיון CPT</option>
              <option value="single">עמוד פנימי CPT</option>
              <option value="system">עמוד מערכת</option>
              <option value="service">עמוד שירות</option>
            </select>
          </div>
          <div>
            <Label htmlFor="ana_name_en" className="text-xs">Name (English)</Label>
            <Input id="ana_name_en" value={analysis.page_name_en ?? ''} dir="ltr"
                   onChange={e => update('page_name_en', e.target.value || null)} />
          </div>
        </div>

        <div className="mt-3">
          <Label htmlFor="ana_summary" className="text-xs">סיכום העמוד</Label>
          <Textarea id="ana_summary" rows={3} value={analysis.summary_he}
                    onChange={e => update('summary_he', e.target.value)} />
        </div>
      </div>

      {/* Sections */}
      <div className="rounded-md border border-border bg-background p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">סקשנים ({analysis.sections.length})</h3>
          <Button type="button" variant="ghost" size="sm" onClick={addSection}>
            <Plus className="ms-1 h-3.5 w-3.5" />
            הוסף סקשן
          </Button>
        </div>
        <ul className="space-y-3">
          {analysis.sections.map((s, i) => (
            <li key={i} className="rounded-md border border-border bg-muted/30 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-muted-fg">
                  {(i + 1).toString().padStart(2, '0')}
                </span>
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => moveSection(i, -1)} disabled={i === 0}>↑</Button>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => moveSection(i, 1)} disabled={i === analysis.sections.length - 1}>↓</Button>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-600"
                          onClick={() => removeSection(i)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <Label className="text-xs">שם הסקשן</Label>
                  <Input value={s.name_he} onChange={e => updateSection(i, { name_he: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">definition_slug</Label>
                  <Input value={s.definition_slug} dir="ltr" className="font-mono"
                         onChange={e => updateSection(i, { definition_slug: e.target.value })} />
                </div>
              </div>

              <div className="mt-2">
                <Label className="text-xs">תיאור הסקשן</Label>
                <Textarea rows={3} value={s.description_he}
                          onChange={e => updateSection(i, { description_he: e.target.value })} />
              </div>

              <div className="mt-2 flex items-center gap-2">
                <input type="checkbox" id={`cpt_driven_${i}`} checked={s.cpt_driven}
                       onChange={e => updateSection(i, {
                         cpt_driven: e.target.checked,
                         suggested_cpt: e.target.checked ? (s.suggested_cpt ?? { slug: '', name_he: '' }) : null,
                       })}
                       className="h-4 w-4" />
                <Label htmlFor={`cpt_driven_${i}`} className="text-xs">הסקשן נטען מ-CPT</Label>
              </div>

              {s.cpt_driven && s.suggested_cpt && (
                <div className="mt-2 grid gap-2 md:grid-cols-2 rounded-md bg-background p-2">
                  <div>
                    <Label className="text-xs flex items-center gap-1">
                      <Database className="h-3 w-3" /> CPT slug
                    </Label>
                    <Input dir="ltr" className="font-mono"
                           value={s.suggested_cpt.slug}
                           onChange={e => updateSection(i, {
                             suggested_cpt: { ...s.suggested_cpt!, slug: e.target.value },
                           })} />
                  </div>
                  <div>
                    <Label className="text-xs">CPT name (he)</Label>
                    <Input value={s.suggested_cpt.name_he}
                           onChange={e => updateSection(i, {
                             suggested_cpt: { ...s.suggested_cpt!, name_he: e.target.value },
                           })} />
                  </div>
                </div>
              )}

              {/* Field schema editor */}
              <div className="mt-3 rounded-md border border-dashed border-border bg-background p-2">
                <div className="mb-2 flex items-center justify-between">
                  <Label className="text-xs font-semibold">שדות ACF ({s.field_schema?.length ?? 0})</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => addField(i)}>
                    <Plus className="ms-1 h-3 w-3" />
                    שדה
                  </Button>
                </div>
                <ul className="space-y-2">
                  {(s.field_schema ?? []).map((f, fi) => (
                    <li key={fi} className="rounded border border-border bg-muted/40 p-2 text-xs">
                      <div className="grid gap-1 md:grid-cols-[1fr_1fr_1fr_auto_auto]">
                        <Input dir="ltr" className="h-8 font-mono" placeholder="key"
                               value={f.key} onChange={e => updateField(i, fi, { key: e.target.value })} />
                        <Input className="h-8" placeholder="תווית"
                               value={f.label_he} onChange={e => updateField(i, fi, { label_he: e.target.value })} />
                        <select value={f.type}
                                onChange={e => updateField(i, fi, { type: e.target.value as FieldType })}
                                className="h-8 rounded-md border border-border bg-background px-2">
                          {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <label className="flex items-center gap-1">
                          <input type="checkbox" checked={f.required}
                                 onChange={e => updateField(i, fi, { required: e.target.checked })} />
                          חובה
                        </label>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-600"
                                onClick={() => removeField(i, fi)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      {(f.type === 'repeater' || f.type === 'group') && (
                        <div className="mt-2 ms-4 border-s-2 border-border ps-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-muted-fg">תת-שדות</span>
                            <Button type="button" variant="ghost" size="sm" className="h-6 text-xs"
                                    onClick={() => addSubField(i, fi)}>
                              <Plus className="ms-1 h-3 w-3" />
                              תת-שדה
                            </Button>
                          </div>
                          <ul className="mt-1 space-y-1">
                            {(f.sub_fields ?? []).map((sf, si) => (
                              <li key={si} className="grid gap-1 md:grid-cols-[1fr_1fr_1fr_auto]">
                                <Input dir="ltr" className="h-7 font-mono text-xs" placeholder="key"
                                       value={sf.key} onChange={e => updateSubField(i, fi, si, { key: e.target.value })} />
                                <Input className="h-7 text-xs" placeholder="תווית"
                                       value={sf.label_he} onChange={e => updateSubField(i, fi, si, { label_he: e.target.value })} />
                                <select value={sf.type}
                                        onChange={e => updateSubField(i, fi, si, { type: e.target.value as FieldType })}
                                        className="h-7 rounded-md border border-border bg-background px-2 text-xs">
                                  {FIELD_TYPES.filter(t => t.value !== 'repeater' && t.value !== 'group')
                                    .map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-red-600"
                                        onClick={() => removeSubField(i, fi, si)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Additional pages */}
      <div className="rounded-md border border-border bg-background p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-1">
            <LinkIcon className="h-3.5 w-3.5" />
            עמודים נוספים שזוהו ({analysis.additional_pages?.length ?? 0})
          </h3>
          <Button type="button" variant="ghost" size="sm" onClick={addAdditionalPage}>
            <Plus className="ms-1 h-3.5 w-3.5" />
            עמוד
          </Button>
        </div>
        <ul className="space-y-2">
          {(analysis.additional_pages ?? []).map((p, i) => (
            <li key={i} className="rounded-md border border-border bg-muted/30 p-2">
              <div className="grid gap-2 md:grid-cols-[1fr_1fr_140px_140px_auto]">
                <Input className="h-8" placeholder="שם בעברית"
                       value={p.name_he} onChange={e => updateAdditionalPage(i, { name_he: e.target.value })} />
                <Input className="h-8 font-mono" dir="ltr" placeholder="slug"
                       value={p.slug} onChange={e => updateAdditionalPage(i, { slug: e.target.value })} />
                <select value={p.type}
                        onChange={e => updateAdditionalPage(i, { type: e.target.value as DesignAnalysis['page_type'] })}
                        className="h-8 rounded-md border border-border bg-background px-2 text-sm">
                  <option value="page">עמוד</option>
                  <option value="archive">ארכיון</option>
                  <option value="single">פנימי CPT</option>
                  <option value="system">מערכת</option>
                  <option value="service">שירות</option>
                </select>
                <Input className="h-8 font-mono" dir="ltr" placeholder="parent_slug"
                       value={p.parent_slug ?? ''}
                       onChange={e => updateAdditionalPage(i, { parent_slug: e.target.value || null })} />
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-600"
                        onClick={() => removeAdditionalPage(i)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Input className="mt-1 h-7 text-xs" placeholder="למה צריך / איפה זוהה"
                     value={p.reason_he} onChange={e => updateAdditionalPage(i, { reason_he: e.target.value })} />
            </li>
          ))}
        </ul>
      </div>

      {/* Design system (extracted) */}
      {analysis.design_system && (
        <div className="rounded-md border border-brand/30 bg-brand/5 p-4">
          <p className="mb-2 text-sm font-semibold">🎨 Design System שזוהה אוטומטית</p>
          <p className="mb-3 text-xs text-muted-fg">
            {analysis.design_system.notes_he}
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label className="text-xs mb-1.5 block">צבעים</Label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['primary','secondary','accent','neutral'] as const).map(k => (
                  <div key={k}>
                    <div className="h-10 w-full rounded border border-border"
                         style={{ backgroundColor: analysis.design_system!.colors[k] }} />
                    <p className="mt-1 text-[10px] text-muted-fg">{k}</p>
                    <code className="block text-[10px]" dir="ltr">{analysis.design_system!.colors[k]}</code>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">פונטים</Label>
              <div className="space-y-2">
                <div className="rounded border border-border bg-background p-2">
                  <p className="text-[10px] text-muted-fg">כותרות</p>
                  <p className="text-sm font-bold" style={{ fontFamily: analysis.design_system.fonts.headings }}>
                    {analysis.design_system.fonts.headings}
                  </p>
                </div>
                <div className="rounded border border-border bg-background p-2">
                  <p className="text-[10px] text-muted-fg">גוף</p>
                  <p className="text-sm" style={{ fontFamily: analysis.design_system.fonts.body }}>
                    {analysis.design_system.fonts.body}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-fg">
            יוחל אוטומטית על הפרויקט בלחיצה על &quot;צור עמודים, סקשנים ו-CPTs&quot; (אם עדיין לא הוגדרו tokens אחרים).
          </p>
        </div>
      )}

      {/* Design notes */}
      {analysis.design_notes_he && (
        <div className="rounded-md border border-border bg-background p-4">
          <Label className="text-xs flex items-center gap-1 mb-1">
            <FileText className="h-3 w-3" />
            הערות עיצוב
          </Label>
          <Textarea rows={2} value={analysis.design_notes_he ?? ''}
                    onChange={e => update('design_notes_he', e.target.value || null)} />
        </div>
      )}

      {error && <ErrorBox text={error} />}
      {success && <SuccessBox text={success} />}

      {/* Actions */}
      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-end gap-2 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
        {dirty && (
          <Button type="button" variant="ghost" size="sm" onClick={handleSave} disabled={isSaving || isMaterializing}>
            <Save className="ms-1 h-3.5 w-3.5" />
            {isSaving ? 'שומר...' : 'שמור שינויים'}
          </Button>
        )}
        <Button type="button" variant="accent" size="sm" onClick={handleMaterialize}
                disabled={isAnalyzing || isMaterializing}>
          <Wand2 className="ms-1 h-3.5 w-3.5" />
          {isMaterializing ? 'יוצר...' : 'צור עמודים, סקשנים ו-CPTs'}
        </Button>
        <Link href={`/projects/${projectSlug}/${pageSlug}`}
              className="inline-flex items-center gap-1 text-xs text-brand hover:underline">
          לעמוד
          <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        </Link>
      </div>
    </div>
  );
}

function ErrorBox({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{text}</span>
    </div>
  );
}
function SuccessBox({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{text}</span>
    </div>
  );
}
