---
name: elevate-website-builder
description: "Build front-end HTML/CSS/JS for Elevate Digital Studio client sites, translating design references into production code that follows agency conventions and visual taste. Covers RTL Hebrew/Arabic, BEM, Swiper sliders, AOS, Fancybox, jQuery, mini-cart, Israeli WCAG, WordPress (ACF, Polylang, WooCommerce). The skill captures the agency's distinctive visual language — oversized typography, asymmetric layouts, ghost text, glow cards, depth carousels, photo collages, mixed-script headlines — so output looks distinct, not templated. Trigger when the user asks for a new page, section, hero, slider, modal, mini-cart, or checkout, pastes Elevate markup for edits, or provides any design reference (image, Figma, screenshot, mood board) and asks for HTML/CSS/JS. Cues even without the word Elevate: Hebrew/Arabic content, dir=rtl, BEM double-underscore, .icon__ font, .btn.--primary, AOS attributes, Swiper .default-slider, sites like biomind, hefestus, young, uzramed, honda, xelerate."
---

# Elevate Website Builder

This skill captures Elevate Digital Studio's front-end coding conventions AND visual taste. Use both layers — the conventions ensure output drops cleanly into the existing codebase; the taste rules ensure output doesn't look generic.

The skill is organized in eight reference files. Read whichever match the task.

## How to use this skill

**For a new section or page from a design reference (the most common case):**
1. Read `references/design-system.md` first — identify the visual mode (A/B/C) and the key devices the reference uses.
2. Read `references/section-recipes.md` — find the closest archetype.
3. Read `references/html-structure.md` for the section anatomy and component patterns.
4. Read `references/css-conventions.md` for sizing, breakpoints, RTL handling.
5. Read `references/js-patterns.md` only if the section needs custom interaction beyond the existing helpers (sliders, accordions, modals are already covered).

**For a quick edit on existing markup:**
- Read `html-structure.md` and `css-conventions.md` — usually enough.

**For accessibility audit or Israeli compliance work:**
- Read `accessibility-il.md`.

**For converting static markup into a WordPress theme:**
- Read `wordpress-adaptation.md`.

**At project start, OR whenever the page list / brand changes:**
- Read `project-overview-page.md`. Every project ships a branded `sitemap.html` (project overview / design-system page) under the static HTML folder. Create or update it whenever pages are added, removed, restructured, or rebranded. **This is a maintenance obligation, not a one-time deliverable** — agents working on a project should proactively update the sitemap whenever they touch the page list.

The eight reference files:

- `references/design-system.md` — Visual taste rules: the three modes (Bright/Friendly, Dark/Luxury, Bold/Sport), typography systems, color systems, motion, the "broken element" rule, anti-patterns, and how to read a design reference.
- `references/section-recipes.md` — Twelve high-impact section archetypes pulled from real agency references (Honda, Hefestus, Mitsubishi, Young, Tali Meir Pick, Uzramed, Xelerate, Biomind). Each with markup, CSS, and what makes it not-templated.
- `references/html-structure.md` — Page skeleton, header, footer, hero variants, product slider, video sections, mini-cart, accordion, forms, breadcrumbs, editor area, utility classes.
- `references/css-conventions.md` — Fluid root font-size, BEM rules, RTL logical properties, container, buttons, icon font, animations, color palette, focus rings.
- `references/js-patterns.md` — IIFE wrapper, Swiper auto-init via data attributes, dual sliders, video progress, Fancybox, AOS, header sticky, mobile menu, accordion, filterItems, TOC, slide-toggle.
- `references/accessibility-il.md` — Israeli WCAG requirements, required pages, color contrast, focus rings, reduced motion, pre-launch checklist, accessibility widget.
- `references/wordpress-adaptation.md` — Theme file structure, header.php / footer.php / functions.php, ACF flexible-content page builder, WooCommerce overrides, Polylang.
- `references/project-overview-page.md` — Branded `sitemap.html` artifact every project ships: hero, brand identity (palette + typography), Pages grid, CPT wrappers, System pages, footer with agency credit. Includes language toggle (HE/EN) with `?lang=` URL param, sticky side TOC, and clickable cards that open the static HTML preview.

---

## Workflow when the user provides a design reference

This is the workflow that produces output the user will actually be proud of.

**Step 1 — Read the reference.** If the user uploads images, links to a Figma, or describes a design, look at it carefully. Open `references/design-system.md` and:
- Identify the mode (A/B/C) using the questions in that file.
- Identify the typography pairing and color palette.
- Identify the "broken element" — what's escaping the grid?
- Identify the dominant shape language (pill / soft-rect / sharp / clip-path).

