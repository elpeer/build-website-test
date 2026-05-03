# CSS Conventions Reference

This file documents the CSS architecture used across Elevate sites. The compiled `main.min.css` is the result of these source patterns going through SCSS + autoprefixer. When writing new CSS for an existing codebase, write the SCSS source — the build pipeline produces the minified output.

---

## Root sizing

```scss
:root {
  --header-height: 8rem;
  --header-height-mob: 3.75rem;
  --compensate-scroll-bar: 15px;
}

html {
  scroll-behavior: smooth;
  scroll-padding: 5.625rem 0 0 0;
  font-size: 0.83333vw; // 1rem ≈ 16px at 1920px viewport

  @media (max-width: 768px) and (orientation: portrait) {
    font-size: 4.10256vw; // 1rem ≈ 16px at 390px viewport
  }
}
```

Why fluid root font-size: it lets the entire layout scale with the viewport without media-query gymnastics. A `1.5rem` value scales linearly between mobile and desktop. Designers can use the Figma pixel value divided by 16 — e.g., 24px → `1.5rem`.

---

## Breakpoints

Two and only two:

```scss
// Desktop & tablet-landscape
@media (orientation: landscape), (min-width: 769px) and (orientation: portrait) { … }

// Mobile portrait
@media (max-width: 768px) and (orientation: portrait) { … }
```

Why this orientation-based pattern: an iPad in landscape is treated as desktop (1024×768 wide enough for the full layout); the same iPad rotated to portrait gets the mobile layout. This matches user expectations and avoids tablet-specific awkwardness.

Mobile-first vs desktop-first: the codebase mixes both, but the convention is **define the desktop layout outside any media query, then override for mobile**. This is because the desktop layout is the "designed" state and mobile overrides usually involve simpler stacking.

---

## BEM naming

```scss
.section-name {                       // block
  &__inner { … }                      // element
  &__inner-title { … }                // nested element (single dash chain)
  &__item { … }
  &__item-image { … }                 // NOT __item__image
  &.--variant { … }                   // modifier (apply as second class)
}
```

Hard rule: never double the `__` separator. `.minicart-wrapper__product-image` is correct, `.minicart-wrapper__product__image` is wrong.

Modifiers use double-dash prefix and are applied as a second class:

```html
<a class="btn --primary">…</a>
<div class="container --flex">…</div>
<div class="minicart-wrapper__total-row --discount">…</div>
```

In CSS:

```scss
.btn {
  &.--primary { … }
}
```

This avoids the SASS `&-modifier` interpolation and reads more naturally in the markup.

---

## Logical properties (RTL-aware)

Use these in place of left/right whenever the value should mirror in RTL:

| Don't write       | Write instead                                     |
|-------------------|---------------------------------------------------|
| `padding-left`    | `padding-inline-start` or `-webkit-padding-start` |
| `padding-right`   | `padding-inline-end` or `-webkit-padding-end`     |
| `margin-left`     | `margin-inline-start` / `-webkit-margin-start`    |
| `margin-right`    | `margin-inline-end` / `-webkit-margin-end`        |
| `border-left`     | `border-inline-start` / `-webkit-border-start`    |
| `border-right`    | `border-inline-end` / `-webkit-border-end`        |
| `left: 0`         | `inset-inline-start: 0`                           |
| `right: 0`        | `inset-inline-end: 0`                             |
| `text-align: left`| `text-align: start`                               |

Use `padding-inline` and `padding-block` (single shorthand) when both sides take the same value:

```scss
padding-inline: 1.5rem;        // horizontal
padding-block: 2rem 4rem;      // top, bottom
```

Exception: keep physical `left` / `right` when the element is genuinely LTR-only — e.g., an English logo ticker, a pagination arrow that always points the same direction regardless of language.

Vendor-prefix fallbacks: the codebase compiles with autoprefixer set to support older Safari, so you'll see `-webkit-margin-start` paired with `margin-inline-start`. When writing source SCSS, just write the modern logical property — autoprefixer adds the fallback.

---

## Spacing scale

There's no strict scale, but values cluster around these defaults:

- `0.25rem`, `0.375rem`, `0.5rem`, `0.625rem`, `0.75rem`, `0.875rem`, `1rem` — small gaps
- `1.25rem`, `1.5rem`, `1.75rem`, `2rem` — medium gaps
- `2.5rem`, `3rem`, `3.5rem`, `4rem` — section padding
- `5rem`, `6.25rem`, `7.5rem`, `8.75rem` — section vertical margin (`margin-block`)

Mobile sections typically use roughly half the desktop margin: `margin-block: 8.75rem` desktop → `margin-block: 4rem` mobile.

---

## Container

```scss
.container {
  width: 100%;
  position: relative;
  z-index: 5;

  @media (orientation: landscape), (min-width: 769px) and (orientation: portrait) {
    padding-inline: 3.5rem;
  }
  @media (max-width: 768px) and (orientation: portrait) {
    padding-inline: 1rem;
  }

  &.--flex {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  &.--row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
  }
}
```

Sections that need a narrower content column override `.container` padding inside their own scope rather than introducing a new wrapper:

```scss
.faq-page .container {
  padding-inline: 8.125rem;
}
```

