'use client';

import { useState, useTransition } from 'react';
import { askAboutProject } from '@/app/actions/ask';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Sparkles, AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  projectSlug: string;
  suggestions: string[];
}

interface Turn {
  question: string;
  answer: string | null;
  error: string | null;
  loading: boolean;
}

export function AskClient({ projectSlug, suggestions }: Props) {
  const [question, setQuestion] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [, startTransition] = useTransition();

  function ask(text: string) {
    const q = text.trim();
    if (!q) return;
    const idx = turns.length;
    setTurns(prev => [...prev, { question: q, answer: null, error: null, loading: true }]);
    setQuestion('');
    startTransition(async () => {
      const result = await askAboutProject({ projectSlug, question: q });
      setTurns(prev => prev.map((t, i) =>
        i === idx
          ? { ...t,
              loading: false,
              answer: result.ok ? result.answer : null,
              error:  result.ok ? null : result.error }
          : t
      ));
    });
  }

  return (
    <div className="space-y-4">
      {turns.length === 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-muted-fg">שאלות מוצעות:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map(s => (
              <button key={s} type="button" onClick={() => ask(s)}
                      className="rounded-full border border-border bg-muted/30 px-3 py-1.5 text-xs hover:border-brand hover:bg-brand/5">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {turns.length > 0 && (
        <ul className="space-y-4">
          {turns.map((t, i) => (
            <li key={i} className="space-y-2">
              <div className="rounded-lg border border-brand/30 bg-brand/5 p-3">
                <p className="text-xs font-semibold text-muted-fg">שאלה</p>
                <p className="mt-1 text-sm">{t.question}</p>
              </div>
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="flex items-center gap-1 text-xs font-semibold text-muted-fg">
                  <Sparkles className="h-3 w-3 text-brand" />
                  תשובה של Claude
                </p>
                {t.loading && (
                  <p className="mt-2 text-sm text-muted-fg">חושב...</p>
                )}
                {t.error && (
                  <div className="mt-2 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{t.error}</span>
                  </div>
                )}
                {t.answer && (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{t.answer}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={e => { e.preventDefault(); ask(question); }}
            className="space-y-2 border-t border-border pt-4">
        <Textarea value={question} onChange={e => setQuestion(e.target.value)}
                  rows={3}
                  placeholder="שאל שאלה על הפרויקט..."
                  onKeyDown={e => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      ask(question);
                    }
                  }} />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-fg">Cmd/Ctrl + Enter כדי לשלוח</p>
          <div className="flex gap-2">
            {turns.length > 0 && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setTurns([])}>
                <RotateCcw className="ms-1 h-3.5 w-3.5" />
                התחל מחדש
              </Button>
            )}
            <Button type="submit" variant="accent" size="sm" disabled={!question.trim()}>
              <Send className="ms-1 h-3.5 w-3.5" />
              שלח
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
