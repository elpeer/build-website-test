'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile } from '@/app/actions/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, AlertCircle, Save } from 'lucide-react';

interface Props {
  email: string;
  fullName: string;
  avatarUrl: string;
  role: string;
  studioAdmin: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'אדמין-על',
  pm:          'PM',
  designer:    'מעצב',
  developer:   'מפתח',
  client:      'לקוח',
};

export function ProfileForm({ email, fullName: f0, avatarUrl: a0, role, studioAdmin }: Props) {
  const router = useRouter();
  const [fullName, setFullName] = useState(f0);
  const [avatarUrl, setAvatarUrl] = useState(a0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null); setSuccess(false);
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result.ok) { setSuccess(true); router.refresh(); }
      else setError(result.error);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">מייל</Label>
          <Input id="email" value={email} dir="ltr" disabled />
          <p className="text-xs text-muted-fg">לא ניתן לשנות את המייל.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="full_name">שם מלא</Label>
          <Input id="full_name" name="full_name" value={fullName}
                 onChange={e => setFullName(e.target.value)}
                 placeholder="ישראל ישראלי" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="avatar_url">URL לאווטאר</Label>
        <Input id="avatar_url" name="avatar_url" value={avatarUrl} dir="ltr"
               onChange={e => setAvatarUrl(e.target.value)}
               placeholder="https://..." />
      </div>

      <div className="grid gap-4 rounded-md border border-border bg-muted/30 p-3 text-sm md:grid-cols-2">
        <div>
          <span className="text-muted-fg">תפקיד גלובלי: </span>
          <span className="font-medium">{ROLE_LABELS[role] ?? role}</span>
        </div>
        <div>
          <span className="text-muted-fg">Studio Admin: </span>
          <span className="font-medium">{studioAdmin ? 'כן' : 'לא'}</span>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><span>הפרופיל נשמר.</span>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" variant="accent" disabled={isPending}>
          <Save className="ms-1 h-4 w-4" />
          {isPending ? 'שומר...' : 'שמור'}
        </Button>
      </div>
    </form>
  );
}
