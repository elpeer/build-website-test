'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FileText, Layers, Image as ImageIcon, Database, Users, Activity, Plus, Pencil, Trash2 } from 'lucide-react';

interface ActivityRow {
  id: string;
  project_id: string;
  actor_id: string | null;
  actor_label: string | null;
  kind: string;
  entity_type: string;
  entity_id: string | null;
  summary: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
}

interface Props {
  projectId: string;
  initialActivities: ActivityRow[];
  profiles: Record<string, Profile>;
  limit?: number;
}

const ENTITY_ICONS: Record<string, typeof FileText> = {
  page:                FileText,
  section:             Layers,
  design:              ImageIcon,
  cpt:                 Database,
  project_member:      Users,
  project_invitation:  Users,
};

const KIND_ICONS: Record<string, typeof Plus> = {
  created:          Plus,
  updated:          Pencil,
  deleted:          Trash2,
  section_added:    Plus,
  design_uploaded:  Plus,
  member_added:     Plus,
  member_invited:   Plus,
  member_removed:   Trash2,
};

const KIND_COLORS: Record<string, string> = {
  created:          'text-green-600',
  updated:          'text-blue-600',
  deleted:          'text-red-600',
  section_added:    'text-green-600',
  design_uploaded:  'text-purple-600',
  member_added:     'text-green-600',
  member_invited:   'text-amber-600',
  member_removed:   'text-red-600',
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

export function ActivityFeed({ projectId, initialActivities, profiles, limit }: Props) {
  const [activities, setActivities] = useState<ActivityRow[]>(initialActivities);
  const [, setTick] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`activity:${projectId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'activity_log',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const row = payload.new as ActivityRow;
          setActivities(prev => {
            // Dedupe in case the row already arrived via SSR
            if (prev.some(a => a.id === row.id)) return prev;
            const next = [row, ...prev];
            return limit ? next.slice(0, limit) : next;
          });
        }
      )
      .subscribe();

    // Re-render every minute so "X minutes ago" stays fresh
    const interval = setInterval(() => setTick(t => t + 1), 60_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [projectId, limit]);

  const visible = limit ? activities.slice(0, limit) : activities;

  if (visible.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-fg">
        עדיין אין פעילות בפרויקט. הוסיפו עמוד או סקשן כדי להתחיל.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {visible.map(a => {
        const EntityIcon = ENTITY_ICONS[a.entity_type] ?? Activity;
        const KindIcon   = KIND_ICONS[a.kind] ?? Activity;
        const color      = KIND_COLORS[a.kind] ?? 'text-muted-fg';
        const actor      = a.actor_id ? profiles[a.actor_id] : null;
        const actorName  = a.actor_label ?? actor?.full_name ?? actor?.email ?? 'משתמש';

        return (
          <li key={a.id} className="flex items-start gap-3 rounded-md border border-border bg-background p-3">
            <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted ${color}`}>
              <KindIcon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-medium">{actorName}</span>
                <span className="mx-1 text-muted-fg">·</span>
                <span>{a.summary ?? `${a.kind} ${a.entity_type}`}</span>
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-fg">
                <EntityIcon className="h-3 w-3" />
                <span>{timeAgo(a.created_at)}</span>
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
