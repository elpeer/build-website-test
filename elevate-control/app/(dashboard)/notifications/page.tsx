import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, MessageCircle, FileCheck, Headphones, FileText } from 'lucide-react';

export const metadata = { title: 'התראות' };

interface NotificationRow {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

const KIND_ICONS: Record<string, typeof MessageCircle> = {
  comment: MessageCircle, approval: FileCheck, ticket: Headphones,
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data } = await supabase
    .from('notifications')
    .select('id, kind, title, body, link, read_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200);
  const items = (data ?? []) as NotificationRow[];

  const unread = items.filter(i => !i.read_at);
  const read   = items.filter(i =>  i.read_at);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Bell className="h-7 w-7" />
          התראות
        </h1>
        <p className="mt-1 text-sm text-muted-fg">
          {unread.length} חדשות · {items.length} סך הכל
        </p>
      </header>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-fg">
            🎉 אין התראות.
          </CardContent>
        </Card>
      ) : (
        <>
          {unread.length > 0 && <Section title="חדש" items={unread} />}
          {read.length > 0   && <Section title="נקרא" items={read} faded />}
        </>
      )}
    </div>
  );
}

function Section({ title, items, faded }: { title: string; items: NotificationRow[]; faded?: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title} ({items.length})</CardTitle>
        <CardDescription className="text-xs">לחיצה תפתח את הקישור הרלוונטי</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map(n => {
            const Icon = KIND_ICONS[n.kind] ?? FileText;
            const date = new Date(n.created_at).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' });
            const inner = (
              <div className={`flex items-start gap-3 rounded-md border border-border bg-background p-3 ${faded ? 'opacity-70' : ''}`}>
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${faded ? 'bg-muted text-muted-fg' : 'bg-brand/10 text-brand'}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-sm text-muted-fg">{n.body}</p>}
                  <p className="mt-1 text-xs text-muted-fg">{date}</p>
                </div>
              </div>
            );
            return n.link
              ? <li key={n.id}><Link href={n.link} className="block hover:opacity-90">{inner}</Link></li>
              : <li key={n.id}>{inner}</li>;
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
