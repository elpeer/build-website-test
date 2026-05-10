import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge tailwind classes with conflict resolution.
 * Use everywhere instead of string concatenation.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format an ISO date as a short Hebrew date string.
 */
export function formatDateHe(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a date as relative time in Hebrew (לפני שעה / אתמול / לפני 3 ימים).
 */
export function formatRelativeHe(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'עכשיו';
  if (minutes < 60) return `לפני ${minutes} דקות`;
  if (hours < 24) return `לפני ${hours} שעות`;
  if (days === 1) return 'אתמול';
  if (days < 30) return `לפני ${days} ימים`;
  return formatDateHe(iso);
}

/**
 * Slugify a Hebrew or English string for URLs / slugs.
 * Hebrew chars are kept (browsers handle them); spaces → hyphens.
 * Output is normalized to Unicode NFC so DB lookups round-trip
 * regardless of whether the input came from the keyboard or pasted
 * (browsers can deliver decomposed forms in some setups).
 */
export function slugify(input: string): string {
  return input
    .normalize('NFC')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/** Normalize a slug coming from a dynamic route param so it matches
 *  what slugify() stored in the DB. Apply to every `params.slug`
 *  before using it in a Supabase `.eq('slug', …)` lookup. */
export function normalizeSlugParam(s: string): string {
  return s.normalize('NFC');
}
