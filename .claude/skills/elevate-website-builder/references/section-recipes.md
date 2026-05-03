# Section Recipes — High-Impact Archetypes

Twelve section archetypes pulled from real Elevate references. Each recipe includes:

- **The reference** it's based on (so you can match the visual direction).
- **What makes it not templated** — the one thing that elevates this above a generic version.
- **Markup** in Elevate conventions.
- **Key SCSS** for the signature visual moves (not the full styling — that follows the css-conventions doc).

When the user asks for a hero, an "about" section, a stats showcase, etc., scan this file for the closest archetype. Modify it for the brand at hand. Don't blindly copy; the recipes are starting points, not templates.

---

## 1. Photographic Hero with Oversized Side-Offset Headline

**Reference**: Honda Merch ("RIDE WIDE A HONDA STYLE"), Honda Bikes home ("Ride Red Ride Honda").

**What elevates it**: Headline is offset to one side (not centered), set against a torn-paper / banded edge transition, with a single high-impact CTA. The bottom of the section breaks into the next via a clip-path edge, not a flat border.

```html
<section class="hero-photo">
  <div class="hero-photo__media">
    <picture>
      <source srcset="img/hero-mob.jpg" media="(max-width: 768px) and (orientation: portrait)">
      <img src="img/hero.jpg" alt="">
    </picture>
  </div>

  <div class="hero-photo__content">
    <h1>
      <span class="hero-photo__line-1">RIDE WIDE A</span>
      <span class="hero-photo__line-2">HONDA STYLE</span>
    </h1>
    <p>תיאור קצר וקולע, עד 3 שורות.</p>
    <a href="/products/" class="btn --primary">
      <span>למידע ורכישה</span>
      <i class="icon__plus"></i>
    </a>
  </div>

  <!-- torn-paper edge into the next section -->
  <div class="hero-photo__edge" aria-hidden="true"></div>
</section>
```

```scss
.hero-photo {
  position: relative;
  height: 100vh;
  min-height: 40rem;
  overflow: hidden;
  color: #fff;

  &__media {
    position: absolute;
    inset: 0;
    img { width: 100%; height: 100%; object-fit: cover; }
  }

  &__content {
    position: absolute;
    inset-inline-end: 4rem;       // RTL: anchored to right (start side)
    bottom: 8rem;
    max-width: 30rem;
    z-index: 2;
    text-align: start;

    h1 {
      font-size: clamp(2.5rem, 6vw + 1rem, 6rem);
      line-height: 0.95;
      letter-spacing: -0.02em;
      margin-bottom: 1.5rem;

      .hero-photo__line-1 { display: block; font-weight: 400; }
      .hero-photo__line-2 { display: block; font-weight: 700; color: var(--accent); }
    }
  }

  &__edge {
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 4rem;
    background: var(--bg);
    // torn-paper SVG mask — paste from Figma export
    clip-path: polygon(0 100%, 100% 100%, 100% 60%, 95% 50%, 88% 65%, 75% 55%, 60% 75%, 45% 60%, 30% 80%, 15% 65%, 0 75%);
  }
}
```

**Variation**: replace the static photo with a `<video>` for cinematic motion. Mute, autoplay, loop, playsinline.

---

## 2. Centerpiece Object with Floating UI/Illustration Halo

**Reference**: Young Agency hero (phone mockup with floating Google / Instagram / TikTok / "Brand Awareness" cards).

**What elevates it**: The centerpiece object sits in the middle, but the *real* content is the floating elements around it. Each floating element is positioned absolutely with subtle drift / breathing animation. The floating elements are credible (real brand logos, real metric cards) — not generic shapes.

