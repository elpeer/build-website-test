# Design System & Visual Taste Reference

This file is the difference between "another templated WordPress site" and an Elevate-quality build. It captures the agency's visual taste — what makes their work look distinct rather than generic. Read this whenever the user provides a design reference, asks for a "wow" or "premium" or "non-templated" output, or when you sense the default markup will produce something forgettable.

The conventions in `html-structure.md` and `css-conventions.md` cover *how* to code; this file covers *what* to code so the result has personality.

---

## The three modes the agency works in

Every project lives somewhere in one of these three modes. Identify the mode first, before writing any markup. Mixing modes mid-project is the fastest route to a generic-looking site.

### Mode A — Bright / Friendly / Editorial

References: Young Agency, Uzramed, Tali Meir Pick.

Visual signature: cream / pastel pink / off-white backgrounds, generous whitespace, mixed serif+sans+script type, soft drop-shadows, rounded-pill UI, friendly portrait photography, decorative SVG illustration accents, color-accented words in headings (one word in pink/red against black).

Use when: lifestyle, wellness, beauty, agency/services, real estate (luxury residential), interior design, creative-industry B2B.

### Mode B — Dark / Luxury / Cinematic

References: Mitsubishi-Niso (NISO Group), Hefestus, Biomind hero overlays.

Visual signature: near-black backgrounds (`#0a0a0c` to `#1a1a1e`), glowing radial light effects behind headlines, oversized statistic numerals (100+ rem), grid of dark gradient cards with photographic content + glow accents per card, fine type with high tracking, single accent color appearing sparingly (red, electric blue, cyan, magenta, gold), product/equipment photography that looks editorially shot, page-bottom oversized text that gets clipped.

Use when: technology, industrial / B2B premium, automotive luxury, HVAC / engineering, hospitality high-end, finance.

### Mode C — Bold / Sport / Energetic

References: Honda (all properties — Bikes, Merch, Catalog), Young Agency hero.

Visual signature: high-contrast photography (motorcycles in motion, athletes, action), heavy red accent (`#e60000` family), torn-paper / grunge clip-path section breaks, oversized white-on-photo headlines often offset to one side, ALL-CAPS English headings mixed with Hebrew sub-titles, motion-blur / depth-of-field imagery, banded color section breaks (full-width red strip with form inside).

Use when: automotive, sports / fitness, beverage, fast-moving consumer goods, motorcycles, performance brands, gaming.

---

## How to identify the mode from a reference

When the user uploads or links a design reference, ask these questions in order — the first "yes" tells you the mode:

1. Is the dominant background dark (closer to black than white)? → **Mode B**.
2. Is the photography high-contrast / motion-blurred / sport-action? Are there torn-paper edges or red banded sections? → **Mode C**.
3. Otherwise → **Mode A** (the default for most agency / wellness / lifestyle / e-commerce projects).

If the reference mixes signals (a dark hero followed by a light body), the body color wins — heroes can be moody without committing the whole site to Mode B.

---

## Universal taste rules (apply in all modes)

These are the rules that separate Elevate work from generic WordPress sites, regardless of mode.

### 1. Every page has at least one "broken" element

A "broken" element is something that breaks the predictable grid: a photo overflowing its container, a headline crossing onto an image, an asymmetric stat overshooting the column, a card escaping its row.

Examples from the references:
- Honda CBR ghost text "CBR 1000 RR-R" overlapping the motorcycle product photo.
- Hefestus oversized "Automation" text clipping below the page edge.
- Mitsubishi "104" filling half the screen with no surrounding container.
- Young agency phone mockup with floating UI cards bleeding outside the photo bounds.

Rule: at least one per page, never more than two — scarcity makes the broken element feel intentional rather than chaotic.

How to implement: position the element absolutely, give it a generous negative margin, set a higher z-index than its siblings. Don't try to fit it inside the grid's column count — the whole point is that it doesn't fit.

### 2. Typography hierarchy uses three sizes, not five

Look at the reference: there's typically one massive size (hero/section title), one medium (subheading or stat), and one body. Don't sprinkle h3, h4, h5 with subtle 2px size differences. Use weight, color, or capitalization to differentiate within a level instead.

Massive sizes that the references actually use:
- Section titles: `3.75rem` to `5rem` desktop, `1.75rem` to `2.5rem` mobile
- Hero h1: `5rem` to `8rem` desktop (some go bigger), `2rem` to `3rem` mobile
- Statistical/display numbers: `12rem` to `25rem` desktop ("104" reaches the latter)
- Body text: `1rem` to `1.25rem`

### 3. Color the key word, not the whole sentence

