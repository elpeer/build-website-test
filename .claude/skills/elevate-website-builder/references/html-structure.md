# HTML Structure Reference

This file documents the page skeleton, naming conventions, and the markup for every recurring component.

---

## Page skeleton

Every page starts with this exact head and body opener. Keep meta tags in this order — Israeli accessibility audits look for `viewport` and the language attribute.

```html
<!DOCTYPE html>
<html dir="rtl" lang="he">

<head>
  <meta charset="utf-8" />
  <title>Site Name | Page Title</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
  <meta name="description" content="Concise page description in Hebrew, max ~155 chars">
  <meta property="og:title" content="...">
  <meta property="og:description" content="...">
  <meta property="og:image" content="...">
  <meta property="og:type" content="website">
  <meta property="og:url" content="...">

  <link rel="canonical" href="...">
  <link rel="icon" type="image/x-icon" href="img/favicon.ico">
  <link rel="stylesheet" href="css/main.min.css" />
</head>

<body>
  <a href="#main-content" class="skip-link">דלג לתוכן הראשי</a>
  <div class="preloader"></div>

  <header class="header">…</header>

  <main id="main-content">
    <!-- sections -->
  </main>

  <footer class="footer">…</footer>

  <script src="libs/jquery/jquery.min.js"></script>
  <script src="libs/swiper/swiper.min.js"></script>
  <script src="libs/aos/aos.js"></script>
  <script src="libs/fancybox/fancybox.js"></script>
  <script src="js/main.js"></script>
</body>
</html>
```

Notes:
- `lang="he"` for Hebrew, `lang="ar"` for Arabic-only pages, `lang="en"` for English. Multi-language sites toggle this via Polylang in WordPress.
- `maximum-scale=1` is intentional — matches the existing site behavior. Some accessibility tools flag this; the agency has decided it's fine because the layout already scales fluidly.
- `.skip-link` is required for accessibility (Israeli regulation 35241). Hide it visually but make it focusable.
- `<main id="main-content">` gives the skip link its target. Only one `<main>` per page.
- Scripts load at the end of `<body>`, in this exact order. jQuery first, then Swiper, AOS, Fancybox, then `main.js`.

---

## Header

The header is sticky and gains a `.fixed` class on scroll (handled by `fixedHeaderActions()` in `main.js`). Default text color flips to white when over a hero image — see the `body:has(.home-hero:first-child) .header` selector in CSS.

```html
<header class="header">
  <div class="header-inner">
    <div class="wrapper">
      <a href="/" class="logo" aria-label="חזרה לדף הבית">
        <img src="img/logo.svg" alt="Site Name">
      </a>
      <nav class="main-menu" aria-label="תפריט ראשי">
        <ul>
          <li><a href="/about/">אודות</a></li>
          <li class="menu-item-has-children">
            <a href="/products/">מוצרים</a>
            <ul class="sub-menu">
              <li><a href="/products/cat-1/">קטגוריה 1</a></li>
              <li><a href="/products/cat-2/">קטגוריה 2</a></li>
            </ul>
          </li>
          <li><a href="/contact/">צור קשר</a></li>
        </ul>
      </nav>
    </div>
    <div class="header-actions">
      <a href="#minicart" id="miniCartInit" data-fancybox class="cart-btn" aria-label="צפייה בעגלה">
        <span id="productCount">0</span>
        <i class="icon__bag"></i>
      </a>
    </div>
    <button class="burger-btn" aria-label="פתיחת תפריט" aria-expanded="false" aria-controls="main-menu">
      <span></span><span></span><span></span>
    </button>
  </div>

  <!-- mini-cart panel rendered as a Fancybox target -->
  <div class="minicart-wrapper" id="minicart">…</div>
</header>
```

The burger button has three `<span>` children (the lines). Don't change this — the CSS animates them into an X using `nth-of-type` selectors.

---

## Footer