```html
<section class="halo-hero">
  <div class="container --flex">
    <div class="halo-hero__centerpiece">
      <img src="img/phone-mockup.png" alt="">

      <!-- floating elements -->
      <div class="halo-hero__float halo-hero__float--1">
        <img src="img/icons/google.svg" alt="">
      </div>
      <div class="halo-hero__float halo-hero__float--2">
        <img src="img/icons/instagram.svg" alt="">
      </div>
      <div class="halo-hero__float halo-hero__float--3">
        <span class="metric-card">
          <strong>+25%</strong>
          <em>Brand Awareness</em>
        </span>
      </div>
      <!-- repeat for as many floats as the design calls for -->
    </div>

    <div class="halo-hero__content">
      <h1>
        מומחים <span class="--accent">להובלת העסק שלך</span>
        <br>לצמיחה דיגיטלית
      </h1>
      <div class="halo-hero__stats">
        <div><strong>10</strong><em>שנות ניסיון</em></div>
        <div><strong>40M</strong><em>תקציבים מנוהלים</em></div>
        <div><strong>28</strong><em>תעשיות</em></div>
      </div>
      <div class="halo-hero__partners">
        <img src="img/partners/flashy.svg" alt="Flashy Partner">
        <img src="img/partners/google.svg" alt="Google Partner">
        <img src="img/partners/tiktok.svg" alt="TikTok Marketing Partners">
        <img src="img/partners/meta.svg" alt="Meta Business Partner">
      </div>
      <a href="#cta" class="btn --primary"><span>גלו עוד</span><i class="icon__arrow-left"></i></a>
    </div>
  </div>
</section>
```

```scss
.halo-hero {
  &__centerpiece {
    position: relative;
    width: 35rem;
    aspect-ratio: 1;

    > img { width: 100%; height: 100%; object-fit: contain; }
  }

  &__float {
    position: absolute;
    animation: drift 6s ease-in-out infinite;

    &--1 { top: 10%; inset-inline-start: -8%; animation-delay: 0s; }
    &--2 { top: 40%; inset-inline-start: -12%; animation-delay: 1.5s; }
    &--3 { top: 25%; inset-inline-end: -10%; animation-delay: 3s; }
    // each at unique position, unique animation-delay
  }
}

@keyframes drift {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50%      { transform: translateY(-0.75rem) rotate(-1deg); }
}

@media (prefers-reduced-motion: reduce) {
  .halo-hero__float { animation: none; }
}
```

**The trap to avoid**: don't use 10+ floating elements. Three to five with thoughtful positioning beats ten in a cloud.

---

## 3. Massive Statistic Showcase

**Reference**: Mitsubishi-Niso ("104" שנים של מצוינות).

**What elevates it**: The number is so big it dominates the section — `min-height: 100vh`, the digit fills 60-70% of the screen height, the label sits below as a quiet line. Background is dark/textured. The number itself is hairline-thin in weight, not a heavy display font — the size carries it, not the weight.

```html
<section class="big-stat">
  <div class="big-stat__inner">
    <div class="big-stat__number" data-aos="fade-up">104</div>
    <div class="big-stat__label" data-aos="fade-up" data-aos-delay="200">
      <span class="big-stat__accent">שנים</span> של מצוינות
    </div>
  </div>
</section>
```

```scss
.big-stat {
  background: var(--bg-dark);
  color: var(--text);
  padding-block: 8rem;
  text-align: center;

  &__number {
    font-size: clamp(8rem, 30vw, 25rem);
    font-weight: 200;
    line-height: 0.85;
    letter-spacing: -0.05em;
    color: var(--text);
    // optional: subtle gradient or outline-only treatment
  }

  &__label {
    font-size: clamp(1.5rem, 2vw + 1rem, 2.5rem);
    margin-top: -1rem;          // pull tight under the number

    .big-stat__accent { color: var(--accent); }
  }
}
```

**Variation**: counter-up animation on enter view. Don't use a default jQuery counter — `requestAnimationFrame` with easing looks better.

---

## 4. Ghost-Text Behind Product Photo

**Reference**: Honda CBR detail page ("CBR 1000 RR-R" massive grey text behind the bike).

**What elevates it**: The ghost text is bigger than the product, but a desaturated grey that fades into the background, so the product reads as the focal point. Color swatches sit to the side as a clean utility detail.

```html
<section class="product-spotlight">
  <h1 class="product-spotlight__ghost" aria-hidden="true">CBR 1000 RR-R</h1>
  <h1 class="visually-hidden">CBR 1000 RR-R</h1>

  <div class="product-spotlight__image">
    <img src="img/cbr-1000.png" alt="Honda CBR 1000 RR-R">
  </div>

  <ul class="product-spotlight__colors">
    <li><button style="background: #e60000" aria-label="צבע אדום"></button></li>
    <li><button style="background: #000" aria-label="צבע שחור"></button></li>
  </ul>

  <p class="product-spotlight__meta">
    דרגת זיהום: <span class="badge">6</span> לפרטים: HONDABIKE.CO.IL
  </p>
</section>
```

