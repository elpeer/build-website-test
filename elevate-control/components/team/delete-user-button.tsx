'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteUser } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Trash2, AlertCircle } from 'lucide-react';

interface Props {
  userId: string;
  userLabel: string; // email or name shown in the confirm prompt
}

/** Studio-admin-only inline button that hard-deletes a user account
 *  (cascades to profile + project_members). Two-step confirm so a
 *  misclick can't wipe a real client. */
export function DeleteUserButton({ userId, userLabel }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`למחוק לחלוטין את ${userLabel}?\n\nהפעולה לא הפיכה — כל החברויות בפרויקטים יוסרו גם כן.`)) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await deleteUser(userId);
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  }

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={handleClick}
              disabled={isPending}
              className="text-red-600 hover:bg-red-50 hover:text-red-700">
        <Trash2 className="ms-1 h-3.5 w-3.5" />
        {isPending ? 'מוחק...' : 'מחק'}
      </Button>
      {error && (
        <p className="mt-1 flex items-center gap-1 text-xs text-red-700">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </>
  );
}