```html
<footer class="footer">
  <div class="container --row">
    <div class="footer-logo">
      <a href="/"><img src="img/logo.svg" alt="Site Name"></a>
    </div>

    <div class="footer-subscribe">
      <div class="footer-subscribe__title">הצטרפו לניוזלטר</div>
      <div class="footer-subscribe__text">קבלו עדכונים והטבות ישירות למייל.</div>
      <form>
        <div class="form-flex">
          <label for="newsletter-email" class="visually-hidden">אימייל</label>
          <input type="email" id="newsletter-email" placeholder="אימייל" required>
          <button class="btn --primary" type="submit" aria-label="הרשמה">
            <i class="icon__arrow-left"></i>
          </button>
        </div>
      </form>
    </div>

    <div class="footer-menus">
      <ul class="footer-menus__items">
        <li class="menu-item-has-children">
          <a href="#">כללי</a>
          <ul class="sub-menu">
            <li><a href="/about/">אודותינו</a></li>
            <li><a href="/faq/">שאלות ותשובות</a></li>
          </ul>
        </li>
        <!-- repeat -->
      </ul>
      <div class="contacts">
        <span>שירות לקוחות</span>
        <a href="mailto:info@example.co.il">info@example.co.il</a>
        <a href="tel:033106310">03-3106310</a>
      </div>
      <div class="social-media">
        <div class="social-media__title">עקבו אחרינו</div>
        <ul>
          <li><a href="#" aria-label="אינסטגרם"><img src="img/icons/instagram.svg" alt=""></a></li>
          <li><a href="#" aria-label="פייסבוק"><img src="img/icons/facebook.svg" alt=""></a></li>
          <li><a href="#" aria-label="טיקטוק"><img src="img/icons/tiktok.svg" alt=""></a></li>
        </ul>
      </div>
    </div>
  </div>

  <div class="footer-middle">
    <div class="container --row">
      <div class="footer-middle__menus">
        <ul>
          <li><a href="/terms/">תקנון ותנאי שימוש</a></li>
          <li><a href="/privacy/">מדיניות פרטיות</a></li>
          <li><a href="/cancellation/">ביטול עסקה</a></li>
          <li><a href="/shipping/">משלוחים</a></li>
          <li><a href="/accessibility/">הצהרת נגישות</a></li>
          <li><a href="/returns/">החזרות והחלפות</a></li>
        </ul>
        <p class="d-none-mob">
          <span>כל הזכויות שמורות ל-Ⓒ Site Name</span>
          <span>עיצוב ופיתוח אתר: אלוויט דיגיטל סטודיו</span>
        </p>
      </div>
      <div class="footer-payments">
        <div><img src="img/pay-1.png" alt="Visa"></div>
        <div><img src="img/pay-2.png" alt="Mastercard"></div>
        <div><img src="img/pay-3.png" alt="American Express"></div>
        <div><img src="img/pay-4.png" alt="Bit"></div>
      </div>
      <p class="d-none-desktop">
        <span>כל הזכויות שמורות ל-Ⓒ Site Name</span>
        <span>עיצוב ופיתוח אתר: אלוויט דיגיטל סטודיו</span>
      </p>
    </div>
  </div>

  <div class="footer-bottom">
    <div class="container">
      <p>טקסט משפטי אחרון, אם יש (למשל הצהרה על תוספי תזונה, אישור משרד הבריאות וכד׳).</p>
    </div>
  </div>
</footer>
```

Required legal links every Israeli e-commerce footer must have: תקנון, מדיניות פרטיות, ביטול עסקה, משלוחים, הצהרת נגישות. Don't omit any of these unless the site is non-commercial.

---

## Section types

### Hero

```html
<section class="home-hero">
  <div class="home-hero__inner">
    <div class="home-hero__media">
      <picture>
        <source srcset="img/home/hero-mob.png" media="(max-width: 768px) and (orientation: portrait)" />
        <img src="img/home/hero.png" alt="" />
      </picture>
    </div>
    <div class="home-hero__content">
      <h1>הכותרת הראשית</h1>
      <a href="/products/" class="btn --primary">
        <span>למידע ורכישה</span>
        <i class="icon__plus"></i>
      </a>
    </div>
  </div>
</section>
```

The `<h1>` lives inside `.home-hero__content`. There is exactly one `<h1>` per page.

### Features grid (4-column)

```html
<section class="features" id="features">
  <div class="container">
    <div class="features__inner">
      <div class="features__item" data-aos="fade-right" data-aos-delay="100" data-aos-anchor="#features">
        <div class="features__item-image"><img src="img/feature-1.svg" alt=""></div>
        <div class="features__item-text"><p>טקסט</p></div>
      </div>
      <!-- repeat 4 times, incrementing data-aos-delay by 100 -->
    </div>
  </div>
</section>
```

### Product slider (carousel of cards)

