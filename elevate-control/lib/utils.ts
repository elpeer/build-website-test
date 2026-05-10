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
 * Hebrew → Latin transliteration map. Single-char (`ב` → `b`) values
 * go through translate(); multi-char values (`ש` → `sh`) get an
 * explicit replace pass first.
 *
 * ASCII-only slugs are required because Vercel's edge layer 404s on
 * URLs containing many non-ASCII bytes — see slugify().
 */
const HEBREW_MULTI: Record<string, string> = {
  'ש': 'sh', 'צ': 'ts', 'ץ': 'ts', 'ח': 'ch',
};
const HEBREW_SINGLE: Record<string, string> = {
  'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v',
  'ז': 'z', 'ט': 't', 'י': 'y', 'כ': 'k', 'ך': 'k', 'ל': 'l',
  'מ': 'm', 'ם': 'm', 'נ': 'n', 'ן': 'n', 'ס': 's', 'ע': 'a',
  'פ': 'p', 'ף': 'p', 'ק': 'k', 'ר': 'r', 'ת': 't',
};

/**
 * Slugify a Hebrew or English string for URLs / slugs. Output is
 * always ASCII (lowercase letters, digits, hyphen) — Hebrew chars get
 * transliterated; any other non-ASCII chars are stripped.
 */
export function slugify(input: string): string {
  let s = input.normalize('NFC').toLowerCase().trim();
  // Multi-char Hebrew first.
  for (const [he, lat] of Object.entries(HEBREW_MULTI)) {
    s = s.replaceAll(he, lat);
  }
  // Single-char Hebrew.
  s = Array.from(s)
    .map(c => HEBREW_SINGLE[c] ?? c)
    .join('');
  return s
    .replace(/[^a-z0-9\s-]/g, '')   // strip remaining non-ASCII (Arabic, Cyrillic, …)
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Normalize a slug coming from a dynamic route param so it matches
 *  what slugify() stored in the DB. Apply to every `params.slug`
 *  before using it in a Supabase `.eq('slug', …)` lookup. */
export function normalizeSlugParam(s: string): string {
  return s.normalize('NFC');
}

/** Return both Unicode normalization forms of a slug (NFC + NFD).
 *  Use with Supabase `.in('slug', slugLookupCandidates(s))` to find
 *  rows that were saved before slugify() started enforcing NFC. */
export function slugLookupCandidates(s: string): string[] {
  const nfc = s.normalize('NFC');
  const nfd = s.normalize('NFD');
  return nfc === nfd ? [nfc] : [nfc, nfd];
}
