import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { NewProjectForm } from '@/components/projects/new-project-form';

export const metadata = { title: 'פרויקט חדש' };

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">

      <Link
        href="/projects"
        className="inline-flex items-center gap-1 text-sm text-muted-fg hover:text-brand"
      >
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        חזרה לפרויקטים
      </Link>

      <header>
        <h1 className="text-3xl font-bold tracking-tight">פרויקט חדש</h1>
        <p className="mt-1 text-sm text-muted-fg">
          הגדירו את הפרטים הבסיסיים. תוכלו להוסיף עמודים, סקשנים, חברי צוות ועיצובים מהעמוד של הפרויקט.
        </p>
      </header>

      <NewProjectForm />
    </div>
  );
}