```html
<section class="products-slider" id="products">
  <div class="container">
    <h2 class="section-title" data-aos="fade-up" data-aos-delay="100" data-aos-anchor="#products">
      כותרת
    </h2>
    <div class="products-slider__items" data-aos="fade-up" data-aos-delay="200" data-aos-anchor="#products">
      <div class="products-slider__swiper default-slider" data-initial="2">
        <div class="swiper-wrapper">
          <div class="swiper-slide">
            <div class="product-slide">
              <div class="product-slide__image">
                <img src="img/product.png" alt="">
                <div class="product-slide__label">
                  <span>ENERGY</span>
                  <i class="icon__asterisk"></i>
                </div>
                <a href="/product/" class="btn --primary">
                  <span>למידע ורכישה</span>
                  <i class="icon__plus"></i>
                </a>
              </div>
              <div class="product-slide__text">
                <h3 class="product-slide__title">UltraCal</h3>
                <p>תיאור מוצר מקוצר עד 3 שורות...</p>
              </div>
            </div>
          </div>
          <!-- more slides -->
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

In RTL pages, the prev arrow is `icon__arrow-right` and the next arrow is `icon__arrow-left` — direction-of-reading, not LTR-style. Reverse if the slider has `dir="ltr"`.

### Video + content split

```html
<section class="video-content" id="video-content">
  <div class="container --flex">
    <div class="video-content__text">
      <h2 class="section-title" data-aos="fade-left" data-aos-delay="100" data-aos-anchor="#video-content">
        כותרת
      </h2>
      <div class="editor-area" data-aos="fade-left" data-aos-delay="200" data-aos-anchor="#video-content">
        <p>טקסט הסבר…</p>
      </div>
      <div data-aos="fade-left" data-aos-delay="300" data-aos-anchor="#video-content">
        <a href="/research/" class="link">
          <span>קרא עוד</span>
          <i class="icon__arrow-left"></i>
        </a>
      </div>
    </div>
    <div class="video-content__media" data-aos="fade-up" data-aos-delay="100" data-aos-anchor="#video-content">
      <video src="video/video_1.mp4" autoplay muted loop playsinline></video>
    </div>
  </div>
</section>
```

Background videos always have `autoplay muted loop playsinline`. Without `playsinline`, iOS opens them fullscreen.

### Testimonials slider with video progress

```html
<section class="client-videos" id="client-videos">
  <div class="container">
    <h2 class="section-title" data-aos="fade-up" data-aos-delay="100" data-aos-anchor="#client-videos">
      כותרת
    </h2>
    <div class="client-videos__slider" data-aos="fade-up" data-aos-delay="200" data-aos-anchor="#client-videos">
      <div class="default-slider" dir="ltr" data-loop="true" data-video-progress>
        <div class="swiper-wrapper">
          <div class="swiper-slide">
            <div class="client-videos__item">
              <div class="client-videos__item-media">
                <video src="video/v1.mp4" poster="img/client-1.jpg" muted playsinline></video>
                <a href="https://youtu.be/XXXX" class="vp-container" data-fancybox aria-label="צפייה בסרטון">
                  <i class="icon__play"></i>
                </a>
              </div>
              <div class="client-videos__item-text">
                <h3 class="client-videos__item-title">שם הלקוח</h3>
                <p>תיאור התוצאה</p>
              </div>
            </div>
          </div>
          <!-- more slides -->
        </div>
        <div class="btns">
          <button class="swiper-btn-prev default-prev" aria-label="הקודם"><i class="icon__arrow-left"></i></button>
          <button class="swiper-btn-next default-next" aria-label="הבא"><i class="icon__arrow-right"></i></button>
        </div>
      </div>
    </div>
  </div>
</section>
```

`data-video-progress` activates the ring/bullet progress indicator that auto-advances when the video ends. The slider gets `dir="ltr"` because the video sequence flows visually left-to-right even on Hebrew pages.

### Mini-cart (Fancybox panel)

```html
<div class="minicart-wrapper" id="minicart">
  <div class="minicart-wrapper__cta"><span>חסכת 59 ש״ח בהזמנה הראשונה</span></div>

  <div class="minicart-wrapper__header">
    <div class="minicart-wrapper__title">סיכום הזמנה</div>
  </div>

  <div class="minicart-wrapper__products">
    <div class="minicart-wrapper__product">
      <a href="/product/" class="minicart-wrapper__product-image">
        <img src="img/product-1.png" alt="">
      </a>
      <div class="minicart-wrapper__product-details">
        <div class="minicart-wrapper__product-title"><a href="/product/">Stay In</a></div>
        <p>מארז יחיד</p>
        <div class="product-price">
          <span class="current-price">₪49</span>
          <span class="old-price">₪59</span>
        </div>
      </div>
      <div class="minicart-wrapper__product-actions">
        <div class="product-quantity">
          <button aria-label="הוספת יחידה"><i class="icon__plus"></i></button>
          <input type="text" value="1" readonly aria-label="כמות">
          <button aria-label="הסרת יחידה"><i class="icon__minus"></i></button>
        </div>
        <a href="#" class="product-remove">הסר</a>
      </div>
    </div>
  </div>

  <div class="minicart-wrapper__related">
    <div class="minicart-wrapper__related-title">אולי תאהבו גם</div>
    <div class="default-slider">
      <div class="swiper-wrapper">
        <!-- swiper-slide containing .minicart-wrapper__related-product -->
      </div>
    </div>
  </div>

  <div class="minicart-wrapper__total">
    <div class="minicart-wrapper__total-row --discount"><span>סכום הנחה</span><span>₪24-</span></div>
    <div class="minicart-wrapper__total-row --delivery"><span>משלוח</span><span>חינם</span></div>
    <div class="minicart-wrapper__total-row --total"><span>סה״כ</span><span>₪90</span></div>
  </div>

  <div class="minicart-wrapper__submit">
    <a href="/checkout/" class="btn --primary">
      <span>לתשלום</span>
      <i class="icon__plus"></i>
    </a>
  </div>