```scss
.product-spotlight {
  position: relative;
  padding-block: 6rem;
  text-align: center;

  &__ghost {
    position: absolute;
    top: 50%;
    inset-inline-start: 50%;
    transform: translate(-50%, -50%);
    font-size: clamp(3rem, 12vw, 14rem);
    font-weight: 700;
    color: rgba(0, 0, 0, 0.08);
    letter-spacing: 0.02em;
    white-space: nowrap;
    z-index: 1;
    pointer-events: none;
  }

  &__image {
    position: relative;
    z-index: 2;
    img { max-width: min(80rem, 90%); margin-inline: auto; }
  }

  &__colors {
    position: absolute;
    inset-inline-end: 4rem;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    z-index: 3;

    button {
      width: 2rem;
      height: 2rem;
      border: 0;
      cursor: pointer;
      transition: transform 0.3s;
    }
    button:hover { transform: scale(1.15); }
  }
}
```

**Note**: the visible h1 is hidden with `visually-hidden` so screen readers and SEO get the real title; the ghost copy is `aria-hidden` because it's decorative repetition.

---

## 5. Card Grid with Per-Card Glow Accent

**Reference**: Hefestus product cards (Fill Seal / FFS / Robotics / Cannabis), each with its own glow color.

**What elevates it**: Each card has a unique accent color glow that matches its product line. The glow is a radial gradient behind the card content, not a border or shadow. Cards use a dark gradient base with a photographic asset that matches the lighting of the glow.

```html
<section class="glow-cards">
  <div class="container">
    <h2 class="section-title" data-aos="fade-up">
      Next-Level Packaging<br>Technologies and Services.
    </h2>
    <p class="glow-cards__subtitle" data-aos="fade-up" data-aos-delay="100">
      Discover our efficient and precise packaging solutions.
    </p>

    <div class="glow-cards__grid">
      <a href="/fill-seal/" class="glow-card --blue" data-aos="fade-up" data-aos-delay="100">
        <div class="glow-card__media">
          <img src="img/fill-seal.jpg" alt="">
        </div>
        <div class="glow-card__content">
          <img src="img/logos/fill-seal.svg" alt="" class="glow-card__logo">
          <h3>Fill Seal <i class="icon__arrow-left"></i></h3>
          <p>Delivering advanced automation solutions that merge precision.</p>
        </div>
      </a>
      <!-- repeat with --orange, --purple, --magenta accent classes -->
    </div>
  </div>
</section>
```

```scss
.glow-card {
  position: relative;
  display: block;
  border-radius: 1.5rem;
  overflow: hidden;
  background: linear-gradient(180deg, #1a1a22 0%, #0d0d12 100%);
  aspect-ratio: 3 / 4;
  isolation: isolate;
  transition: transform 0.5s ease;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 50% 0%, var(--card-accent), transparent 60%);
    opacity: 0.35;
    z-index: 1;
    transition: opacity 0.5s ease;
  }

  &__media {
    position: absolute;
    inset: 0;
    z-index: 0;
    img { width: 100%; height: 100%; object-fit: cover; opacity: 0.4; }
  }

  &__content {
    position: relative;
    z-index: 2;
    padding: 2rem;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    color: #fff;

    h3 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p  { color: rgba(255, 255, 255, 0.65); font-size: 0.875rem; }
  }

  &.--blue    { --card-accent: #3a9bff; }
  &.--orange  { --card-accent: #ff8a3a; }
  &.--purple  { --card-accent: #b03aff; }
  &.--magenta { --card-accent: #ff3a8a; }

  @media (any-hover: hover) {
    &:hover {
      transform: translateY(-0.5rem);
      &::before { opacity: 0.55; }
    }
  }
}
```

---

## 6. Numbered Process Stages with Circular Badge

**Reference**: Tali Meir Pick ("DESIGN STAGES 1" / "2" with circular illustration badges).

**What elevates it**: Each stage gets a perfect circle on the side that breaks out of the content column. Inside the circle: a number, a stage label, and an illustration that signals the stage's content (architecture sketch, airplane, chair). The circle is a distinct visual punctuation between sections.

