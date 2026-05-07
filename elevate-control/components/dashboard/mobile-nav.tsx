'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, FolderKanban, Users, Settings, BookOpen, Shield } from 'lucide-react';
import type { ProfileRow } from '@/lib/supabase/database.types';

type Profile = Pick<ProfileRow, 'id' | 'email' | 'full_name' | 'role' | 'studio_admin'>;

const NAV_ITEMS = [
  { label: 'פרויקטים',    href: '/projects',         icon: FolderKanban },
  { label: 'חברי צוות',   href: '/team',             icon: Users },
  { label: 'מאגר סקשנים', href: '/section-library',  icon: BookOpen },
  { label: 'הגדרות',      href: '/settings',         icon: Settings },
];

export function MobileNav({ user }: { user: Profile }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <button type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center justify-center rounded-md p-2 text-muted-fg hover:bg-muted hover:text-foreground lg:hidden"
              aria-label="פתח תפריט">
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <button type="button"
                  aria-label="סגור תפריט"
                  onClick={() => setOpen(false)}
                  className="fixed inset-0 z-[60] cursor-default bg-black/50 lg:hidden" />

          {/* Drawer */}
          <aside className="fixed inset-y-0 end-0 z-[70] w-72 max-w-[85vw] overflow-y-auto bg-background shadow-2xl lg:hidden"
                 role="dialog" aria-modal="true">
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <Link href="/projects" onClick={() => setOpen(false)} className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                       strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M3 12l2-2 7-7 7 7 2 2v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z"/>
                  </svg>
                </div>
                <span className="font-bold">Elevate Control</span>
              </Link>
              <button type="button" onClick={() => setOpen(false)}
                      className="rounded-md p-2 text-muted-fg hover:bg-muted"
                      aria-label="סגור">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="space-y-1 p-3">
              {NAV_ITEMS.map(item => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-fg hover:bg-muted hover:text-foreground">
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            {user.studio_admin && (
              <div className="border-t border-border p-3">
                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-fg">אדמין</p>
                <Link href="/admin/studio-members" onClick={() => setOpen(false)}
                      className="mt-2 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-fg hover:bg-muted hover:text-foreground">
                  <Shield className="h-4 w-4" /><span>חברי סטודיו</span>
                </Link>
                <Link href="/admin/section-definitions" onClick={() => setOpen(false)}
                      className="mt-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-fg hover:bg-muted hover:text-foreground">
                  <Settings className="h-4 w-4" /><span>קטלוג סקשנים</span>
                </Link>
                <Link href="/admin/guides" onClick={() => setOpen(false)}
                      className="mt-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-fg hover:bg-muted hover:text-foreground">
                  <BookOpen className="h-4 w-4" /><span>מאגר מדריכים</span>
                </Link>
              </div>
            )}

            <div className="border-t border-border p-3 text-xs text-muted-fg">
              <p className="font-medium">{user.full_name ?? user.email}</p>
              <p className="text-[11px]" dir="ltr">{user.email}</p>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
