'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  markNotificationRead, markAllNotificationsRead, deleteNotification,
} from '@/app/actions/notifications';
import { Bell, CheckCheck, X, MessageCircle, FileCheck, Headphones, FileText } from 'lucide-react';

export interface NotificationRow {
  id: string;
  user_id: string;
  project_id: string | null;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

interface Props {
  userId: string;
  initial: NotificationRow[];
}

const KIND_ICONS: Record<string, typeof MessageCircle> = {
  comment:  MessageCircle,
  approval: FileCheck,
  ticket:   Headphones,
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'הרגע';
  const min = Math.floor(sec / 60);
  if (min < 60) return `לפני ${min} דק׳`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `לפני ${hr} שע׳`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `לפני ${days} ימים`;
  return new Date(iso).toLocaleDateString('he-IL');
}

export function NotificationsBell({ userId, initial }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<NotificationRow[]>(initial);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    const ch = supabase.channel(`notifications:${userId}`)
      .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
          payload => {
            const row = payload.new as NotificationRow;
            setItems(prev => prev.some(i => i.id === row.id) ? prev : [row, ...prev].slice(0, 50));
          })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    function onClick(e: MouseEvent) {
      if (!(e.target as Element).closest('[data-notif-popover]')) setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const unread = items.filter(i => !i.read_at).length;

  function handleClick(n: NotificationRow) {
    if (!n.read_at) {
      setItems(prev => prev.map(i => i.id === n.id ? { ...i, read_at: new Date().toISOString() } : i));
      startTransition(async () => { await markNotificationRead(n.id); });
    }
    if (n.link) { router.push(n.link); setOpen(false); }
  }

  function handleMarkAll() {
    setItems(prev => prev.map(i => i.read_at ? i : { ...i, read_at: new Date().toISOString() }));
    startTransition(async () => { await markAllNotificationsRead(); });
  }

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setItems(prev => prev.filter(i => i.id !== id));
    startTransition(async () => { await deleteNotification(id); });
  }

  return (
    <div className="relative" data-notif-popover>
      <button type="button"
              onClick={() => setOpen(o => !o)}
              className="relative inline-flex items-center justify-center rounded-md p-2 text-muted-fg hover:bg-muted hover:text-foreground"
              aria-label="התראות">
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -end-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 z-40 mt-2 w-96 max-w-[90vw] overflow-hidden rounded-md border border-border bg-background shadow-lg">
          <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-2">
            <p className="text-sm font-semibold">התראות</p>
            {unread > 0 && (
              <button type="button" onClick={handleMarkAll}
                      className="inline-flex items-center gap-1 text-xs text-muted-fg hover:text-brand">
                <CheckCheck className="h-3.5 w-3.5" />
                סמן הכל כנקרא
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-fg">אין התראות חדשות 🎉</p>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto">
              {items.slice(0, 30).map(n => {
                const Icon = KIND_ICONS[n.kind] ?? FileText;
                return (
                  <li key={n.id}
                      className={`group flex cursor-pointer items-start gap-3 border-b border-border px-3 py-2.5 last:border-b-0 hover:bg-muted/40 ${
                        n.read_at ? 'opacity-70' : ''
                      }`}
                      onClick={() => handleClick(n)}>
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      n.read_at ? 'bg-muted text-muted-fg' : 'bg-brand/10 text-brand'
                    }`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {!n.read_at && <span className="me-1.5 inline-block h-2 w-2 rounded-full bg-red-500" />}
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-fg">{n.body}</p>
                      )}
                      <p className="mt-0.5 text-[11px] text-muted-fg">{timeAgo(n.created_at)}</p>
                    </div>
                    <button type="button" onClick={e => handleDelete(n.id, e)}
                            className="invisible shrink-0 text-muted-fg hover:text-red-600 group-hover:visible"
                            aria-label="מחק">
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="border-t border-border bg-muted/30 px-4 py-2 text-center">
            <Link href="/notifications" onClick={() => setOpen(false)}
                  className="text-xs text-brand hover:underline">
              צפה בכל ההתראות
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