```html
<section class="process-stages">
  <div class="container">
    <div class="process-stage">
      <div class="process-stage__badge" aria-hidden="true">
        <span class="process-stage__badge-label">DESIGN STAGES</span>
        <span class="process-stage__badge-number">1</span>
        <img src="img/stage-1-illustration.png" alt="" class="process-stage__badge-image">
      </div>

      <div class="process-stage__content">
        <span class="process-stage__eyebrow">Personal Experience</span>
        <h2>ליווי וייעוץ ריהוט יוקרתי 360°</h2>
        <p>תיאור השלב…</p>

        <div class="process-stage__options">
          <div class="process-stage__option">
            <span class="process-stage__option-tier">A · Classic</span>
            <p>תוכן…</p>
            <a href="#" class="link"><span>לפרטים נוספים</span><i class="icon__arrow-left"></i></a>
          </div>
          <div class="process-stage__option">
            <span class="process-stage__option-tier">B · Premium</span>
            <p>תוכן…</p>
            <a href="#" class="link"><span>לפרטים נוספים</span><i class="icon__arrow-left"></i></a>
          </div>
        </div>
      </div>
    </div>

    <!-- repeat .process-stage with stage 2, 3 -->
  </div>
</section>
```

```scss
.process-stage {
  display: grid;
  grid-template-columns: 16rem 1fr;
  gap: 4rem;
  align-items: center;
  padding-block: 6rem;

  @media (max-width: 768px) and (orientation: portrait) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  &__badge {
    width: 16rem;
    height: 16rem;
    border-radius: 50%;
    background: var(--bg-alt);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    inset-inline-start: -3rem;       // breaks out of column

    &-label {
      writing-mode: vertical-rl;     // optional vertical label
      letter-spacing: 0.3em;
      font-size: 0.75rem;
    }
    &-number { font-size: 3rem; font-weight: 200; line-height: 1; }
    &-image  { width: 70%; margin-top: 1rem; }
  }

  &__options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-top: 2.5rem;

    @media (max-width: 768px) and (orientation: portrait) {
      grid-template-columns: 1fr;
    }
  }
}
```

---

## 7. Photo-Collage with One Accent Block Breaking the Grid

**Reference**: Honda Bikes community section (collage of community photos with a red block holding a quote breaking the layout).

**What elevates it**: Most cells are photos; one cell is a solid color block with a quote. The accent block has a different aspect ratio than the photo cells, so it visually punctures the grid. The result reads as "look how alive this community is" rather than a generic photo wall.

```html
<section class="photo-collage" id="community">
  <div class="container">
    <div class="photo-collage__layout">
      <a href="#" class="photo-collage__cell --large" data-fancybox="community">
        <img src="img/community-1.jpg" alt="">
      </a>

      <div class="photo-collage__cell --quote">
        <blockquote>
          <i class="icon__asterisk"></i>
          <p>כייף שלא ניתן לתאר, פשוט חובה לכל חובבי האופנועים</p>
        </blockquote>
      </div>

      <a href="#" class="photo-collage__cell" data-fancybox="community">
        <img src="img/community-2.jpg" alt="">
      </a>
      <a href="#" class="photo-collage__cell" data-fancybox="community">
        <img src="img/community-3.jpg" alt="">
      </a>
      <a href="#" class="photo-collage__cell --tall" data-fancybox="community">
        <img src="img/community-4.jpg" alt="">
      </a>
      <a href="#" class="photo-collage__cell" data-fancybox="community">
        <img src="img/community-5.jpg" alt="">
      </a>
    </div>
  </div>
</section>
```

```scss
.photo-collage {
  &__layout {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-auto-rows: 12rem;
    gap: 0.75rem;

    @media (max-width: 768px) and (orientation: portrait) {
      grid-template-columns: repeat(2, 1fr);
      grid-auto-rows: 8rem;
    }
  }

  &__cell {
    border-radius: 1.25rem;
    overflow: hidden;
    position: relative;

    img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; }
    @media (any-hover: hover) {
      &:hover img { transform: scale(1.05); }
    }

    &.--large { grid-column: span 2; grid-row: span 2; }
    &.--tall  { grid-row: span 2; }

    &.--quote {
      background: var(--accent);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      grid-row: span 2;

      blockquote {
        text-align: center;
        font-size: 1.25rem;
        i { font-size: 2rem; margin-bottom: 1rem; display: block; }
      }
    }
  }
}
```

---

## 8. Carousel with Depth (Active Center, Scaled Siblings)

**Reference**: Biomind product slider, Honda product spotlight on category pages.

**What elevates it**: The active slide is full-size; siblings are scaled `0.85` and translated to overlap the active center. Side slides are dimmer / lower z-index. As the user navigates, slides smoothly resize and re-stack, giving real depth instead of a flat carousel.