**Step 2 — Match an archetype.** Open `references/section-recipes.md` and find the closest of the twelve archetypes. Most real-world requests fit one of these or a combination of two.

**Step 3 — Confirm with the user before coding (when the brief is ambiguous).** A short check-in is faster than a long rewrite:

> "Reading the reference as Mode B (dark/luxury) with a centerpiece + floating-elements hero (recipe #2). Type pairing looks like Heebo + Inter. Single accent color cyan/electric-blue. Plan: build the hero as recipe #2, then the cards section as recipe #5 (glow cards). Confirm or adjust?"

If the request is clear, skip the check-in and just build.

**Step 4 — Build using Elevate conventions.** The visual personality lives in *what* gets built (recipe choice + the broken element + signature touches). The class taxonomy, BEM naming, breakpoint pattern, and RTL handling stay consistent with the rest of the codebase regardless of the design's mood.

**Step 5 — Add the signature touch.** Every output should have at least one of: micro-animation, ghost text overlay, decorative SVG accent, photo-collage offset block, oversized stat, mixed-script headline, stamp badge, or asymmetric grid break. One per section, no more than two per page. This is what makes the difference between "fine" and "wow."

**Step 6 — Output.** Per the user's preferences: full working code first, 1–3 sentences max about what it does and any gotchas. Don't over-explain.

**Step 7 — Update the project overview page.** If the change you just made adds, removes, renames, or restructures a page, OR changes brand identity (colors, typography, logo), update `{client}/sitemap.html` in the same commit. See `references/project-overview-page.md` for the structure and the customization checklist. The stats numbers at the top (WP Pages / CPTs / Taxonomies / Sections) are the early-warning system — if they're wrong, the page is stale.

---

## Project lifecycle obligations

These artifacts must exist for every project and stay current:

1. **Static HTML pages** in `{client}/*.html` — the design deliverables
2. **Branded `sitemap.html`** under the same folder — the project overview / design-system page (see `references/project-overview-page.md`). Update on every page-list change.
3. **WordPress theme** (when the brief includes WP) at `wp-theme/{client}-theme/` — the production implementation
4. **Theme README** at `wp-theme/{client}-theme/README.md` — installation + maintenance notes

When the user asks to add a page, build a section, or rebrand — proactively update items 2 (always) and 4 (when relevant) without being asked.

---

## Defaults that apply to every output

These are non-negotiable and apply unless the user explicitly overrides them:

1. **Direction is `dir="rtl"`** on `<html>` for Hebrew/Arabic sites. Inside RTL pages, sliders that should flow LTR (testimonial sliders, English logos, etc.) get `dir="ltr"` on the slider container itself — never on the page.

2. **All measurements in `rem`**, never `px`, except for hairlines (`1px` borders) and SVG attributes. The root `font-size` is set to `0.83333vw` desktop and `4.10256vw` mobile so that `1rem ≈ 16px` at the 1920px reference viewport. This means values like `1.5rem`, `0.875rem`, `3.75rem` map directly to the Figma pixel values.

3. **BEM naming with double underscore for elements and double dash for modifiers**:
   - `.section-name` (block)
   - `.section-name__element` (element)
   - `.section-name__element-subelement` (nested elements — chain with single dashes, NOT another `__`)
   - `.btn.--primary` (modifier — double-dash prefix, applied as a second class)

4. **Two breakpoints only**, written exactly this way:
   - Desktop & tablet-landscape: `@media (orientation: landscape), (min-width: 769px) and (orientation: portrait)`
   - Mobile portrait: `@media (max-width: 768px) and (orientation: portrait)`
   - Do not introduce a third breakpoint unless the user asks for one.

5. **RTL-aware logical properties**. Use `inset-inline-start`, `inset-inline-end`, `padding-inline`, `padding-block`, `margin-inline-start`, `-webkit-margin-start` (with the logical fallback), `-webkit-border-end`. Never write `left` / `right` / `padding-left` for layout positioning — only for absolutely-positioned LTR-only elements like English ticker text.

6. **Icon font for icons**: `<i class="icon__bag"></i>`, `<i class="icon__arrow-left"></i>`. Inline SVG only when the icon is not in the icomoon set (e.g., custom payment icons, complex illustrations, social media glyphs in the footer).

7. **Images**: Use `<picture>` with `<source>` for art-direction (different mobile crop) and a single `<img>` fallback. Always include `alt`, even if empty (`alt=""`) for decorative images. For hero images, no lazy loading; for everything below the fold, no explicit attribute is needed — the WordPress side will inject `loading="lazy"`.

8. **jQuery is loaded globally**. New JS goes inside the existing IIFE: `(function ($) { $(document).ready(function () { ... }); })(jQuery);`. Avoid introducing modern frameworks unless the user explicitly asks.

