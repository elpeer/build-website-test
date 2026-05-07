# Israeli Accessibility Reference

Israeli law requires public-facing websites to comply with תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), based on WCAG 2.0 / 2.1 Level AA, plus a few local additions. Government enforcement is real — fines for non-compliance start at ₪10,000–50,000 and class-action lawsuits over inaccessible sites have become common. Every site Elevate ships must meet this baseline.

---

## What every page must include

### 1. `<html lang="he">` (or `ar` / `en`)

Screen readers use this to choose pronunciation. Don't omit it.

### 2. `<title>` describing the page

Each page has a unique, descriptive `<title>` — not "דף הבית" on every page. Format: `Page Name | Site Name`.

### 3. Skip link

```html
<body>
  <a href="#main-content" class="skip-link">דלג לתוכן הראשי</a>
  …
</body>
```

```scss
.skip-link {
  position: absolute;
  top: -40px;
  inset-inline-start: 0;
  background: #000;
  color: #fff;
  padding: 0.5rem 1rem;
  z-index: 10001;
  &:focus {
    top: 0;
  }
}
```

The skip link must be the first focusable element on the page. Hide visually until focused.

### 4. Single `<main id="main-content">` per page

The skip-link target. Place after the header.

### 5. Alt text on images

- Decorative images (gradients, dividers, hero overlays): `alt=""`. Empty alt tells screen readers to skip.
- Content images (product photos, infographics, team portraits): meaningful `alt` describing what's depicted.
- Logo: `alt="Site Name"` (the name, not "logo").
- Image inside a link: alt describes the link destination, not the image itself.

### 6. ARIA labels on icon-only controls

Every button or link with no visible text needs an `aria-label`:

```html
<a href="#minicart" data-fancybox class="cart-btn" aria-label="צפייה בעגלה">
  <span id="productCount">0</span>
  <i class="icon__bag"></i>
</a>

<button class="burger-btn" aria-label="פתיחת תפריט">…</button>

<a href="#" aria-label="אינסטגרם"><img src="img/icons/instagram.svg" alt=""></a>
```

The `<img>` inside the social link gets `alt=""` because the `aria-label` already describes the link — duplicate text would create redundant announcements.

### 7. Visible focus indicators

Every interactive element must have a visible focus state. Don't `outline: none` without a replacement.

```scss
a:focus-visible,
button:focus-visible,
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
  border-radius: 4px;
}
```

Use `:focus-visible` (not `:focus`) so the outline appears for keyboard users but not on click — better UX without sacrificing accessibility.

### 8. Form labels

Every input needs a `<label for="…">`. Placeholder text is NOT a label.

```html
<!-- correct -->
<label for="contact-email">אימייל</label>
<input type="email" id="contact-email" name="email" required>

<!-- correct alternative when the design hides the label -->
<label for="search" class="visually-hidden">חיפוש</label>
<input type="search" id="search" placeholder="חפשו…">
```

Required fields: `required` attribute + visual indicator (asterisk or "שדה חובה" text). Don't rely on color alone.

Error messages must be associated with the input via `aria-describedby`:

```html
<label for="contact-email">אימייל</label>
<input type="email" id="contact-email" aria-describedby="email-error" aria-invalid="true">
<p id="email-error" class="error-message">כתובת אימייל לא תקינה</p>
```

### 9. Color contrast

Minimum ratios per WCAG AA:
- Normal text: 4.5:1
- Large text (≥18pt or ≥14pt bold): 3:1
- UI components and graphical objects: 3:1

Test with Chrome DevTools' contrast checker or the WebAIM contrast checker. The agency's typical body text (`#6e6c71` on white) measures ~5.05:1 — fine. Light grey on white (`#c9c0b6` on `#fff`) measures ~2.5:1 — fails. Don't use light grey for any actual content text, only for borders and decorative elements.

### 10. No fixed `maximum-scale=1` blocking pinch-zoom (debatable)

WCAG 1.4.4 says users must be able to scale text up to 200%. The codebase's current `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />` blocks pinch-zoom. The agency has decided this is acceptable because the layout is fluid and scales with viewport width. If a client requests strict WCAG compliance, remove the `maximum-scale=1`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### 11. Headings hierarchy

One `<h1>` per page. Heading levels can't skip — `<h2>` follows `<h1>`, `<h3>` follows `<h2>`. Don't pick a heading level for visual sizing — pick it for semantic meaning, then style with classes.

If the design needs visually-large text that isn't a heading, use a `<p>` or `<div>` with a class.

### 12. Landmarks

Use semantic landmark elements: `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`. Each `<nav>` should have an `aria-label` if there are multiple on the page:

```html
<nav class="main-menu" aria-label="תפריט ראשי">…</nav>
<nav class="breadcrumbs" aria-label="ניווט">…</nav>
<nav class="footer-menus__items" aria-label="תפריט תחתון">…</nav>
```

### 13. Hreflang for multilingual sites

Sites with Hebrew + Arabic + English versions:

```html
<link rel="alternate" hreflang="he" href="https://example.co.il/" />
<link rel="alternate" hreflang="ar" href="https://example.co.il/ar/" />
<link rel="alternate" hreflang="en" href="https://example.co.il/en/" />
<link rel="alternate" hreflang="x-default" href="https://example.co.il/" />
```

Polylang in WordPress generates these automatically — but verify they're rendered.

---

## Required pages

Every Israeli e-commerce site must have these:

- **הצהרת נגישות** (`/accessibility/`) — explains the site's accessibility commitment, who to contact for accessibility issues, and notes any known limitations. The agency has a template; ask before each new project.
- **תקנון** (`/terms/`)
- **מדיניות פרטיות** (`/privacy/`)
- **ביטול עסקה** (`/cancellation/`)
- **משלוחים** (`/shipping/`)
- **החזרות והחלפות** (`/returns/`)

The footer must link to all of these.

---

## Accessibility widget (פלאגין נגישות)

Most Israeli clients install one of these accessibility widgets:

- **Equally AI** (most common in our projects)
- **UserWay**
- **accessiBe** (controversial — sites still get sued despite using it)
- **Negishut.com**

The widget injects a floating button that opens controls for: text size, contrast, link highlighting, animation pause, screen-reader optimization, etc. Don't write a custom one — use the third-party widget.

The widget's script tag goes right before `</body>`:

```html
<script src="https://cdn.equally.ai/equally.js" data-key="…"></script>
```

The widget does NOT replace the manual accessibility work above. It's an aid for users; the underlying HTML still needs to be accessible.

---

## SEO + accessibility overlap

Several practices serve both:

- Semantic HTML (one `<h1>`, `<nav>`, `<main>`, etc.) — search engines and screen readers both rely on it.
- `alt` text on images — accessibility requirement, also Image SEO.
- Descriptive link text — "קרא עוד על המחקר" beats "קרא עוד" alone, both for screen readers and for Google.
- Structured data (Schema.org JSON-LD) — Google rich snippets, also helps assistive tech.
- Page titles and meta descriptions — accessibility (orientation), SEO (snippet).

For e-commerce, add Product structured data:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "UltraCal",
  "image": "https://example.co.il/img/ultracal.jpg",
  "description": "תיאור המוצר",
  "brand": { "@type": "Brand", "name": "Biomind" },
  "offers": {
    "@type": "Offer",
    "url": "https://example.co.il/product/ultracal",
    "priceCurrency": "ILS",
    "price": "199.00",
    "availability": "https://schema.org/InStock"
  }
}
</script>
```

For breadcrumbs, add `BreadcrumbList`. For the org page, add `Organization`. For posts, `Article` with author / datePublished.

---

## Pre-launch checklist

Before any site goes live, run through this list:

- [ ] `<html lang>` is set on every page
- [ ] Each page has a unique, descriptive `<title>` and `<meta name="description">`
- [ ] One `<h1>` per page, headings don't skip levels
- [ ] All images have `alt` (empty for decorative, meaningful for content)
- [ ] All icon-only buttons/links have `aria-label`
- [ ] All form inputs have `<label for>` (or `visually-hidden` label)
- [ ] All interactive elements have visible `:focus-visible` state
- [ ] Skip link present and works
- [ ] Color contrast passes WCAG AA on all text
- [ ] Site is fully keyboard-navigable (tab through every interactive element, no traps)
- [ ] Screen-reader test (NVDA on Windows or VoiceOver on Mac) on home + product + checkout
- [ ] Accessibility statement page exists and is linked from footer
- [ ] Required legal pages exist and are linked from footer
- [ ] `prefers-reduced-motion` respected (AOS does this; custom animations should too)
- [ ] Forms validate inline with `aria-invalid` and `aria-describedby` on errors
- [ ] WCAG-checking tool clean: Lighthouse Accessibility ≥ 95, axe DevTools 0 violations
- [ ] Equally / UserWay / chosen widget installed and configured

---

## Reduced motion

```scss
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Add this to the base CSS. It overrides the site's transitions for users who've requested less motion (vestibular disorders, motion sickness).

AOS already disables itself when `prefers-reduced-motion: reduce` is set. Custom JS animations should check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` and skip the animation.
