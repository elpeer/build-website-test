'use client';

import { useTransition } from 'react';
import { signOut } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        if (!confirm('להתנתק?')) return;
        startTransition(async () => { await signOut(); });
      }}
      disabled={isPending}
      className="text-red-600 hover:bg-red-50 hover:text-red-700"
    >
      <LogOut className="ms-1 h-4 w-4" />
      {isPending ? 'מתנתק...' : 'התנתק'}
    </Button>
  );
}
