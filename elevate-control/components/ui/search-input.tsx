'use client';

import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

/**
 * Debounced search input. Local typing state stays snappy; the parent
 * onChange only fires after the user pauses (default 200ms).
 */
export function SearchInput({
  value, onChange, placeholder, debounceMs = 200, className,
}: Props) {
  const [local, setLocal] = useState(value);

  // Push local → parent after debounceMs
  useEffect(() => {
    if (local === value) return;
    const t = setTimeout(() => onChange(local), debounceMs);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  // External resets (e.g. parent clears) sync back
  useEffect(() => { if (value === '') setLocal(''); }, [value]);

  return (
    <div className={`relative ${className ?? ''}`}>
      <Search className="pointer-events-none absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-fg start-3" />
      <input
        type="search"
        value={local}
        onChange={e => setLocal(e.target.value)}
        placeholder={placeholder ?? 'חיפוש...'}
        className="block h-10 w-full rounded-md border border-border bg-background ps-9 pe-9 text-sm placeholder:text-muted-fg focus:border-brand focus:outline-none"
      />
      {local && (
        <button type="button"
                onClick={() => { setLocal(''); onChange(''); }}
                className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-fg hover:text-foreground"
                aria-label="נקה">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
