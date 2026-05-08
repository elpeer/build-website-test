'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createStandardQaChecklist } from '@/app/actions/client-workspace';
import { Button } from '@/components/ui/button';
import { ListChecks } from 'lucide-react';

interface Props {
  projectId: string;
  projectSlug: string;
}

/** Renders a one-click "create the standard QA checklist" CTA. Use only on
 *  an empty QA workspace as studio (the action is gated server-side too). */
export function QaSeedButton({ projectId, projectSlug }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm('ליצור את צ׳קליסט הבדיקות הסטנדרטי? תוכלו לערוך, להוסיף ולמחוק פריטים אחר כך.')) return;
    startTransition(async () => {
      await createStandardQaChecklist({ projectId, projectSlug });
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-dashed border-brand/40 bg-brand/5 p-6 text-center">
      <ListChecks className="mx-auto h-8 w-8 text-brand" />
      <h3 className="mt-2 font-semibold">צ׳קליסט QA סטנדרטי</h3>
      <p className="mt-1 text-sm text-muted-fg">
        חוסכים את ההזנה הראשונית — ניצור 10 פריטי בדיקה שמכסים את הבסיס:
        תצוגה במובייל ובדסקטופ, קישורים, טפסים, אנליטיקס, מהירות, נגישות, SEO, דפדפנים, והגהה.
      </p>
      <Button type="button" variant="accent" className="mt-3" onClick={handleClick}
              disabled={isPending}>
        {isPending ? 'יוצר...' : 'צור צ׳קליסט סטנדרטי'}
      </Button>
    </div>
  );
}
