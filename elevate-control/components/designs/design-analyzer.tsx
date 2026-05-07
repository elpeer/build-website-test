'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { analyzeDesign, materializeAnalysis } from '@/app/actions/ai';
import { Button } from '@/components/ui/button';
import { Sparkles, Wand2, AlertCircle, CheckCircle2, FileText, ChevronRight } from 'lucide-react';

interface AnalysisSection {
  definition_slug: string;
  name_he: string;
  description_he: string;
  order_hint: number;
}

interface DesignAnalysis {
  page_name_he: string;
  page_name_en: string | null;
  page_slug: string;
  page_type: string;
  summary_he: string;
  sections: AnalysisSection[];
  design_notes_he: string | null;
}

interface Props {
  designId: string;
  projectSlug: string;
  initialAnalysis: DesignAnalysis | null;
  hasPage: boolean;
}

export function DesignAnalyzer({ designId, projectSlug, initialAnalysis, hasPage }: Props) {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<DesignAnalysis | null>(initialAnalysis);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [isAnalyzing, startAnalyze] = useTransition();
  const [isMaterializing, startMaterialize] = useTransition();

  function handleAnalyze() {
    setError(null);
    setSuccess(null);
    startAnalyze(async () => {
      const result = await analyzeDesign(designId, { projectSlug });
      if (result.ok) {
        setAnalysis(result.data.analysis);
      } else {
        setError(result.error);
      }
    });
  }

  function handleMaterialize() {
    setError(null);
    setSuccess(null);
    startMaterialize(async () => {
      const result = await materializeAnalysis(designId, { projectSlug });
      if (result.ok) {
        setSuccess(`נוצרו עמוד "${result.data.pageSlug}" + ${result.data.sectionsAdded} סקשנים`);
        setCreatedSlug(result.data.pageSlug);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (!analysis) {
    return (
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full"
        >
          <Sparkles className="ms-1 h-4 w-4" />
          {isAnalyzing ? 'Claude מנתח...' : 'נתחו עם Claude'}
        </Button>
        {error && (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-md border border-brand/30 bg-brand/5 p-3">
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{analysis.page_name_he}</p>
          <p className="text-xs text-muted-fg">
            <code className="rounded bg-background px-1.5 py-0.5" dir="ltr">/{analysis.page_slug}</code>
            <span className="mx-2">·</span>
            {analysis.sections.length} סקשנים
          </p>
        </div>
      </div>

      <p className="text-xs text-foreground">{analysis.summary_he}</p>

      <details className="text-xs">
        <summary className="cursor-pointer font-medium text-brand hover:underline">
          הצג את כל הסקשנים ({analysis.sections.length})
        </summary>
        <ul className="mt-2 space-y-2">
          {analysis.sections.map((s, i) => (
            <li key={i} className="rounded-md border border-border bg-background p-2">
              <div className="flex items-start gap-2">
                <span className="font-mono text-xs text-muted-fg">
                  {(i + 1).toString().padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{s.name_he}</p>
                  <code className="text-xs text-muted-fg" dir="ltr">{s.definition_slug}</code>
                  <p className="mt-1 text-xs">{s.description_he}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </details>

      {analysis.design_notes_he && (
        <div className="rounded-md bg-background p-2 text-xs">
          <p className="font-medium text-muted-fg">הערות עיצוב:</p>
          <p className="mt-1">{analysis.design_notes_he}</p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-2 text-xs text-green-700">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAnalyze}
          disabled={isAnalyzing || isMaterializing}
        >
          <Sparkles className="ms-1 h-3.5 w-3.5" />
          {isAnalyzing ? 'מנתח...' : 'נתח שוב'}
        </Button>
        {!hasPage && !createdSlug && (
          <Button
            type="button"
            variant="accent"
            size="sm"
            onClick={handleMaterialize}
            disabled={isAnalyzing || isMaterializing}
          >
            <Wand2 className="ms-1 h-3.5 w-3.5" />
            {isMaterializing ? 'יוצר...' : 'צור עמוד וסקשנים'}
          </Button>
        )}
        {createdSlug && (
          <Link
            href={`/projects/${projectSlug}/${createdSlug}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
          >
            <FileText className="h-3.5 w-3.5" />
            פתח את העמוד שנוצר
            <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
        )}
      </div>
    </div>
  );
}
