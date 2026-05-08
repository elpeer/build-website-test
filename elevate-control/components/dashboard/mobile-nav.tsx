'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Menu, X, FolderKanban, Users, Settings, BookOpen, Shield } from 'lucide-react';
import type { ProfileRow } from '@/lib/supabase/database.types';

type Profile = Pick<ProfileRow, 'id' | 'email' | 'full_name' | 'role' | 'studio_admin'>;

export function MobileNav({ user }: { user: Profile }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

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

  function close() { setOpen(false); }

  // Render the drawer via a portal to document.body so it isn't trapped by an
  // ancestor with `backdrop-filter` (which creates a containing block for
  // `position: fixed` descendants on iOS Safari and some Chromium builds —
  // that was making the drawer collapse to the topbar's 64px height).
  const drawer = open ? (
    <>
          <button type="button" aria-label="סגור תפריט" onClick={close}
                  className="fixed inset-0 z-[60] cursor-default bg-black/50 lg:hidden" />

          <aside className="fixed inset-y-0 start-0 z-[70] flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl lg:hidden"
                 role="dialog" aria-modal="true">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 px-4">
              <Link href="/projects" onClick={close} className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                       strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M3 12l2-2 7-7 7 7 2 2v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z"/>
                  </svg>
                </div>
                <span className="font-bold text-zinc-900">Elevate Control</span>
              </Link>
              <button type="button" onClick={close}
                      className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100"
                      aria-label="סגור">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <nav className="space-y-1 p-3">
                <Item href="/projects"        icon={FolderKanban} onClose={close}>פרויקטים</Item>
                <Item href="/team"            icon={Users}        onClose={close}>חברי צוות</Item>
                <Item href="/section-library" icon={BookOpen}     onClose={close}>מאגר סקשנים</Item>
                <Item href="/settings"        icon={Settings}     onClose={close}>הגדרות</Item>
              </nav>

              {user.studio_admin && (
                <div className="border-t border-zinc-200 p-3">
                  <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">אדמין</p>
                  <Item href="/admin/studio-members"     icon={Shield}   onClose={close}>חברי סטודיו</Item>
                  <Item href="/admin/section-definitions" icon={Settings} onClose={close}>קטלוג סקשנים</Item>
                  <Item href="/admin/guides"             icon={BookOpen} onClose={close}>מאגר מדריכים</Item>
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-zinc-200 p-3 text-xs text-zinc-500">
              <p className="font-medium text-zinc-700">{user.full_name ?? user.email}</p>
              <p className="text-[11px]" dir="ltr">{user.email}</p>
            </div>
          </aside>
    </>
  ) : null;

  return (
    <>
      <button type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center justify-center rounded-md p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 lg:hidden"
              aria-label="פתח תפריט">
        <Menu className="h-5 w-5" />
      </button>
      {mounted && drawer && createPortal(drawer, document.body)}
    </>
  );
}

function Item({
  href, icon: Icon, onClose, children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} onClick={onClose}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900">
      <Icon className="h-4 w-4" />
      <span>{children}</span>
    </Link>
  );
}