</div>
```

The trigger is anywhere with `data-fancybox href="#minicart"`. Fancybox handles the open/close.

### Accordion (FAQ)

```html
<div class="accordion-items">
  <div class="accordion-item">
    <button class="accordion-item__head" aria-expanded="false" aria-controls="faq-1-body">
      <h3>השאלה?</h3>
      <span class="plus-btn"></span>
    </button>
    <div class="accordion-item__body" id="faq-1-body">
      <div class="editor-area">
        <p>התשובה.</p>
      </div>
    </div>
  </div>
  <!-- more items -->
</div>
```

Init in JS via `accordionInit('.accordion-item', '.accordion-item__head')` — already called in `main.js`.

---

## Forms

```html
<form class="contact-form" novalidate>
  <div class="form-grid">
    <div class="form-item --type-2">
      <label for="form-name">שם מלא</label>
      <input type="text" id="form-name" name="name" required autocomplete="name">
    </div>
    <div class="form-item --type-2">
      <label for="form-phone">טלפון</label>
      <input type="tel" id="form-phone" name="phone" required autocomplete="tel" inputmode="numeric">
    </div>
    <div class="form-item --type-2 --wide">
      <label for="form-email">אימייל</label>
      <input type="email" id="form-email" name="email" required autocomplete="email">
    </div>
    <div class="form-item --type-2 --wide">
      <label for="form-message">הודעה</label>
      <textarea id="form-message" name="message" rows="4"></textarea>
    </div>
  </div>

  <div class="checkbox-item">
    <label class="checkbox">
      <input type="checkbox" name="terms" required>
      <span>אני מאשר/ת את <a href="/terms/">התקנון</a> ו<a href="/privacy/">מדיניות הפרטיות</a></span>
    </label>
  </div>

  <button type="submit" class="btn --primary">
    <span>שליחה</span>
    <i class="icon__arrow-left"></i>
  </button>
</form>
```

Every input must have a `<label for>`. Use `autocomplete` attributes — required for form auto-fill accessibility. Use `inputmode="numeric"` on tel and number-only fields so mobile keyboards open in the right mode.

---

## Editor area

Wrap any rich-text content (post body, product description, legal pages) in `.editor-area`. The CSS handles spacing for `<h2>`, `<h3>`, `<p>`, `<ul>`, `<ol>`, `<li>`, `<a>`. Don't apply utility classes inside it.

```html
<div class="editor-area">
  <h2>כותרת משנה</h2>
  <p>פסקת פתיחה.</p>
  <ul>
    <li>פריט אחד</li>
    <li>פריט שני</li>
  </ul>
</div>
```

---

## Breadcrumbs

```html
<nav class="breadcrumbs" aria-label="ניווט">
  <ul>
    <li><a href="/">דף הבית</a></li>
    <li><a href="/category/">קטגוריה</a></li>
    <li>שם העמוד הנוכחי</li>
  </ul>
</nav>
```

The last item is plain text (no link) and represents the current page. Add JSON-LD `BreadcrumbList` structured data when in WordPress (Yoast / Rank Math handles this).

---

## d-none utilities

Use sparingly — only for elements that genuinely need to be hidden at one breakpoint:

- `.d-none` — always hidden
- `.d-none-mob` — hidden on mobile portrait
- `.d-none-desktop` — hidden on desktop & landscape

Don't combine. If you need both desktop and tablet variants, write a dedicated class.

---

## Visually-hidden helper

For labels that need to exist for screen readers but be invisible:

```html
<label for="search" class="visually-hidden">חיפוש</label>
<input type="search" id="search" placeholder="חפשו…">
```

CSS:
```css
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```
