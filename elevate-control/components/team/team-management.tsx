'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { inviteMember, updateMemberRole, removeMember, cancelInvitation } from '@/app/actions/team';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Mail, Trash2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import type { MemberRole } from '@/lib/supabase/database.types';

interface MemberRow {
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: MemberRole;
}

interface InvitationRow {
  id: string;
  email: string;
  role: MemberRole;
  created_at: string;
}

interface Props {
  projectId: string;
  projectSlug: string;
  currentUserId: string;
  members: MemberRow[];
  invitations: InvitationRow[];
}

const ROLE_LABELS: Record<MemberRole, string> = {
  owner:     'בעלים',
  pm:        'PM',
  designer:  'מעצב',
  developer: 'מפתח',
  reviewer:  'סוקר',
  client:    'לקוח',
};

const ROLE_PILLS: Record<MemberRole, string> = {
  owner:     'bg-amber-100 text-amber-800',
  pm:        'bg-blue-100 text-blue-700',
  designer:  'bg-purple-100 text-purple-700',
  developer: 'bg-green-100 text-green-700',
  reviewer:  'bg-teal-100 text-teal-700',
  client:    'bg-zinc-100 text-zinc-700',
};

export function TeamManagement({ projectId, projectSlug, currentUserId, members, invitations }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberRole>('designer');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleInvite(formData: FormData) {
    setError(null); setSuccess(null);
    startTransition(async () => {
      const result = await inviteMember(formData);
      if (result.ok) {
        setEmail(''); setRole('designer');
        setSuccess(
          result.data.status === 'attached'
            ? 'המשתמש נוסף לצוות מיידית'
            : 'נשלחה הזמנה. המשתמש יצורף עם ההתחברות הראשונה שלו.'
        );
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleRoleChange(userId: string, newRole: MemberRole) {
    startTransition(async () => {
      const result = await updateMemberRole({ projectId, projectSlug }, userId, newRole);
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  }

  function handleRemove(userId: string, label: string) {
    if (!confirm(`להסיר את ${label} מהצוות?`)) return;
    startTransition(async () => {
      const result = await removeMember({ projectId, projectSlug }, userId);
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  }

  function handleCancelInvite(invId: string, email: string) {
    if (!confirm(`לבטל את ההזמנה ל-${email}?`)) return;
    startTransition(async () => {
      await cancelInvitation({ projectId, projectSlug }, invId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Invite form */}
      <form action={handleInvite} className="space-y-3 rounded-md border border-border bg-muted/30 p-4">
        <input type="hidden" name="project_id"   value={projectId} />
        <input type="hidden" name="project_slug" value={projectSlug} />

        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <div className="space-y-1.5">
            <Label htmlFor="invite_email">כתובת מייל</Label>
            <Input
              id="invite_email"
              name="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@example.com"
              dir="ltr"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite_role">תפקיד</Label>
            <select
              id="invite_role"
              name="role"
              value={role}
              onChange={e => setRole(e.target.value as MemberRole)}
              className="block h-10 w-40 rounded-md border border-border bg-background px-3 text-sm"
            >
              {(Object.keys(ROLE_LABELS) as MemberRole[]).map(r => (
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

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}
      </form>

      {/* Active members */}
      {members.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-muted-fg">חברי צוות פעילים ({members.length})</h3>
          <ul className="space-y-2">
            {members.map(m => {
              const label = m.full_name ?? m.email;
              const isSelf = m.user_id === currentUserId;
              return (
                <li key={m.user_id} className="flex items-center gap-3 rounded-md border border-border bg-background p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
                    {label.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {label}
                      {isSelf && <span className="me-2 text-xs text-muted-fg">(את/ה)</span>}
                    </p>
                    <p className="truncate text-xs text-muted-fg" dir="ltr">{m.email}</p>
                  </div>
                  <select
                    value={m.role}
                    onChange={e => handleRoleChange(m.user_id, e.target.value as MemberRole)}
                    disabled={isSelf || isPending}
                    className={`h-8 rounded-full border-0 px-2.5 text-xs font-medium ${ROLE_PILLS[m.role]} disabled:opacity-60`}
                  >
                    {(Object.keys(ROLE_LABELS) as MemberRole[]).map(r => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                  {!isSelf && (
                    <button
                      type="button"
                      onClick={() => handleRemove(m.user_id, label)}
                      disabled={isPending}
                      className="text-red-600 hover:text-red-700 disabled:opacity-30"
                      aria-label="הסר"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Pending invitations */}
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
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_PILLS[inv.role]}`}>
                    {ROLE_LABELS[inv.role]}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCancelInvite(inv.id, inv.email)}
                    disabled={isPending}
                    className="text-red-600 hover:text-red-700 disabled:opacity-30"
                    aria-label="בטל הזמנה"
                  >
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