```html
<section class="depth-carousel" id="products">
  <div class="container">
    <h2 class="section-title">המוצרים שלנו</h2>

    <div class="depth-carousel__items">
      <div class="depth-carousel__swiper default-slider" data-initial="2" data-loop="true">
        <div class="swiper-wrapper">
          <div class="swiper-slide">
            <article class="depth-card">
              <div class="depth-card__image">
                <img src="img/product-1.png" alt="UltraCal">
                <div class="depth-card__label">
                  <span>ENERGY</span><i class="icon__asterisk"></i>
                </div>
                <a href="/product/ultracal/" class="btn --primary">
                  <span>למידע ורכישה</span><i class="icon__plus"></i>
                </a>
              </div>
              <div class="depth-card__text">
                <h3>UltraCal</h3>
                <p>תיאור מקוצר…</p>
              </div>
            </article>
          </div>
          <!-- more swiper-slides -->
        </div>
        <div class="btns">
          <button class="swiper-btn-prev default-prev" aria-label="הקודם"><i class="icon__arrow-right"></i></button>
          <button class="swiper-btn-next default-next" aria-label="הבא"><i class="icon__arrow-left"></i></button>
        </div>
      </div>
    </div>
  </div>
</section>
```

```scss
.depth-carousel {
  &__items { max-width: 30rem; margin-inline: auto; position: relative; }
  &__swiper { width: calc(100% + 4.5rem); margin-inline-start: -2.25rem; }

  .swiper-slide {
    transition: transform 0.5s ease;
    transform-origin: 50% 100%;
    padding-inline: 2.25rem;
  }

  // active center is unscaled, immediate neighbors scale to 0.86 and shift toward center
  .swiper-slide-next               { transform: scale(0.86) translate( 7.1%, -2.5%); }
  .swiper-slide-next + .swiper-slide { transform: scale(0.75) translate(32%, -5.2%); }
  .swiper-slide-prev               { transform: scale(0.86) translate(-7.1%, -2.5%); }
  .swiper-slide:has(+ .swiper-slide-prev) { transform: scale(0.75) translate(-32%, -5.2%); }
}
```

The `.depth-card__text` is hidden by default (`opacity: 0`, translated down) and revealed only on the active slide via `.swiper-slide-active` selector — that one detail is what makes the active card feel "in focus."

---

## 9. Mixed-Script Headline ("Meet our team", "Good brand's…marketing.")

**Reference**: Young Agency.

**What elevates it**: One word in the headline switches typeface entirely (script / italic serif), often paired with a color change. The contrast in face is what carries the design — not size or weight.

```html
<h2 class="mixed-headline">
  Meet our <span class="mixed-headline__accent">team</span>
</h2>

<h2 class="mixed-headline">
  Good brand's starts with powerful <span class="mixed-headline__accent">marketing</span>.
</h2>
```

```scss
.mixed-headline {
  font-size: clamp(2rem, 5vw + 0.5rem, 4.5rem);
  font-weight: 400;
  line-height: 1.05;
  color: var(--text);

  &__accent {
    color: var(--accent);
    font-family: 'Playfair Display', 'Frank Ruhl Libre', serif;
    font-style: italic;
    font-weight: 500;
  }
}
```

For Hebrew sites, the inverse works too: Hebrew base + Latin script accent, or Hebrew base + Hebrew display-face accent (e.g., body in Heebo, accent word in Frank Ruhl Libre).

---

## 10. Editorial Logos Grid (Press / Partners / Brands)

**Reference**: Tali Meir Pick (luxury furniture brand grid), Young Agency client logos.

**What elevates it**: Logos sit on a clean alternating-tinted grid, NOT a flat marquee row. Each cell has generous padding. Hover lifts the cell subtly. The grid cell aspect ratio is intentional (1:1 or 4:3), not collapsed to whatever the logo width is.

```html
<section class="editorial-logos">
  <div class="container">
    <h2 class="section-title --centered">
      מגוון המותגים האיטלקיים <span class="--accent">המובילים ביותר</span>
    </h2>

    <div class="editorial-logos__grid">
      <div class="editorial-logos__cell"><img src="img/brands/bnb.svg" alt="B&B"></div>
      <div class="editorial-logos__cell"><img src="img/brands/txt.svg" alt="TXT"></div>
      <div class="editorial-logos__cell"><img src="img/brands/bonaldo.svg" alt="Bonaldo"></div>
      <!-- … -->
    </div>

    <div class="button-wrapper">
      <a href="/brands/" class="link"><span>לכל המותגים</span><i class="icon__arrow-left"></i></a>
    </div>
  </div>
</section>
```

