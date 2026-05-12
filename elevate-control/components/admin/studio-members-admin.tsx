'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { inviteToStudio, updateStudioMember, cancelStudioInvitation } from '@/app/actions/studio';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Mail, Trash2, AlertCircle, CheckCircle2, Clock, Shield } from 'lucide-react';
import { SetPasswordButton } from '@/components/team/set-password-button';
import { DeleteUserButton } from '@/components/team/delete-user-button';
import type { UserRole } from '@/lib/supabase/database.types';

interface ProfileRow {
  id: string; email: string; full_name: string | null; avatar_url: string | null;
  role: string; studio_admin: boolean; created_at: string;
}
interface InvitationRow {
  id: string; email: string; role: string; studio_admin: boolean;
  created_at: string; accepted_at: string | null;
}
interface Props {
  currentUserId: string;
  profiles: ProfileRow[];
  invitations: InvitationRow[];
}

// Studio members = roles other than 'client'. Clients live on /clients.
const ROLE_LABELS: Record<string, string> = {
  super_admin: 'אדמין-על', pm: 'PM', designer: 'מעצב', developer: 'מפתח',
};
const ROLE_PILLS: Record<string, string> = {
  super_admin: 'bg-amber-100 text-amber-800', pm: 'bg-blue-100 text-blue-700',
  designer: 'bg-purple-100 text-purple-700', developer: 'bg-green-100 text-green-700',
  client: 'bg-zinc-100 text-zinc-700',
};

