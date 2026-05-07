import Image from 'next/image';
import { signOut } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon } from 'lucide-react';
import type { Database } from '@/lib/supabase/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export function Topbar({ user }: { user: Profile }) {
  const initials = (user.full_name ?? user.email).slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-sm">
      <div />
      <div className="flex items-center gap-3">
        <div className="text-end">
          <p className="text-sm font-medium leading-none">{user.full_name ?? user.email}</p>
          <p className="mt-0.5 text-xs text-muted-fg">{user.email}</p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt={user.full_name ?? ''}
              width={36}
              height={36}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            initials || <UserIcon className="h-4 w-4" />
          )}
        </div>

        <form action={signOut}>
          <Button type="submit" variant="ghost" size="icon" title="התנתקות">
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
