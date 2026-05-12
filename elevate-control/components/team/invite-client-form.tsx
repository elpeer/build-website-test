'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { inviteMember } from '@/app/actions/team';
import { setUserPassword } from '@/app/actions/auth';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';

interface ProjectOption { id: string; slug: string; name: string }

interface Props {
  projects: ProjectOption[];
}

/**
 * Always-visible invite-client form (mirrors the studio-member invite UX
 * on /admin/studio-members). Picks a project, optional initial password
 * (auto-generated if requested), creates the project_invitation +
 * resolves the user, then sets the password if provided.
 */
export function InviteClientForm({ projects }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [setPwdNow, setSetPwdNow] = useState(true);
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [copied, setCopied]   = useState(false);
  const [isPending, startTransition] = useTransition();

  function generatePassword() {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const buf = new Uint32Array(12);
    crypto.getRandomValues(buf);
    setPassword(Array.from(buf, b => chars[b % chars.length]).join(''));
  }

  function copyPassword() {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  function handleSubmit(formData: FormData) {
    setError(null); setSuccess(null);
    if (!projectId) { setError('בחרו פרויקט'); return; }
    formData.set('project_id', projectId);
    formData.set('project_slug', projects.find(p => p.id === projectId)?.slug ?? '');
    formData.set('role', 'client');
    if (setPwdNow && password.length >= 8) {
      formData.set('password', password);
    }

    startTransition(async () => {
      const result = await inviteMember(formData);
      if (!result.ok) { setError(result.error); return; }

      // If the email matched an existing platform user we still want to
      // honor the password the admin typed — inviteMember only sets the
      // password on the new-user path.
      let pwdMessage = '';
      if (setPwdNow && password.length >= 8) {
        const supabase = createClient();
        const { data: profile } = await supabase
          .from('profiles').select('id').ilike('email', email.trim()).maybeSingle<{ id: string }>();
        if (profile) {
          const r2 = await setUserPassword(profile.id, password);
          if (!r2.ok) {
            setError(`הוזמן בהצלחה אבל הגדרת הסיסמה נכשלה: ${r2.error}`);
            return;
          }
          pwdMessage = ' הסיסמה הוגדרה — שלחו ללקוח את המייל והסיסמה והוא יוכל להתחבר מיידית.';
        }
      }

      setSuccess('הלקוח נוסף לפרויקט.' + pwdMessage);
      setEmail('');
      setPassword('');
      router.refresh();
    });
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-fg">
        אין פרויקטים פעילים. צרו פרויקט כדי להזמין אליו לקוח.
      </div>
    );
  }

  return (
    <form action={handleSubmit}
          className="space-y-3 rounded-lg border border-border bg-background p-4">
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
          <Label className="text-xs">כתובת מייל</Label>
          <Input name="email" type="email" required dir="ltr"
                 value={email} onChange={e => setEmail(e.target.value)}
                 placeholder="client@example.com" />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={setPwdNow}
               onChange={e => setSetPwdNow(e.target.checked)} className="h-4 w-4" />
        <span>קבעו סיסמה ראשונית כעת (8+ תווים)</span>
      </label>

      {setPwdNow && (
        <div className="flex items-center gap-2">
          <Input value={password} dir="ltr" className="font-mono text-sm"
                 placeholder="סיסמה (אפשר להגריל)"
                 onChange={e => setPassword(e.target.value)} />
          <Button type="button" variant="outline" size="sm" onClick={generatePassword}>
            הגרל
          </Button>
          {password && (
            <Button type="button" variant="ghost" size="sm" onClick={copyPassword} title="העתק">
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          )}
        </div>
      )}

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

      <div className="flex justify-end">
        <Button type="submit" variant="accent" disabled={isPending || !email.trim()}>
          <UserPlus className="ms-1 h-4 w-4" />
          {isPending ? 'יוצר...' : 'הזמן לקוח'}
        </Button>
      </div>
    </form>
  );
}
