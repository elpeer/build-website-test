# Project Overview Page (sitemap.html)

Every Elevate project should ship a **project-overview / design-system page** alongside the static HTML pages. It's an internal documentation artifact — branded with the client's identity, listing every page in the project organized by Pages and CPTs, with clickable previews to the actual HTML files.

It's the single place you point a new developer, a new content manager, or the client themselves to see "what's in this project." Reference implementation lives in `ninja-tours/sitemap.html`.

---

## What it is and why

- **Branded** with the client's logo, brand colors, and typography — feels like part of the project, not a generic developer tool
- **Organized** into clear sections: Brand Identity, Pages, Custom Post Types, System pages
- **Clickable** — every page card with a corresponding static HTML preview opens it in a new tab so the reader can immediately see what the page looks like
- **Bilingual** — Hebrew and English with a one-click toggle, so English-speaking developers on the team can read it without translation
- **Shareable in either language** via `?lang=en` URL parameter
- **Internal-only** — `<meta name="robots" content="noindex, nofollow">` so it never gets indexed
- **Self-contained** — single HTML file with inline CSS/JS, depends only on Google Fonts and the project logo. Anyone can open it locally without setting up the rest of the project.

---

## When to create it

**At project start**, after the brand has been defined and the rough page list is settled (even before the static HTML pages are built). A skeleton with placeholder cards is more useful than nothing — it forces alignment on what pages exist.

**Update it on every significant change:**
- New page added to the project → add a card
- Page removed → remove its card
- New CPT introduced → add a CPT wrapper section with its taxonomies
- Brand identity finalized/updated → refresh the palette and typography samples
- Static HTML preview created for a card that previously had no preview → add `data-preview="filename.html"` to that card so it becomes clickable

The page lives in the static HTML folder (`{client}/sitemap.html`) so it ships with the front-end deliverable, not the WordPress theme.

---

## Anatomy

Every project's `sitemap.html` follows the same six-section structure. Customize the content per project; keep the structure.

### 1. Hero (full-bleed, brand color background)
- **Brand block** (top-left in RTL): logo on cream rounded square + project name + tagline
- **Meta pills** (top-right in RTL): Version, Updated date, Status (Development / Live / Maintenance)
- **Eyebrow + headline + lead**: the page's title and one-paragraph description
- **Language toggle** (top-end corner): floating glass-style button with globe icon

### 2. Stats Strip (white bar, 4 columns)
- WP Pages count · Post Types count · Taxonomies count · Section Layouts count
- These numbers force you to keep the sitemap in sync with reality — when the count is wrong, the page is out of date

### 3. Brand Identity
- **Color palette**: 5 swatches (primary, accent, two backgrounds, text)
- **Typography**: two cards showing Hebrew + Latin samples with the actual fonts in use

### 4. Pages
- Grid of cards for every regular WordPress Page
- Each card: type badge (Page / Archive Page / Posts Page / Service Page), icon, title, URL path in `<code>`, short description, and a "Preview HTML" indicator if a static HTML file exists

### 5. Custom Post Types
- One **CPT wrapper** per post type, each containing:
  - Wrapper header: gradient icon + CPT name (English · Hebrew) + slug + taxonomies attached to it
  - Two child cards: **Main Page** (the editable archive Page) + **Single Template** (the per-post template)

### 6. System Pages & Templates
- 404, search, page templates, header/footer, single post, dispatcher
- These are theme files, not editable Pages — they're listed for completeness

### 7. Footer (brand color background)
- **Client block**: logo + project name + status line
- **Agency credit**: "Designed & Developed by **Elevate** Digital Studio"
- Bottom bar: "Internal project documentation · Not part of the public website" + the file path

---

## Required interactive features

These three features make the page functional, not just informational. Don't skip any.

### A. Language toggle (HE ⇄ EN)

- Floating button in the top-end corner of the hero with a globe icon
- Each translatable element wrapped in two siblings:
  ```html
  <span data-i18n="he">עברית</span>
  <span data-i18n="en">English</span>
  ```
- CSS hides the inactive language:
  ```css
  .lang-he [data-i18n="en"] { display: none !important; }
  .lang-en [data-i18n="he"] { display: none !important; }
  ```
