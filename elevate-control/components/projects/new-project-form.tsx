'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createProject } from '@/app/actions/projects';
import { slugify } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, AlertCircle } from 'lucide-react';

export function NewProjectForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from name (until the user manually edits the slug field)
  function onNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setName(value);
    if (!slugManuallyEdited) setSlug(slugify(value));
  }

  function onSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlugManuallyEdited(true);
    setSlug(slugify(e.target.value));
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      // Make sure the auto-slugified value is what gets submitted
      formData.set('slug', slug);
      const result = await createProject(formData);
      if (result.ok) {
        router.push(`/projects/${result.slug}`);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>פרטי הפרויקט</CardTitle>
        <CardDescription>
          ה-slug ייצור את ה-URL הציבורי וה-Git path. ניתן לערוך מאוחר יותר.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">

          <div className="space-y-2">
            <Label htmlFor="name">
              שם הפרויקט <span className="text-accent">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              required
              value={name}
              onChange={onNameChange}
              placeholder="לדוגמה: Sushi Bar Tel Aviv"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">
              Slug <span className="text-accent">*</span>
            </Label>
            <Input
              id="slug"
              name="slug"
              required
              dir="ltr"
              className="font-mono text-start"
              value={slug}
              onChange={onSlugChange}
              placeholder="sushi-bar"
            />
            <p className="text-xs text-muted-fg">
              נוצר אוטומטית מהשם. ניתן לערוך — אותיות אנגליות, מספרים ומקפים בלבד.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client_name">שם הלקוח</Label>
              <Input
                id="client_name"
                name="client_name"
                placeholder="חברה / יזם"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_at">תאריך יעד</Label>
              <Input
                id="target_at"
                name="target_at"
                type="date"
                dir="ltr"
                className="text-start"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">תיאור</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              placeholder="במה הפרויקט עוסק? מה היעד העסקי?"
            />
          </div>

          <div className="space-y-3 rounded-md border border-border bg-muted/40 p-4">
            <p className="text-sm font-semibold">הגדרות עבודה</p>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                name="has_wordpress"
                defaultChecked
                className="mt-0.5 h-4 w-4 rounded border-border accent-brand"
              />
              <span>
                <span className="font-medium">פרויקט WordPress</span>
                <br />
                <span className="text-xs text-muted-fg">בנוסף ל-HTML הסטטי, הפרויקט יכלול תבנית WordPress.</span>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                name="has_mobile_design"
                defaultChecked
                className="mt-0.5 h-4 w-4 rounded border-border accent-brand"
              />
              <span>
                <span className="font-medium">עיצוב מובייל</span>
                <br />
                <span className="text-xs text-muted-fg">המעצב יספק עיצובי מובייל בנוסף לדסקטופ.</span>
              </span>
            </label>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button asChild variant="ghost" type="button">
              <Link href="/projects">ביטול</Link>
            </Button>
            <Button type="submit" variant="accent" disabled={isPending || !name}>
              {isPending ? 'יוצר...' : 'צרו פרויקט'}
              <ArrowRight className="ms-1 h-4 w-4" />
            </Button>
          </div>

        </form>
      </CardContent>
    </Card>
  );
}
