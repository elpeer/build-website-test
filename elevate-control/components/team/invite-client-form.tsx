'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { inviteMember } from '@/app/actions/team';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';

interface ProjectOption { id: string; slug: string; name: string }

interface Props {
  projects: ProjectOption[];
}

/**
 * Studio-side form to invite a new client and assign them to a project in
 * one step. If the email already has a profile they are added to
 * project_members immediately; otherwise a project_invitations row is
 * created and the user gets attached on their first sign-in.
 */
export function InviteClientForm({ projects }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null); setSuccess(null);
    if (!projectId) { setError('בחרו פרויקט'); return; }
    formData.set('project_id', projectId);
    formData.set('project_slug', projects.find(p => p.id === projectId)?.slug ?? '');
    formData.set('role', 'client');

    startTransition(async () => {
      const result = await inviteMember(formData);
      if (result.ok) {
        setSuccess(result.data.status === 'attached'
          ? 'הלקוח נוסף לפרויקט מיידית.'
          : 'נשלחה הזמנה. הלקוח יצורף עם ההתחברות הראשונה שלו.');
        setEmail('');
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-fg">
        אין פרויקטים פעילים. צרו פרויקט כדי להזמין אליו לקוח.
      </div>
    );
  }

  if (!open) {
    return (
      <Button type="button" variant="accent" onClick={() => setOpen(true)}>
        <UserPlus className="ms-1 h-4 w-4" />
        הזמן לקוח לפרויקט
      </Button>
    );
  }

  return (
    <form action={handleSubmit}
          className="space-y-3 rounded-lg border border-brand bg-brand/5 p-4">
      <div className="flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-brand" />
        <h3 className="font-semibold">הזמנת לקוח חדש</h3>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">פרויקט</Label>
          <select value={projectId} onChange={e => setProjectId(e.target.value)} required
                  className="block h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">מייל הלקוח</Label>
          <Input name="email" type="email" required dir="ltr"
                 value={email} onChange={e => setEmail(e.target.value)}
                 placeholder="client@example.com" />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-2 text-xs text-green-700">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{success}</span>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>סגור</Button>
        <Button type="submit" variant="accent" disabled={isPending || !email.trim()}>
          {isPending ? 'שולח...' : 'הזמן'}
        </Button>
      </div>
    </form>
  );
}
