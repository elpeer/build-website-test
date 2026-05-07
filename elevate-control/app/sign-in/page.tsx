import type { Metadata } from 'next';
import { SignInForm } from '@/components/auth/sign-in-form';

export const metadata: Metadata = {
  title: 'התחברות',
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; sent?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="M3 12l2-2 7-7 7 7 2 2v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Elevate Control</h1>
          <p className="mt-1 text-sm text-muted-fg">מערכת ניהול הפרויקטים של הסטודיו</p>
        </div>

        <SignInForm redirectTo={params.redirect} sent={params.sent} error={params.error} />
      </div>
    </div>
  );
}
