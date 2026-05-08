'use client';

import { useState } from 'react';
import { signInWithMagicLink, signInWithPassword } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Mail, Send, KeyRound } from 'lucide-react';

const ERROR_MESSAGES: Record<string, string> = {
  'invalid-email':    'נא להזין כתובת אימייל תקינה.',
  'missing-password': 'נא להזין סיסמה.',
};

export function SignInForm({
  redirectTo,
  sent,
  error,
}: {
  redirectTo?: string;
  sent?: string;
  error?: string;
}) {
  const [mode, setMode] = useState<'magic' | 'password'>('password');

  if (sent) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
            <Mail className="h-5 w-5 text-accent" />
          </div>
          <CardTitle>בדקו את האימייל שלכם</CardTitle>
          <CardDescription>שלחנו אליכם קישור התחברות חד-פעמי. הוא תקף 60 דקות.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-fg">
            אם לא הגיע — בדקו בתיקיית הספאם, או חזרו{' '}
            <a href="/sign-in" className="font-medium text-brand hover:underline">לעמוד ההתחברות</a>{' '}
            ונסו שוב.
          </p>
        </CardContent>
      </Card>
    );
  }

  const errorMessage = error ? (ERROR_MESSAGES[error] ?? error) : null;
  const isPassword = mode === 'password';

  return (
    <Card>
      <CardHeader>
        <CardTitle>התחברות</CardTitle>
        <CardDescription>
          {isPassword
            ? 'התחברו עם המייל והסיסמה שקיבלתם מהסטודיו.'
            : 'נשלח אליכם קישור חד-פעמי לאימייל.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={isPassword ? signInWithPassword : signInWithMagicLink} className="space-y-4">
          {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              אימייל
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@elevate.studio"
              autoComplete="email"
              required
              dir="ltr"
              className="text-start"
            />
          </div>

          {isPassword && (
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                סיסמה
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                dir="ltr"
                className="text-start"
              />
            </div>
          )}

          {errorMessage && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" dir="rtl">
              {errorMessage}
            </p>
          )}

          <Button type="submit" className="w-full">
            {isPassword ? (
              <>
                <KeyRound className="ms-1 h-4 w-4" />
                התחבר
              </>
            ) : (
              <>
                <Send className="ms-1 h-4 w-4" />
                שלחו לי קישור
              </>
            )}
          </Button>
        </form>

        <button type="button"
                onClick={() => setMode(isPassword ? 'magic' : 'password')}
                className="mt-3 block w-full text-center text-xs text-muted-fg hover:text-brand">
          {isPassword
            ? 'או שלחו לי קישור חד-פעמי במייל'
            : 'או התחברו עם סיסמה'}
        </button>
      </CardContent>
    </Card>
  );
}