9. **Sliders use Swiper** via the `.default-slider` initializer (auto-detected from data attributes) or the `.main-slider` + `.secondary-slider` dual-slider pattern. See `references/js-patterns.md`.

10. **Modals use Fancybox** — bound automatically to `[data-fancybox]`. The mini-cart, video lightboxes, and product element popups all use this.

11. **Animations use AOS** with anchor-scoped `data-aos-anchor="#section-id"` and staggered `data-aos-delay="100|200|300|400"`.

---

## Output format

When asked to produce a section or page:

1. Output a single fenced HTML block containing the section markup. Match indentation (2 spaces) and the existing class taxonomy.
2. If the request adds new CSS, output a second fenced block with SCSS-style nesting. Don't pre-minify and don't include vendor prefixes — the build pipeline runs autoprefixer. Use the same naming and breakpoint pattern as the rest of the codebase.
3. If new JS is needed, add it inside the IIFE block, calling existing helper functions (`accordionInit`, `initSlideToggles`, `defaultSliders`, `filterItems`, `initTableOfContents`) where they fit instead of writing custom equivalents.
4. Keep the response concise per the user's preferences: full working code first, then 1–3 sentences max about what it does and any gotchas. No long tutorials.

When asked to adapt to WordPress, follow the steps in `references/wordpress-adaptation.md` — split into header.php / footer.php / template-parts, convert hard-coded text to `<?php the_field('field_name'); ?>` or ACF flexible-content loops, swap `<a href="#">` to `<?php echo esc_url(get_permalink()); ?>` etc.

---

## Section anatomy template

Every content section follows this skeleton. Always preserve the order and the data-attribute pattern:

```html
<section class="section-name" id="section-name">
  <div class="container">
    <h2 class="section-title" data-aos="fade-up" data-aos-delay="100" data-aos-anchor="#section-name">
      Section heading
    </h2>
    <div class="section-name__inner" data-aos="fade-up" data-aos-delay="200" data-aos-anchor="#section-name">
      <!-- content -->
    </div>
  </div>
</section>
```

Notes:
- `id` matches the class name. AOS anchors all child elements to this id so they animate together when the section enters the viewport.
- `.container` provides the horizontal padding (`3.5rem` desktop, `1rem` mobile). Use `.container.--flex` or `.container.--row` modifiers when the immediate child layout needs flex.
- `.section-title` is the standard h2 style (`3.75rem` desktop, `1.75rem` mobile, color `#3f3e42`).
- `__inner` is the conventional name for the section's primary content wrapper.

---

## Common components — quick reference

These are the building blocks that appear across nearly every site. Full markup in `references/html-structure.md`.

- **Buttons**: `<a class="btn --primary"><span>Label</span><i class="icon__plus"></i></a>` — the `<span>` and trailing `<i>` are always present, even when the icon isn't decorative; the CSS expects them.
- **Links with arrow**: `<a class="link"><span>Label</span><i class="icon__arrow-left"></i></a>`
- **Plus button (accordion toggle)**: `<button class="plus-btn"></button>` — the `::before` and `::after` pseudo-elements draw the cross.
- **Product card**: `.product-slide` with `__image`, `__label`, `__text`, `__title`. See html-structure reference.
- **Mini cart**: `.minicart-wrapper` with `__cta`, `__header`, `__products`, `__related`, `__total`, `__submit`. Bound to a `[data-fancybox]` trigger with `id="minicart"`.
- **Default slider**: `<div class="default-slider"><div class="swiper-wrapper">…</div><div class="btns"><button class="swiper-btn-prev default-prev">…</button><button class="swiper-btn-next default-next">…</button></div></div>`. Data attributes: `data-initial`, `data-loop`, `data-autoplay`, `data-speed`, `data-duration`, `data-effect`, `data-offset`, `data-video-progress`.
- **Accordion**: `.accordion-item` containing `.accordion-item__head` (with `.plus-btn`) and `.accordion-item__body`. Init via `accordionInit('.accordion-item', '.accordion-item__head')`.
- **Editor area** (rich text from CMS): wrap user-editable content in `<div class="editor-area">`. CSS handles list, link, and heading styles inside it.

---

## When the user asks something the skill doesn't cover

If the user asks for a pattern not in any reference (e.g., a new type of widget, a 3D viewer, a calendar), match the existing visual language: same breakpoint pattern, same BEM rules, same RTL handling, same icon font, same data-aos pattern. Then ask whether they want it added to the skill for future reuse.

If the user pastes a competitor's code or a library's example and asks to integrate it, rewrite the markup into Elevate's BEM conventions before adding it — don't drop in foreign class names like `.flex`, `.grid-cols-3`, or utility-first classes from Tailwind.