```scss
.editorial-logos {
  &__grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 1px;
    background: var(--border);
    border-block: 1px solid var(--border);

    @media (max-width: 768px) and (orientation: portrait) {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  &__cell {
    background: var(--bg);
    aspect-ratio: 4 / 3;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    transition: background 0.3s;

    img {
      max-width: 70%;
      max-height: 50%;
      object-fit: contain;
      filter: grayscale(0%);
      transition: opacity 0.3s;
    }

    @media (any-hover: hover) {
      &:hover { background: var(--bg-alt); }
    }
  }
}
```

---

## 11. Page-Bottom Oversized Cut-Off Word

**Reference**: Hefestus (giant "Automation" text clipped off the bottom of the page), Honda START YOUR ADVENTURE banner with road photo behind.

**What elevates it**: The word is so big it doesn't fit. The clipping is intentional — the bottom 30-40% of the letterforms is below the viewport / footer edge. Reads as a signature visual punctuation before the footer.

```html
<section class="cutoff-word" aria-hidden="true">
  <div class="cutoff-word__text">Automation</div>
</section>
```

```scss
.cutoff-word {
  background: var(--bg-dark);
  color: #fff;
  overflow: hidden;
  height: 18rem;                 // intentionally shorter than the text height

  @media (max-width: 768px) and (orientation: portrait) { height: 8rem; }

  &__text {
    font-size: clamp(8rem, 25vw, 30rem);
    font-weight: 200;
    line-height: 0.85;
    letter-spacing: -0.05em;
    white-space: nowrap;
    text-align: center;
    transform: translateY(-15%);   // pull up so top is visible, bottom clips off
  }
}
```

`aria-hidden="true"` because this is purely decorative — a real heading should already exist earlier in the page.

---

## 12. Decorative Stamp / Badge (savings, awards, eco)

**Reference**: Uzramed "SAVE $25 / WELLNESS CLUB EXCLUSIVE" circular stamp.

**What elevates it**: The stamp is a perfect circle with curved-text border (or rotating curved text) and a centered key callout. Slightly rotated (`-8deg` or so) so it feels stamped onto the page, not pasted. Often overlaps a section boundary or photo edge.

```html
<div class="stamp-badge" aria-label="חיסכון של 25 דולר במועדון הבלעדי">
  <svg viewBox="0 0 200 200" class="stamp-badge__circle-text">
    <defs>
      <path id="circle-path" d="M 100, 100 m -75, 0 a 75,75 0 1,1 150,0 a 75,75 0 1,1 -150,0"/>
    </defs>
    <text font-size="14" letter-spacing="3">
      <textPath href="#circle-path">
        ★ ONLINE EXCLUSIVE ★ MEMBERS ONLY
      </textPath>
    </text>
  </svg>
  <div class="stamp-badge__center">
    <span>SAVE</span>
    <strong>$25</strong>
  </div>
</div>
```

```scss
.stamp-badge {
  width: 8rem;
  height: 8rem;
  position: absolute;
  inset-inline-end: -2rem;
  top: -2rem;
  z-index: 5;
  transform: rotate(-8deg);
  animation: stamp-rotate 18s linear infinite;

  &__circle-text {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    fill: var(--accent);
  }

  &__center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--text);
    text-align: center;

    span    { font-size: 0.75rem; letter-spacing: 0.2em; }
    strong  { font-size: 1.75rem; font-weight: 700; }
  }
}

@keyframes stamp-rotate {
  from { transform: rotate(-8deg); }
  to   { transform: rotate(352deg); }
}
```

---

## When none of these match

If the user's reference doesn't fit any archetype above:

1. Identify the closest archetype.
2. List what's different — is it a different mode? A new layout idea? A composition you haven't built before?
3. Ask the user: "This is closest to [archetype X], but with [Y differences]. Should I build it as a variant of [X], or should we treat it as a new pattern worth adding to the recipes?"

That last question matters — if the new pattern is going to recur in future projects, it should be added to this file with its markup so the next time it's needed, the implementation is one reference call away.