export function StudioMembersAdmin({ currentUserId, profiles, invitations }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('designer');
  const [studioAdmin, setStudioAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function generatePassword() {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const buf = new Uint32Array(12);
    crypto.getRandomValues(buf);
    setPassword(Array.from(buf, b => chars[b % chars.length]).join(''));
  }

  function handleInvite(formData: FormData) {
    setError(null); setSuccess(null);
    if (password && password.length >= 8) formData.set('password', password);
    startTransition(async () => {
      const result = await inviteToStudio(formData);
      if (result.ok) {
        setEmail(''); setRole('designer'); setStudioAdmin(false); setPassword('');
        setSuccess(result.data.status === 'updated'
          ? 'המשתמש כבר קיים — התפקיד עודכן.'
          : 'המשתמש נוצר — שלחו לו את הסיסמה והוא יוכל להתחבר מיידית.');
        router.refresh();
      } else setError(result.error);
    });
  }

  function changeRole(profileId: string, newRole: UserRole) {
    startTransition(async () => {
      const result = await updateStudioMember(profileId, { role: newRole });
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  }

  function toggleAdmin(profileId: string, value: boolean) {
    startTransition(async () => {
      const result = await updateStudioMember(profileId, { studio_admin: value });
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  }

  function handleCancelInvite(invId: string, email: string) {
    if (!confirm(`לבטל את ההזמנה ל-${email}?`)) return;
    startTransition(async () => {
      await cancelStudioInvitation(invId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Invite form */}
      <form action={handleInvite} className="space-y-3 rounded-md border border-border bg-muted/30 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <div className="space-y-1.5">
            <Label htmlFor="invite_email">כתובת מייל</Label>
            <Input id="invite_email" name="email" type="email" value={email}
                   onChange={e => setEmail(e.target.value)}
                   placeholder="name@example.com" dir="ltr" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite_role">תפקיד גלובלי</Label>
            <select id="invite_role" name="role" value={role}
                    onChange={e => setRole(e.target.value as UserRole)}
                    className="block h-10 w-44 rounded-md border border-border bg-background px-3 text-sm">
              {(Object.keys(ROLE_LABELS) as UserRole[]).map(r => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit" variant="accent" disabled={isPending || !email}>
              <UserPlus className="ms-1 h-4 w-4" />
              {isPending ? 'שולח...' : 'הזמן'}
            </Button>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="studio_admin" checked={studioAdmin}
                 onChange={e => setStudioAdmin(e.target.checked)} className="h-4 w-4" />
          <span>סמן כ-Studio Admin (גישה מלאה למערכת)</span>
        </label>
        <div className="space-y-1.5">
          <Label htmlFor="invite_password">סיסמה ראשונית (אופציונלי, 8+ תווים)</Label>
          <div className="flex items-center gap-2">
            <Input id="invite_password" value={password} dir="ltr" className="font-mono text-sm"
                   onChange={e => setPassword(e.target.value)}
                   placeholder="ריק → תיוצר אוטומטית" />
            <Button type="button" variant="outline" size="sm" onClick={generatePassword}>
              הגרל
            </Button>
          </div>
          <p className="text-xs text-muted-fg">
            אם תשאירו ריק, תיוצר סיסמה אקראית. שלחו אותה לחבר הצוות בנפרד.
            PMs ו-Studio Admins מצורפים אוטומטית כחברים בכל פרויקט חדש שייפתח.
          </p>
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
      </form>

      {/* Members */}
      {profiles.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-muted-fg">משתמשים פעילים ({profiles.length})</h3>
          <ul className="space-y-2">
            {profiles.map(p => {
              const label = p.full_name ?? p.email;
              const isSelf = p.id === currentUserId;
              return (
                <li key={p.id} className="rounded-md border border-border bg-background p-3">
                 <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
                    {label.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{label}</p>
                      {isSelf && <span className="text-xs text-muted-fg">(את/ה)</span>}
                    </div>
                    <p className="truncate text-xs text-muted-fg" dir="ltr">{p.email}</p>
                  </div>

                  <select value={p.role}
                          onChange={e => changeRole(p.id, e.target.value as UserRole)}
                          disabled={isPending}
                          className={`h-8 rounded-full border-0 px-2.5 text-xs font-medium ${ROLE_PILLS[p.role] ?? 'bg-zinc-100'} disabled:opacity-60`}>
                    {(Object.keys(ROLE_LABELS) as UserRole[]).map(r => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>

                  <label className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs ${
                    p.studio_admin ? 'bg-amber-100 text-amber-800' : 'bg-zinc-100 text-zinc-500'
                  } ${isSelf && p.studio_admin ? 'opacity-60' : ''}`}>
                    <Shield className="h-3 w-3" />
                    <input type="checkbox" checked={p.studio_admin}
                           onChange={e => toggleAdmin(p.id, e.target.checked)}
                           disabled={isPending || (isSelf && p.studio_admin)}
                           className="h-3 w-3" />
                    Admin
                  </label>
                 </div>
                 <div className="mt-2 flex flex-wrap items-center gap-2">
                   <SetPasswordButton userId={p.id} userLabel={p.email} />
                   {!isSelf && <DeleteUserButton userId={p.id} userLabel={p.email} />}
                 </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Invitations */}
      {invitations.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-muted-fg">הזמנות ממתינות ({invitations.length})</h3>
          <ul className="space-y-2">
            {invitations.map(inv => {
              const date = new Date(inv.created_at).toLocaleDateString('he-IL');
              return (
                <li key={inv.id} className="flex items-center gap-3 rounded-md border border-dashed border-border bg-muted/30 p-3">
                  <Mail className="h-4 w-4 shrink-0 text-muted-fg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" dir="ltr">{inv.email}</p>
                    <p className="text-xs text-muted-fg">
                      <Clock className="ms-1 inline h-3 w-3" />
                      ממתין מ-{date}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_PILLS[inv.role] ?? 'bg-zinc-100'}`}>
                    {ROLE_LABELS[inv.role] ?? inv.role}
                  </span>
                  {inv.studio_admin && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800">
                      <Shield className="h-3 w-3" />Admin
                    </span>
                  )}
                  <button type="button" onClick={() => handleCancelInvite(inv.id, inv.email)}
                          disabled={isPending}
                          className="text-red-600 hover:text-red-700 disabled:opacity-30" aria-label="בטל">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
