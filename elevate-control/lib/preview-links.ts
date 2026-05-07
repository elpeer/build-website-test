/**
 * Map a page slug to a preview URL by examining the file paths in the
 * project's html folder. Tries common conventions:
 *   <slug>.html              → /<slug>.html (or /<slug> if Vercel cleans)
 *   <slug>/index.html        → /<slug>/
 *   <slug>/<slug>.html       → /<slug>/<slug>.html
 *   home → index.html        → / (special-case for home)
 */

export interface PreviewInfo {
  status: 'found' | 'missing';
  matchedFile: string | null;     // relative to html_path
  previewUrl: string | null;      // absolute Vercel URL
  expectedFiles: string[];        // candidate filenames we tried (for the warning)
}

const HOME_SLUGS = ['home', 'index', 'דף-הבית', 'הבית'];

export function findPagePreview(
  files: string[],          // relative paths inside html_path
  pageSlug: string,
  vercelUrl: string | null,
): PreviewInfo {
  const slug = pageSlug.toLowerCase();
  const fileSet = new Set(files);

  // Home page is special — it usually maps to /index.html, not /home.html
  const isHome = HOME_SLUGS.includes(slug);

  const candidates = isHome
    ? ['index.html', `${slug}.html`, `${slug}/index.html`]
    : [`${slug}.html`, `${slug}/index.html`, `${slug}/${slug}.html`];

  let matched: string | null = null;
  for (const c of candidates) {
    if (fileSet.has(c)) { matched = c; break; }
  }

  if (!matched || !vercelUrl) {
    return { status: matched ? 'found' : 'missing', matchedFile: matched, previewUrl: null, expectedFiles: candidates };
  }

  const base = vercelUrl.replace(/\/+$/, '');

  let pathPart: string;
  if (matched.endsWith('/index.html')) {
    pathPart = matched.replace(/index\.html$/, '');
  } else {
    pathPart = matched;
  }
  const url = `${base}/${pathPart}`.replace(/\/+$/, '/'); // collapse trailing slashes
  // For an index.html match without slug (home), we want just base + '/'
  const finalUrl = isHome && matched === 'index.html' ? `${base}/` : url;

  return { status: 'found', matchedFile: matched, previewUrl: finalUrl, expectedFiles: candidates };
}
