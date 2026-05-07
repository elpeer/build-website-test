'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Code2, Settings2, Copy, CheckCircle2, FileText } from 'lucide-react';
import { buildFrontendPrompt, buildAdminPrompt, type SectionPromptInput } from '@/lib/section-prompts';

interface Props {
  input: SectionPromptInput;
}

type Mode = 'frontend' | 'admin' | 'description' | null;

export function SectionPromptButtons({ input }: Props) {
  const [mode, setMode] = useState<Mode>(null);
  const [copied, setCopied] = useState<Mode>(null);

  function preview(m: Exclude<Mode, null>) {
    setMode(m === mode ? null : m);
  }

  async function copy(m: Exclude<Mode, null>, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(m);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard API unavailable — fall through silently
    }
  }

  const frontendText = buildFrontendPrompt(input);
  const adminText    = buildAdminPrompt(input);
  const descText     = input.description;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm"
                onClick={() => copy('description', descText)}>
          {copied === 'description' ? <CheckCircle2 className="ms-1 h-3.5 w-3.5 text-green-600" /> : <FileText className="ms-1 h-3.5 w-3.5" />}
          העתק תיאור
        </Button>
        <Button type="button" variant="outline" size="sm"
                onClick={() => preview('frontend')}>
          <Code2 className="ms-1 h-3.5 w-3.5" />
          {mode === 'frontend' ? 'סגור פרומפט פרונט' : 'פרומפט פרונט-אנד'}
        </Button>
        <Button type="button" variant="outline" size="sm"
                onClick={() => preview('admin')}>
          <Settings2 className="ms-1 h-3.5 w-3.5" />
          {mode === 'admin' ? 'סגור פרומפט ניהול' : 'פרומפט ניהול (ACF)'}
        </Button>
      </div>

      {mode && (
        <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-fg">
              {mode === 'frontend' ? 'פרומפט בנייה — פרונט-אנד' : 'פרומפט בנייה — ACF / ניהול'}
            </span>
            <Button type="button" variant="ghost" size="sm"
                    onClick={() => copy(mode, mode === 'frontend' ? frontendText : adminText)}>
              {copied === mode ? <CheckCircle2 className="ms-1 h-3.5 w-3.5 text-green-600" /> : <Copy className="ms-1 h-3.5 w-3.5" />}
              {copied === mode ? 'הועתק' : 'העתק'}
            </Button>
          </div>
          <pre className="max-h-72 overflow-auto rounded bg-background p-2 text-xs whitespace-pre-wrap" dir="rtl">
{mode === 'frontend' ? frontendText : adminText}
          </pre>
        </div>
      )}
    </div>
  );
}
