import Link from 'next/link';
import { FolderKanban, Users, Settings, BookOpen, Shield } from 'lucide-react';
import type { ProfileRow } from '@/lib/supabase/database.types';

type Profile = Pick<ProfileRow, 'id' | 'email' | 'full_name' | 'avatar_url' | 'role' | 'studio_admin'>;

const NAV_ITEMS: { label: string; href: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { label: 'פרויקטים',         href: '/projects',          icon: FolderKanban },
  { label: 'חברי צוות',        href: '/team',              icon: Users },
  { label: 'מאגר סקשנים',      href: '/section-library',   icon: BookOpen },
  { label: 'הגדרות',            href: '/settings',          icon: Settings },
];

export function Sidebar({ user }: { user: Profile }) {
  return (
    <aside className="hidden w-64 shrink-0 border-l border-border bg-background lg:block">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/projects" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M3 12l2-2 7-7 7 7 2 2v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z"/>
            </svg>
          </div>
          <span className="font-bold">Elevate Control</span>
        </Link>
      </div>

      <nav className="space-y-1 p-3">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-fg transition-colors hover:bg-muted hover:text-foreground"
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {user.studio_admin && (
        <div className="border-t border-border p-3">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-fg">אדמין</p>
          <Link
            href="/admin/studio-members"
            className="mt-2 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-fg hover:bg-muted hover:text-foreground"
          >
            <Shield className="h-4 w-4" />
            <span>חברי סטודיו</span>
          </Link>
          <Link
            href="/admin/section-definitions"
            className="mt-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-fg hover:bg-muted hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
            <span>קטלוג סקשנים</span>
          </Link>
        </div>
      )}
    </aside>
  );
}