---

## Buttons

```scss
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  justify-content: center;
  text-align: center;
  border-radius: 6.25rem;
  height: 3rem;
  padding-inline: 1.375rem 0.5rem;
  position: relative;

  i {
    font-size: 0.875rem;
    width: 2rem;
    height: 2rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #cdffc3;
    color: #6e6c71;
    z-index: 2;
    position: relative;
  }

  &.--primary {
    color: #fff;
    background: #b0b2b0;
    box-shadow: 0 1.5px 8px 0 rgba(0,0,0,.16);

    span { position: relative; z-index: 2; }

    @media (any-hover: hover) {
      &:hover {
        color: #6e6c71;
        background: #cdffc3;
      }
    }
  }
}
```

The trailing icon is part of the button — every button has one. If the design genuinely has no icon, use `<i class="icon__plus"></i>` as a default or override the `i` rule per-section.

`@media (any-hover: hover)` guards hover styles so they don't get stuck on touch devices.

---

## Icon font

The icomoon font is the project's icon source. To add a new icon:

1. Get the SVG from the designer or download from icomoon.io.
2. Open the project's icomoon configuration (the IcoMoon app, usually saved as a `selection.json` per project).
3. Import the SVG, name it (no spaces, lowercase, hyphenated), regenerate the font.
4. Replace the four files in `fonts/iconfont/` (`.ttf`, `.woff`, `.svg`, `.eot`).
5. Add a `.icon__name` rule with the matching `\eXXX` Unicode glyph.

```scss
.icon__new-icon::before { content: "\e90d"; }
```

Don't add `font-family` — the base `[class*=" icon__"], [class^=icon__]` selector handles that.

---

## Animations & motion

`transition: 0.5s ease all;` is the default site-wide for `<a>`, buttons, and inputs. Don't override unless the element genuinely needs a different timing.

For custom animations, use `@keyframes` and prefer `transform` and `opacity` (GPU-accelerated). Avoid animating `width`, `height`, `top`, `left`.

The site already includes:
- `rotation` — endless 360° spin (10s duration)
- `marquee` — horizontal scroll for ticker content (60s duration)
- `sweep` — clip-path reveal for the home-hero vertical line
- `fancybox-fadeIn` / `fancybox-fadeOut` / `fancybox-zoomInUp` etc. — Fancybox internals

---

## clip-path shapes

The codebase uses `clip-path` polygons for the curved-corner section shapes (video sections, hero overlay, reasons section). These are generated in Figma plugins and pasted in as-is. Don't try to hand-tune the polygon points — re-export from Figma if the shape changes.

Always pair clip-path sections with a fallback color (`background-color`) on the parent so older browsers without clip-path support still render something.

---

## Z-index scale

- 0–4: in-flow layering inside a section
- 5: `.container` (above section background, below floating UI)
- 10: section nav arrows, video progress overlays
- 20: section toolbars, sticky filters
- 100+: header (`1000`), modals (Fancybox: `1050+`)

Don't use values like `9999` — the existing scale handles every real case.

---

## Color palette (most-used)

These show up across nearly every project. When starting a new project, swap the accent and confirm with the designer:

| Use                  | Value      |
|----------------------|------------|
| Primary text         | `#6e6c71`  |
| Heading dark         | `#3f3e42`  |
| Background light     | `#f1f1f2`  |
| Border subtle        | `rgba(0,0,0,.08)` or `#c9c0b6` |
| Accent green         | `#cdffc3`  |
| CTA dark             | `#000` / `#020202` |
| Sale red             | `#c81d39`  |
| Discount green       | `#4c840b`  |

Don't hard-code these in component CSS — use SCSS variables (or CSS custom properties at `:root`) so the per-project theme stays in one place.

---

## Hover states & focus rings

```scss
@media (any-hover: hover) {
  .link:hover span { text-decoration: none; }
}

a:focus-visible,
button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
```

Always provide a visible focus indicator. The Israeli accessibility standard requires it. Don't `outline: none` without a replacement.

---

## Responsive images

Use `aspect-ratio` to reserve space and prevent CLS:

```scss
.product-slide__image {
  aspect-ratio: 487 / 544;
  border-radius: 5rem;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: 0.5s ease;
  }
}
```

For art-directed mobile crops, use `<picture>` with a `<source>` (see `references/html-structure.md`).

---

## Source organization (when writing SCSS)

The file structure of the SCSS source typically mirrors:

```
scss/
├── main.scss              // imports everything
├── base/
│   ├── reset.scss
│   ├── fonts.scss
│   ├── icons.scss
│   └── typography.scss
├── components/
│   ├── btn.scss
│   ├── form.scss
│   ├── slider.scss
│   ├── header.scss
│   ├── footer.scss
│   ├── minicart.scss
│   └── product-slide.scss
├── sections/
│   ├── home-hero.scss
│   ├── features.scss
│   ├── products-slider.scss
│   └── … (one per section)
└── pages/
    ├── product-page.scss
    ├── checkout.scss
    └── account.scss
```

When adding a section, create a new file under `sections/` and `@import` it from `main.scss`. Don't pile new rules into existing sections' files unless they're modifications to that section.