- JS toggles `body.lang-he` ↔ `body.lang-en`, flips `<html dir>` and `<html lang>`, and persists in localStorage
- **URL parameter `?lang=en`** takes priority over localStorage on first load — this is essential for sharing a link with a non-Hebrew-speaking developer. The toggle also writes the chosen language back into the URL via `history.replaceState` so the URL bar always reflects the current state and can be copied.

### B. Sticky side TOC

- Fixed-position vertical nav on the inline-end side (left in RTL, right in LTR), vertically centered
- Lists section anchors: Brand · Pages · Post Types · System
- Active section highlights as the reader scrolls — implement via `IntersectionObserver` with `rootMargin: '-30% 0px -55% 0px'`
- Hide on viewports `< 1180px` (no room beside the centered content)

### C. Clickable cards with HTML preview

- Add `data-preview="filename.html"` on cards that have a corresponding static HTML file
- JS auto-injects a "Preview HTML" indicator at the bottom of each linkable card showing the file name
- Whole card opens the preview in a new tab (`target="_blank"`, `rel="noopener,noreferrer"`)
- Cards without a preview stay as `<article>` elements without `data-preview` and get a slight opacity reduction (`0.92`) to signal they aren't clickable

---

## Customization per project

Use the Ninja Tours `sitemap.html` as the canonical starting point. Per-project changes:

| What to swap                  | Where                                               |
|-------------------------------|-----------------------------------------------------|
| Logo                          | Hero `.hero__logo img src` + Footer `.footer__brand-logo img src` |
| Brand name + tagline          | Hero `.hero__brand-text`                            |
| Hero background color         | `.hero` background gradient (use brand primary)     |
| Brand colors in `:root`       | `--c-blue` (or rename to brand primary), `--c-red`, etc. — these are then used everywhere automatically |
| Hero h1 + lead text           | Both HE and EN spans                                |
| Stats numbers                 | `.stats__num` values × 4                            |
| Color palette swatches        | `.palette` — typically 5 swatches: primary, accent, two surfaces, text |
| Typography samples            | `.type-card .h-sample` and `.b-sample` — show the actual fonts the project uses |
| Pages list                    | `#pages .page-grid` — one card per Page, with `data-preview` if a static HTML exists |
| CPTs                          | `#cpts .cpt-wrap` — one wrapper per CPT, each with its taxonomies + main/single child cards |
| System list                   | `#system .page-grid` — adjust based on which template files exist |
| Footer client text            | `.footer__brand-text` — project name + year |

The structure (hero, stats, brand, pages, cpts, system, footer) and the interactive features (language toggle, side TOC, clickable cards, URL params) **stay the same**. They're what makes it a recognizable agency artifact.

---

## When to update — the maintenance checklist

Bake this into your workflow. Whenever you do any of the following, update `sitemap.html` in the same commit:

- [ ] Created a new static HTML page → add a card under Pages or System
- [ ] Created a new CPT → add a CPT wrapper with main + single + taxonomies
- [ ] Added a taxonomy to an existing CPT → update its `.cpt-wrap__taxonomies` list
- [ ] Removed/renamed a page → remove or rename its card; check the side TOC anchors still work
- [ ] Changed brand colors → update `:root` variables AND the swatch hex labels
- [ ] Changed typography → update the type-card samples + font import in `<head>`
- [ ] Added a new section layout to the WordPress theme → bump the "Section Layouts" stat number
- [ ] Created a static HTML preview for a card that previously had none → add `data-preview="..."` to that card

**Pro tip:** the stats numbers are an early-warning system. If the WP Pages count says 12 but you only see 11 cards, something's been forgotten.

---

## Why we ship this with every project

- **Onboarding:** A new developer opens `sitemap.html` and immediately knows what exists, what's editable in the admin, and what each page looks like via the previews.
- **Client confidence:** The client sees a polished, branded artifact (not a developer's plain text doc) that signals you took the project seriously.
- **Self-discipline:** The page forces you to keep an honest, current map of the project. When it's out of date, anyone looking at it notices.
- **Handoff:** When the project moves to maintenance or a different team picks it up, this page is the bridge. Pair it with the WordPress theme README and you've covered the documentation surface.

The reference implementation in `ninja-tours/sitemap.html` is ~1300 lines, single-file, with all CSS and JS inline. Copy it as the starting point and edit per the customization table above.
