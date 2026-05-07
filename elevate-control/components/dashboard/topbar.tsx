import Image from 'next/image';
import { signOut } from '@/app/actions/auth';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon } from 'lucide-react';
import { NotificationsBell, type NotificationRow } from './notifications-bell';
import { MobileNav } from './mobile-nav';
import type { ProfileRow } from '@/lib/supabase/database.types';

type Profile = Pick<ProfileRow, 'id' | 'email' | 'full_name' | 'avatar_url' | 'role' | 'studio_admin'>;

export async function Topbar({ user }: { user: Profile }) {
  const initials = (user.full_name ?? user.email).slice(0, 2).toUpperCase();

  const supabase = await createClient();
  const { data: notifData } = await supabase
    .from('notifications')
    .select('id, user_id, project_id, kind, title, body, link, read_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);
  const notifications = (notifData ?? []) as NotificationRow[];

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <MobileNav user={user} />
      <div className="flex items-center gap-3">
        <NotificationsBell userId={user.id} initial={notifications} />

        <div className="hidden text-end sm:block">
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