When a heading needs emphasis, color one or two words — not the whole heading.

Examples:
- "Meet our **team**" — "team" in red, rest in black.
- "Good brand's starts with powerful **marketing**." — "marketing" in red.
- "Start **Now**" — "Now" in blue accent.
- "Tailored **Excellence**" — "Excellence" in subtle red.
- "Ride **Red** Ride **Honda**" — repeated red emphasis.

The colored word can also use a different font (script vs sans is a common pairing — see Young's "team" vs the rest of "Meet our team").

```html
<h2 class="section-title">
  Meet our <span class="--accent --script">team</span>
</h2>
```

```scss
.section-title {
  .--accent { color: var(--brand-accent); }
  .--script { font-family: 'Playfair Display', serif; font-style: italic; }
}
```

### 4. One photo treatment per project

Pick one and stick with it across the entire site:

- **Editorial portrait** — clean studio lighting, neutral backgrounds, slight grain. (Tali Meir Pick, Uzramed.)
- **Action / motion** — motion blur, mid-action capture, dramatic lighting. (Honda.)
- **Product on infinity background** — clean cyc, soft shadows, often paired with ghost type. (Honda CBR product detail.)
- **Lifestyle / aspirational** — people in environment, warm tones, candid feel. (Honda merch, Uzramed.)
- **Industrial / equipment hero shots** — moody lighting, glow accents on metal, often macro detail. (Hefestus, Mitsubishi.)
- **Custom illustration** — flat or semi-flat vector with a unique style. (Young agency illustrations.)

Mixing treatments looks unfocused. If the brand has one product/object, photograph it consistently and reuse the asset across sections.

### 5. The hero earns the rest of the page

The hero must commit to one strong device. The rest of the page can be calmer.

Strong hero devices in the references:
- Massive type with a single dramatic photo (Honda Bikes, Hefestus, Mitsubishi).
- Centerpiece object surrounded by floating UI/illustration (Young phone, Tali Meir circle stages).
- Three-portrait composition with offset headline (Honda Merch).
- Ghost type behind product with negative space dominant (Honda CBR detail page).
- Video background with subtle UI overlay (Hefestus full hero).

The hero is *not* the place for: a centered headline + centered button + centered subhead in an ordinary container. That's the WordPress default — avoid it.

### 6. Whitespace is a layout element, not leftover space

Look at Tali Meir Pick — the white space between sections is as carefully measured as the content. Sections breathe. A 8-rem-bottom-margin is the floor for desktop section spacing; 12-16rem is normal for premium projects.

Mobile compresses this to roughly 40-50% of desktop, but don't go below `3rem` between major sections.

Rule: if the design feels cramped, the answer is usually "more vertical space," not "smaller text" or "more columns."

### 7. Layouts are asymmetric

The agency's site grids are rarely 50/50 or 33/33/33. Look at Tali Meir's services section: image on the left is narrower than the content on the right, and a circular badge breaks out to the left of the image. Look at Honda Bikes' community section: the photo collage is offset and one block holds a quote on a red background.

Default to: 40/60, 35/65, 30/70 — and break the grid with one offset element.

### 8. Use a single signature shape

Pick one shape and reuse it across the site as a visual signature:

- **Pill** (height = full-radius): buttons, tags, navigation chips. Most common default.
- **Soft rect** (radius `1.5rem` to `3rem`): cards, image containers. (Biomind product cards `5rem` radius.)
- **Square / sharp** (radius 0): editorial / Mode A premium.
- **Custom clip-path**: curved-corner asymmetric shapes from Figma — used for video sections, hero overlays, signature image masks. (Honda torn-paper, Hefestus blob curves.)

Don't mix all four. Pick the dominant shape, then allow up to one secondary (typically: pill for buttons + soft-rect for cards, or sharp for cards + pill for buttons).

---

## Typography systems

### Hebrew + English pairings that work

The agency frequently mixes Hebrew and Latin in the same heading. Some pairings that the references actually use:

| Hebrew face                | English face          | Mode  | Vibe                         |
|----------------------------|----------------------|-------|------------------------------|
| Ploni (custom Hebrew)      | Simpler Pro          | A / B | Editorial, clean, premium    |
| Heebo                      | Inter / Outfit       | A / C | Modern friendly default      |
| Assistant                  | Poppins / DM Sans    | A     | Soft, accessible             |
| Narkisim / Narkis Block    | Montserrat / Bebas   | C     | Bold, sport, automotive      |
| Frank Ruhl Libre           | Playfair Display     | A     | Editorial, luxury, lifestyle |
| Rubik                      | Inter                | A / B | Tech, B2B, neutral           |
| Almoni / Hadassah          | Cormorant Garamond   | A     | High-end editorial, fashion  |

For each project, pick one Hebrew face + one Latin face. Use weights for hierarchy (300 / 400 / 500 / 700), not multiple typefaces.

When mixing in a single heading: keep the Hebrew at full weight and let the Latin word be the accent (italic / script / serif). Or invert it for Hebrew-script accent in a Latin heading.

### Three-tier size scale (the actual numbers used)

```scss
:root {
  // Display (statistic numbers, hero h1 only)
  --fs-display: clamp(4rem, 8vw + 1rem, 12rem);

  // Section title
  --fs-section: clamp(1.75rem, 2vw + 1rem, 3.75rem);

  // Body
  --fs-body: clamp(0.875rem, 0.5vw + 0.75rem, 1.125rem);
}
```

`clamp()` keeps the type fluid between mobile and desktop, hitting the target sizes at the breakpoints.

### Letter-spacing rules

- Hebrew display headings: `letter-spacing: -0.02em` to `-0.04em` (tighten — most Hebrew faces look loose at large sizes).
- Latin display headings (especially condensed sans like Bebas): `letter-spacing: 0.02em` to `0.05em`.
- Body Hebrew: default (no override).
- All-caps Latin (used for section eyebrows): `letter-spacing: 0.1em` to `0.2em`.

---

## Color systems

### Mode A palette example

```scss
:root {
  --bg: #fbfaf7;
  --bg-alt: #f1eee9;
  --text: #2b2b2e;
  --text-soft: #6e6c71;
  --border: rgba(0, 0, 0, 0.08);
  --accent: #ff5a5f;          // single warm accent
  --accent-soft: #ffd9da;     // tinted version for backgrounds
}
```

### Mode B palette example

```scss
:root {
  --bg: #0a0a0c;
  --bg-card: #131319;
  --bg-card-glow: rgba(0, 200, 255, 0.05); // subtle radial behind
  --text: #f4f4f6;
  --text-soft: rgba(244, 244, 246, 0.65);
  --border: rgba(255, 255, 255, 0.08);
  --accent: #00d4ff;          // electric blue / cyan / magenta / gold
  --accent-glow: rgba(0, 212, 255, 0.3);
}
```

### Mode C palette example

```scss
:root {
  --bg: #ffffff;
  --bg-dark: #0d0d0d;         // for contrasting heroes
  --text: #0d0d0d;
  --text-soft: #4d4d4d;
  --accent: #e60000;          // saturated red
  --accent-dark: #b50000;
}
```

### Three-color rule

A site uses at most three "real" colors plus neutrals (black/white/grey). The accent appears only in: CTAs, key-word emphasis, links on hover, an occasional decorative shape. If the accent appears on more than 10% of the visual area at any scroll position, it's overused.

---

## Motion and interaction patterns

### Scroll-triggered animations (AOS)

Use sparingly and intentionally:

- Hero text: no AOS (it's already there when the page loads).
- Section titles: `data-aos="fade-up"` with `data-aos-delay="100"`.
- Section content blocks: stagger 100ms after the title (`data-aos-delay="200"`, `300`, `400`).
- Cards in a grid: stagger by index. Don't animate all 12 cards at once — `once: true` is set, but the visual is more elegant if 3-4 cards animate, then the next row, etc.
- Stat numbers: count up on enter view (custom JS, not AOS).

Don't use AOS on every element. The interesting bits are the things that *don't* animate — they ground the layout.

### Hover states that matter

Hover is desktop-only (`@media (any-hover: hover)`). What hover should do depends on the element:

- **Cards**: subtle lift (`transform: translateY(-4px)`), slight shadow increase, image inside scales `1.03–1.05`. No flips, no full-card recolor.
- **Buttons**: color/background swap, NOT scale (scaling buttons looks cheap).
- **Links**: text-decoration toggle (underline appears or disappears), NOT a color change.
- **Photos**: slow zoom on the image only, container stays put. `transition: transform 0.6s ease`.
- **Icons in a grid**: tinted background appears behind, optional rotate/spring on the icon itself.

### Custom cursor / parallax / heavy scroll-triggered

Generally avoid for the agency's typical projects — they slow things down, break on touch, and add complexity. Reserve for hero sections of premium projects where the wow factor is the brief.

If the design genuinely calls for parallax: use `transform: translate3d` driven by `requestAnimationFrame` or the existing Lenis integration (`window.lenis` is referenced in the codebase). Never use `background-attachment: fixed` — broken on iOS.

### Looping micro-animations

These are signature touches that elevate without screaming:

- Slow rotating icon (10s loop) — already in the codebase as `.rotate-icon`.
- Pulsing dot on a "Live" / "New" indicator.
- Subtle shimmer across a CTA every 8 seconds (one-direction sweep, not back-and-forth).
- Marquee tickers for partner logos / press mentions / awards (already in codebase as `.moving-line`).

---

## What to avoid (the anti-pattern catalog)

### Generic-looking patterns to NOT use:

1. **Centered hero with centered headline + centered button + centered subhead** in a normal container. The Bootstrap default. Always offset, asymmetrize, or break out an element.

2. **Three-icon-and-blurb features rows** with circular icon, h3, and 2-line description, equal width. If you must use this pattern (some clients require it), at least: vary the icon style, offset one row vertically, or layer a decorative shape behind.

3. **Carousel with arrows below center, unmoving slides, identical card sizes**. The references all use depth (active center, scaled siblings) or auto-playing video sequences. Static carousels are dead carousels.

4. **Default WordPress button styling** — square corners, all caps, primary blue. Always pill or soft-rect, always with the trailing icon, always with a hover that does something.

5. **All-rounded-everything**. Every card with `border-radius: 12px`, every button pill, every avatar circle. Pick one shape, vary the others.

6. **Stock photography of diverse handshakes / team smiling at laptop / lightbulb metaphor**. If the project budget can't afford real photography, use illustration or product/architectural shots — never generic stock.

7. **Two-column layouts that are exactly 50/50** at large viewport. Almost nothing in real design is 50/50; use `40/60`, `35/65`, `30/70` and break with an offset element.

8. **Section after section with the same vertical padding**. Vary it: a tight section followed by a generous one is more interesting than five medium ones in a row.

9. **Underlined-on-hover navigation in a primary menu**. Use a subtle underline-from-left-on-hover (transform-origin animated) or color change, not the default text-decoration.

10. **Vendor logos in a flat grayscale row at equal spacing**. At minimum: vary spacing, group with subtle dividers, animate as a marquee, or treat with subtle drop-shadows so they read as object placement rather than a flat row.

---

## Decision shortcuts when implementing a reference

When the user provides a design reference and asks for HTML/CSS:

1. **Identify the mode** (A / B / C) using the questions in the "How to identify the mode" section.
2. **Identify the section archetype** — does this match one in `references/section-recipes.md`? If yes, start from that recipe and modify. If no, build from scratch using the conventions here.
3. **Identify the "broken" element** — what's the one thing escaping the grid? That's your z-index focal point; structure the section around it.
4. **Identify the type pairing and color accent** — the brand probably already has these in the wider site; match them.
5. **Implement using Elevate conventions** (BEM, RTL-aware logical properties, AOS patterns, default-slider for carousels). The visual personality goes in *what you build*; the underlying class structure stays consistent with the rest of the codebase.
6. **Add the signature touch** — one of: micro-animation, ghost text overlay, decorative SVG accent, photo-collage offset block, oversized stat. Don't add more than one per section.

If the user provides a reference that genuinely doesn't fit the agency's existing style language, flag it before coding: "This reference is in [different style]. Do you want to push the project in that direction, or would you like me to translate the reference's intent into the agency's existing style language?"

---

## Reading a Figma file or screenshot

When the user shares a Figma link, screenshot, or description:

1. **Extract the type scale** — what's the largest type in the design? The smallest? Estimate the ratio. Convert px to rem (divide by 16).
2. **Extract the color palette** — main background, text, one or two accents, and any tinted backgrounds.
3. **Extract the spacing rhythm** — how much padding around major elements? What's the section vertical spacing?
4. **Extract the radius / shape language** — pill, soft-rect, sharp, custom shape?
5. **Identify the "broken" element** — there should be one. If there isn't, suggest adding one.
6. **Identify any custom interactions** — sliders, hovers, scroll-triggered moments. Note these for the JS layer.

Then write the markup using Elevate's BEM and the conventions from `html-structure.md`, with values pulled from steps 1-3.

---

## When the user provides multiple references at once

If the user uploads 5+ references in a single message, treat the set as a *mood board*, not a literal spec. Identify:

- The dominant mode (A / B / C) — count how many references fall into each.
- Recurring devices — does oversized type appear in 4 of 6 references? That's a signal to use it.
- The two or three references the user calls out specifically — those weight more than the rest.
- What's missing — if all references are heroes, you don't have guidance for the rest of the page; ask before assuming.

Then propose a plan back to the user before writing code: "Based on these references, I'm reading [Mode B], with these recurring devices: [list]. I'll apply these to the [section the user asked about]. Confirm or adjust?"
