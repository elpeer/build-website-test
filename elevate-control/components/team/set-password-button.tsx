'use client';

import { useState, useTransition } from 'react';
import { setUserPassword } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KeyRound, Check, X, Copy } from 'lucide-react';

interface Props {
  userId: string;
  userLabel: string; // email or name, just for the prompt
}

/**
 * Studio-admin-only inline UI to set or reset a user's password. Useful
 * when SMTP rate-limits magic-link delivery or when you just want a stable
 * shared credential for a client. Generates a strong default password the
 * admin can copy and send.
 */
export function SetPasswordButton({ userId, userLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function generate() {
    // 12 chars, mix of letters + digits, no ambiguous chars
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const out: string[] = [];
    const buf = new Uint32Array(12);
    crypto.getRandomValues(buf);
    for (let i = 0; i < 12; i++) out.push(chars[buf[i] % chars.length]);
    setPassword(out.join(''));
    setError(null); setSuccess(false);
  }

  function save() {
    if (password.length < 8) { setError('סיסמה חייבת להיות באורך 8 תווים לפחות'); return; }
    startTransition(async () => {
      const result = await setUserPassword(userId, password);
      if (result.ok) { setSuccess(true); setError(null); }
      else { setError(result.error); }
    });
  }

  function copy() {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  function close() {
    setOpen(false);
    setPassword('');
    setError(null);
    setSuccess(false);
  }

  if (!open) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <KeyRound className="ms-1 h-3.5 w-3.5" />
        סיסמה
      </Button>
    );
  }

  return (
    <div className="mt-3 space-y-2 rounded-md border border-brand bg-brand/5 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-brand">
        <KeyRound className="h-3.5 w-3.5" />
        קביעת סיסמה ל-{userLabel}
      </div>

      <div className="flex gap-2">
        <Input value={password} dir="ltr" className="font-mono text-sm"
               placeholder="סיסמה (8+ תווים)"
               onChange={e => { setPassword(e.target.value); setError(null); setSuccess(false); }} />
        {password && (
          <Button type="button" variant="ghost" size="sm" onClick={copy} title="העתק">
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={generate}>
          הגרל סיסמה
        </Button>
        <Button type="button" variant="accent" size="sm" onClick={save}
                disabled={isPending || password.length < 8}>
          {isPending ? 'שומר...' : 'שמור סיסמה'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={close}>
          <X className="ms-1 h-3.5 w-3.5" />
          סגור
        </Button>
      </div>

      {error && (
        <p className="text-xs text-red-700">{error}</p>
      )}
      {success && (
        <p className="text-xs text-green-700">
          הסיסמה נשמרה. שלחו אותה למשתמש (יחד עם המייל) — הוא יתחבר ב-/sign-in עם אופציית &quot;סיסמה&quot;.
        </p>
      )}
    </div>
  );
}
