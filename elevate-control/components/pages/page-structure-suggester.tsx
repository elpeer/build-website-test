'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  suggestPageStructure, materializePageStructure, updatePageProposal,
  type PageStructureProposal, type AnalysisSection, type FieldDef, type FieldType, type SuggestedTaxonomy,
} from '@/app/actions/ai';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Sparkles, Wand2, AlertCircle, CheckCircle2, Plus, Trash2, Save, RefreshCw, Tag, Database, Info,
} from 'lucide-react';

interface CreationContext {
  source?: string;
  source_design_id?: string;
  source_page_slug?: string;
  source_page_name_he?: string;
  source_page_type?: string;
  trigger_section?: {
    definition_slug: string;
    name_he: string;
    description_he: string;
    cpt_slug: string | null;
    cpt_name_he: string | null;
  } | null;
  sibling_sections?: Array<{ definition_slug: string; name_he: string; cpt_driven: boolean }>;
  original_reason_he?: string;
  proposed_structure?: PageStructureProposal;
  materialized_at?: string;
}

interface Props {
  pageId: string;
  projectSlug: string;
  pageSlug: string;
  hasSections: boolean;
  creationContext: CreationContext | null;
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'טקסט' }, { value: 'textarea', label: 'טקסט ארוך' },
  { value: 'wysiwyg', label: 'WYSIWYG' }, { value: 'number', label: 'מספר' },
  { value: 'image', label: 'תמונה' }, { value: 'gallery', label: 'גלריה' },
  { value: 'link', label: 'לינק' }, { value: 'select', label: 'בחירה' },
  { value: 'true_false', label: 'כן/לא' }, { value: 'repeater', label: 'Repeater' },
  { value: 'group', label: 'קבוצה' }, { value: 'color', label: 'צבע' },
  { value: 'date', label: 'תאריך' }, { value: 'icon', label: 'אייקון' },
];

function emptyField(): FieldDef {
  return { key: '', label_he: '', type: 'text', required: false };
}

