'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateProjectBrand } from '@/app/actions/project-settings';
import type { BrandTokens } from '@/lib/brand-tokens';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, AlertCircle, CheckCircle2, Globe } from 'lucide-react';

interface Props {
  projectId: string;
  projectSlug: string;
  initialBrand: BrandTokens;
  initialVercelUrl: string | null;
}

export function ProjectBrandForm({ projectId, projectSlug, initialBrand, initialVercelUrl }: Props) {
  const router = useRouter();
  const [tokens, setTokens] = useState<BrandTokens>(initialBrand);
  const [vercelUrl, setVercelUrl] = useState(initialVercelUrl ?? '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function setColor(key: keyof BrandTokens['colors'], value: string) {
    setTokens(t => ({ ...t, colors: { ...t.colors, [key]: value } }));
    setSuccess(false);
  }
  function setFont(key: keyof BrandTokens['fonts'], value: string) {
    setTokens(t => ({ ...t, fonts: { ...t.fonts, [key]: value } }));
    setSuccess(false);
  }

  function handleSave() {
    setError(null); setSuccess(false);
    startTransition(async () => {
      const result = await updateProjectBrand(projectId, projectSlug, {
        brand_tokens: tokens, vercel_url: vercelUrl || null,
      });
      if (result.ok) { setSuccess(true); router.refresh(); }
      else setError(result.error);
    });
  }

  return (
    <div className="space-y-5">
      <section>
        <h3 className="mb-3 text-sm font-semibold text-muted-fg">צבעים</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {(Object.keys(tokens.colors) as Array<keyof BrandTokens['colors']>).map(k => (
            <div key={k} className="space-y-1.5">
              <Label htmlFor={`color_${k}`} className="text-xs">{
                k === 'primary' ? 'ראשי' : k === 'secondary' ? 'משני'
                : k === 'accent' ? 'הדגשה' : 'נייטרלי'
              }</Label>
              <div className="flex items-center gap-2">
                <input id={`color_${k}`} type="color" value={tokens.colors[k]}
                       onChange={e => setColor(k, e.target.value)}
                       className="h-10 w-14 rounded border border-border" />
                <Input value={tokens.colors[k]} dir="ltr" className="font-mono"
                       onChange={e => setColor(k, e.target.value)} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-muted-fg">פונטים</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label htmlFor="font_headings" className="text-xs">כותרות</Label>
            <Input id="font_headings" value={tokens.fonts.headings} dir="ltr"
                   onChange={e => setFont('headings', e.target.value)}
                   placeholder="'Heebo', sans-serif" />
          </div>
          <div>
            <Label htmlFor="font_body" className="text-xs">גוף</Label>
            <Input id="font_body" value={tokens.fonts.body} dir="ltr"
                   onChange={e => setFont('body', e.target.value)}
                   placeholder="'Assistant', sans-serif" />
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-fg">
          <Globe className="h-4 w-4" />
          Vercel URL
        </h3>
        <Input value={vercelUrl} dir="ltr" placeholder="https://ninja-tours.vercel.app"
               onChange={e => { setVercelUrl(e.target.value); setSuccess(false); }} />
        <p className="mt-1 text-xs text-muted-fg">
          ה-base URL של הפרויקט ב-Vercel. ישמש ליצירת לינקי תצוגה לכל עמוד אוטומטית.
        </p>
      </section>

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