export function PageStructureSuggester({ pageId, projectSlug, hasSections, creationContext }: Props) {
  const router = useRouter();
  const [proposal, setProposal] = useState<PageStructureProposal | null>(
    creationContext?.proposed_structure ?? null
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [showCtx, setShowCtx] = useState(false);
  const [isSuggesting, startSuggest] = useTransition();
  const [isSaving, startSave] = useTransition();
  const [isMaterializing, startMaterialize] = useTransition();

  // Don't render the panel at all if the page already has sections AND
  // there's no proposed_structure pending — that means it's already set up.
  if (hasSections && !proposal) return null;
  if (creationContext?.materialized_at && hasSections) return null;

  function update<K extends keyof PageStructureProposal>(key: K, value: PageStructureProposal[K]) {
    if (!proposal) return;
    setProposal({ ...proposal, [key]: value });
    setDirty(true); setSuccess(null);
  }
  function updateSection(idx: number, patch: Partial<AnalysisSection>) {
    if (!proposal) return;
    const next = [...proposal.sections];
    next[idx] = { ...next[idx], ...patch };
    update('sections', next);
  }
  function addSection() {
    if (!proposal) return;
    update('sections', [...proposal.sections, {
      definition_slug: '', name_he: 'סקשן חדש', description_he: '',
      order_hint: proposal.sections.length + 1, cpt_driven: false,
      suggested_cpt: null, field_schema: [],
    }]);
  }
  function removeSection(idx: number) {
    if (!proposal) return;
    update('sections', proposal.sections.filter((_, i) => i !== idx));
  }
  function moveSection(idx: number, dir: -1 | 1) {
    if (!proposal) return;
    const target = idx + dir;
    if (target < 0 || target >= proposal.sections.length) return;
    const next = [...proposal.sections];
    [next[idx], next[target]] = [next[target], next[idx]];
    next.forEach((s, i) => { s.order_hint = i + 1; });
    update('sections', next);
  }
  function addField(si: number) {
    if (!proposal) return;
    const fields = [...(proposal.sections[si].field_schema ?? []), emptyField()];
    updateSection(si, { field_schema: fields });
  }
  function updateField(si: number, fi: number, patch: Partial<FieldDef>) {
    if (!proposal) return;
    const fields = [...(proposal.sections[si].field_schema ?? [])];
    fields[fi] = { ...fields[fi], ...patch };
    updateSection(si, { field_schema: fields });
  }
  function removeField(si: number, fi: number) {
    if (!proposal) return;
    const fields = (proposal.sections[si].field_schema ?? []).filter((_, i) => i !== fi);
    updateSection(si, { field_schema: fields });
  }
  function updateTaxonomy(idx: number, patch: Partial<SuggestedTaxonomy>) {
    if (!proposal) return;
    const next = [...proposal.suggested_taxonomies];
    next[idx] = { ...next[idx], ...patch };
    update('suggested_taxonomies', next);
  }
  function addTaxonomy() {
    if (!proposal) return;
    update('suggested_taxonomies', [...(proposal.suggested_taxonomies ?? []), {
      slug: '', name_he: '', hierarchical: true, terms: [], reasoning_he: '',
    }]);
  }
  function removeTaxonomy(idx: number) {
    if (!proposal) return;
    update('suggested_taxonomies', proposal.suggested_taxonomies.filter((_, i) => i !== idx));
  }

  function handleSuggest() {
    setError(null); setSuccess(null);
    startSuggest(async () => {
      const result = await suggestPageStructure(pageId, { projectSlug });
      if (result.ok) {
        setProposal(result.data.proposal);
        setDirty(false);
        setSuccess('ההצעה התקבלה. ערכו ואשרו.');
      } else setError(result.error);
    });
  }
  function handleSave() {
    if (!proposal) return;
    setError(null); setSuccess(null);
    startSave(async () => {
      const result = await updatePageProposal(pageId, { projectSlug }, proposal);
      if (result.ok) { setDirty(false); setSuccess('נשמר.'); }
      else setError(result.error);
    });
  }
  function handleMaterialize() {
    setError(null); setSuccess(null);
    startMaterialize(async () => {
      if (proposal && dirty) {
        const save = await updatePageProposal(pageId, { projectSlug }, proposal);
        if (!save.ok) { setError(save.error); return; }
        setDirty(false);
      }
      const result = await materializePageStructure(pageId, { projectSlug });
      if (result.ok) {
        setSuccess(`נוצרו ${result.data.sectionsAdded} סקשנים, ${result.data.taxonomiesCreated} טקסונומיות`);
        router.refresh();
      } else setError(result.error);
    });
  }

  // No proposal yet — show the call-to-action
  if (!proposal) {
    return (
      <div className="space-y-3 rounded-md border border-brand/30 bg-brand/5 p-4">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          <div className="flex-1">
            <p className="text-sm font-semibold">העמוד הזה עדיין ריק.</p>
            {creationContext?.source_page_slug && (
              <p className="mt-1 text-xs text-muted-fg">
                נוצר אוטומטית מהקשר של עמוד <code className="rounded bg-background px-1.5 py-0.5">/{creationContext.source_page_slug}</code>
                {creationContext.trigger_section && (
                  <> · סקשן: {creationContext.trigger_section.name_he}</>
                )}
              </p>
            )}
            {creationContext?.original_reason_he && (
              <p className="mt-1 text-xs text-foreground">{creationContext.original_reason_he}</p>
            )}
          </div>
        </div>
        <Button type="button" variant="accent" onClick={handleSuggest} disabled={isSuggesting} className="w-full">
          <Sparkles className="ms-1 h-4 w-4" />
          {isSuggesting ? 'Claude חושב...' : 'הצע מבנה לעמוד הזה'}
        </Button>
        {creationContext && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-fg hover:text-brand">הצג קונטקסט מלא</summary>
            <pre className="mt-2 max-h-48 overflow-auto rounded bg-background p-2 text-[11px]" dir="ltr">
{JSON.stringify(creationContext, null, 2)}
            </pre>
          </details>
        )}
        {error && <ErrorBox text={error} />}
      </div>
    );
  }

  // Proposal exists — show editable form
  return (
    <div className="space-y-3 rounded-md border border-brand/30 bg-brand/5 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-1">
            <Sparkles className="h-4 w-4 text-brand" />
            הצעת מבנה לעמוד
          </h3>
          <p className="mt-1 text-xs text-muted-fg">{proposal.reasoning_he}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={handleSuggest} disabled={isSuggesting}>
          <RefreshCw className={`ms-1 h-3.5 w-3.5 ${isSuggesting ? 'animate-spin' : ''}`} />
          {isSuggesting ? '...' : 'הצע שוב'}
        </Button>
      </div>

      {creationContext && (
        <button type="button" onClick={() => setShowCtx(s => !s)}
                className="text-xs text-muted-fg hover:text-brand">
          {showCtx ? 'הסתר קונטקסט יצירה' : 'הצג קונטקסט יצירה'}
        </button>
      )}
      {showCtx && creationContext && (
        <pre className="max-h-48 overflow-auto rounded bg-background p-2 text-[11px]" dir="ltr">
{JSON.stringify(creationContext, null, 2)}
        </pre>
      )}

      <div>
        <Label className="text-xs">תקציר העמוד</Label>
        <Textarea rows={2} value={proposal.page_summary_he}
                  onChange={e => update('page_summary_he', e.target.value)} />
      </div>

      {/* Sections */}
      <div className="rounded-md border border-border bg-background p-3">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold">סקשנים ({proposal.sections.length})</h4>
          <Button type="button" variant="ghost" size="sm" onClick={addSection}>
            <Plus className="ms-1 h-3.5 w-3.5" /> סקשן
          </Button>
        </div>
        <ul className="space-y-3">
          {proposal.sections.map((s, i) => (
            <li key={i} className="rounded-md border border-border bg-muted/30 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold">{(i + 1).toString().padStart(2, '0')}</span>
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => moveSection(i, -1)} disabled={i === 0}>↑</Button>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => moveSection(i, 1)} disabled={i === proposal.sections.length - 1}>↓</Button>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-600"
                          onClick={() => removeSection(i)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <Label className="text-xs">שם</Label>
                  <Input value={s.name_he} onChange={e => updateSection(i, { name_he: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">definition_slug</Label>
                  <Input dir="ltr" className="font-mono" value={s.definition_slug}
                         onChange={e => updateSection(i, { definition_slug: e.target.value })} />
                </div>
              </div>
              <div className="mt-2">
                <Label className="text-xs">תיאור (כולל הסבר אם זה אוטומטי או ידני)</Label>
                <Textarea rows={3} value={s.description_he}
                          onChange={e => updateSection(i, { description_he: e.target.value })} />
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <input type="checkbox" id={`pcd_${i}`} checked={s.cpt_driven}
                       onChange={e => updateSection(i, {
                         cpt_driven: e.target.checked,
                         suggested_cpt: e.target.checked ? (s.suggested_cpt ?? { slug: '', name_he: '' }) : null,
                       })} className="h-4 w-4" />
                <Label htmlFor={`pcd_${i}`}>טוען אוטומטית מ-CPT (לא סקשן עריכה ידנית)</Label>
              </div>
              {s.cpt_driven && s.suggested_cpt && (
                <div className="mt-2 grid gap-2 md:grid-cols-2 rounded-md bg-background p-2">
                  <div>
                    <Label className="text-xs flex items-center gap-1"><Database className="h-3 w-3" /> CPT slug</Label>
                    <Input dir="ltr" className="font-mono" value={s.suggested_cpt.slug}
                           onChange={e => updateSection(i, { suggested_cpt: { ...s.suggested_cpt!, slug: e.target.value } })} />
                  </div>
                  <div>
                    <Label className="text-xs">שם CPT</Label>
                    <Input value={s.suggested_cpt.name_he}
                           onChange={e => updateSection(i, { suggested_cpt: { ...s.suggested_cpt!, name_he: e.target.value } })} />
                  </div>
                </div>
              )}

              {/* Field schema (compact) */}
              <div className="mt-3 rounded-md border border-dashed border-border bg-background p-2">
                <div className="mb-2 flex items-center justify-between">
                  <Label className="text-xs font-semibold">שדות ACF ({s.field_schema?.length ?? 0})</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => addField(i)}>
                    <Plus className="ms-1 h-3 w-3" /> שדה
                  </Button>
                </div>
                <ul className="space-y-1">
                  {(s.field_schema ?? []).map((f, fi) => (
                    <li key={fi} className="grid gap-1 md:grid-cols-[1fr_1fr_1fr_auto_auto] text-xs">
                      <Input dir="ltr" className="h-7 font-mono" placeholder="key"
                             value={f.key} onChange={e => updateField(i, fi, { key: e.target.value })} />
                      <Input className="h-7" placeholder="תווית"
                             value={f.label_he} onChange={e => updateField(i, fi, { label_he: e.target.value })} />
                      <select value={f.type}
                              onChange={e => updateField(i, fi, { type: e.target.value as FieldType })}
                              className="h-7 rounded-md border border-border bg-background px-2">
                        {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                      <label className="flex items-center gap-1">
                        <input type="checkbox" checked={f.required}
                               onChange={e => updateField(i, fi, { required: e.target.checked })} />
                        חובה
                      </label>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-red-600"
                              onClick={() => removeField(i, fi)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Taxonomies */}
      <div className="rounded-md border border-border bg-background p-3">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold flex items-center gap-1">
            <Tag className="h-3.5 w-3.5" /> טקסונומיות מומלצות ({proposal.suggested_taxonomies?.length ?? 0})
          </h4>
          <Button type="button" variant="ghost" size="sm" onClick={addTaxonomy}>
            <Plus className="ms-1 h-3 w-3" /> טקסונומיה
          </Button>
        </div>
        <ul className="space-y-2">
          {(proposal.suggested_taxonomies ?? []).map((t, i) => (
            <li key={i} className="rounded-md border border-border bg-muted/30 p-2">
              <div className="grid gap-2 md:grid-cols-[1fr_1fr_120px_auto]">
                <Input className="h-8" placeholder="שם" value={t.name_he}
                       onChange={e => updateTaxonomy(i, { name_he: e.target.value })} />
                <Input className="h-8 font-mono" dir="ltr" placeholder="slug" value={t.slug}
                       onChange={e => updateTaxonomy(i, { slug: e.target.value })} />
                <select value={t.hierarchical ? 'h' : 'f'}
                        onChange={e => updateTaxonomy(i, { hierarchical: e.target.value === 'h' })}
                        className="h-8 rounded-md border border-border bg-background px-2 text-sm">
                  <option value="h">היררכי</option>
                  <option value="f">שטוח</option>
                </select>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-600"
                        onClick={() => removeTaxonomy(i)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Input className="mt-1 h-7 text-xs" placeholder="ערכים מופרדים בפסיקים"
                     value={t.terms.join(', ')}
                     onChange={e => updateTaxonomy(i, { terms: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
              <Input className="mt-1 h-6 text-[11px] text-muted-fg" placeholder="למה מומלץ"
                     value={t.reasoning_he}
                     onChange={e => updateTaxonomy(i, { reasoning_he: e.target.value })} />
            </li>
          ))}
        </ul>
      </div>

      {error && <ErrorBox text={error} />}
      {success && <SuccessBox text={success} />}

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
        {dirty && (
          <Button type="button" variant="ghost" size="sm" onClick={handleSave} disabled={isSaving || isMaterializing}>
            <Save className="ms-1 h-3.5 w-3.5" />
            {isSaving ? 'שומר...' : 'שמור'}
          </Button>
        )}
        <Button type="button" variant="accent" size="sm" onClick={handleMaterialize}
                disabled={isSuggesting || isMaterializing}>
          <Wand2 className="ms-1 h-3.5 w-3.5" />
          {isMaterializing ? 'יוצר...' : 'אשר וצור סקשנים + טקסונומיות'}
        </Button>
      </div>
    </div>
  );
}

function ErrorBox({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{text}</span>
    </div>
  );
}
function SuccessBox({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><span>{text}</span>
    </div>
  );
}
