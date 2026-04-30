---
name: rtl-ecommerce-template
description: בניית עמודי HTML/CSS/JS ב-RTL עברית בסגנון הסטודיו (BEM + jQuery IIFE + Swiper + AOS + Fancybox), תואם תקני נגישות ישראל (ת"י 5568 / WCAG 2.0 AA), SEO ישראלי, ומוכן להמרה ל-WordPress/WooCommerce. Use whenever generating new HTML pages/sections, refactoring existing markup, writing CSS following the studio's conventions, or preparing markup for WordPress theming.
---

# RTL Hebrew E-commerce Template — Studio Conventions

Coding standard for static Hebrew RTL e-commerce sites that are later ported to WordPress/WooCommerce. Follow EVERY rule below unless the user explicitly overrides it.

---

## 1. Document skeleton

```html
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8" />
  <title>{{שם האתר}} | {{כותרת עמוד}}</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
  <meta name="description" content="{{תיאור עד 155 תווים בעברית}}" />
  <link rel="canonical" href="{{absolute URL}}" />
  <!-- OG / Twitter / JSON-LD נכנסים כאן -->
  <link rel="stylesheet" href="css/main.min.css" />
</head>
<body>
  <div class="preloader"></div>
  <header class="header">…</header>
  <main>…</main>
  <footer class="footer">…</footer>

  <script src="libs/jquery/jquery.min.js"></script>
  <script src="libs/swiper/swiper.min.js"></script>
  <script src="libs/aos/aos.js"></script>
  <script src="libs/fancybox/fancybox.js"></script>
  <script src="js/main.js"></script>
</body>
</html>
```

Rules:
- `<html dir="rtl" lang="he">` חובה.
- כל עמוד עוטף את התוכן ב-`<main>` יחיד; `<header>` ו-`<footer>` יושבים מחוץ ל-main.
- סקריפטים בסוף `<body>` בסדר: jQuery → Swiper → AOS → Fancybox → main.js.
- אין inline styles ואין inline scripts פרט ל-JSON-LD.

---

## 2. Sectioning pattern

כל סקשן הוא `<section class="{{name}}" id="{{name}}">` עם `.container` בפנים. ה-id משמש גם ל-AOS anchor וגם לעוגני ניווט.

```html
<section class="features" id="features">
  <div class="container">
    <div class="features__inner">
      <div class="features__item" data-aos="fade-right" data-aos-delay="100" data-aos-anchor="#features">…</div>
    </div>
  </div>
</section>
```

חוקים:
- `id` של הסקשן = שם הקלאס הראשי (kebab-case).
- אנימציות AOS נקבעות דרך `data-aos`, `data-aos-delay`, `data-aos-anchor`. אל תוסיף JS לאנימציה.
- כותרת סקשן תמיד `<h2 class="section-title">`. רק עמוד הבית או עמוד מוצר מכיל `<h1>` יחיד.
- ל-section-title הוסף `data-aos="fade-up" data-aos-delay="100" data-aos-anchor="#{{section-id}}"`.

---

## 3. BEM naming

- Block: `home-hero`, `minicart-wrapper`, `product-slide`.
- Element: `home-hero__media`, `minicart-wrapper__product-image`.
- Modifier (כקלאס נוסף, לא דרך `--`-postfix לבלוק): `<a class="btn --primary">`, `<div class="container --row --flex">`.
- Utility helpers זמינים: `.d-none`, `.d-block`, `.d-none-mob`, `.d-none-desktop`, `.--flex`, `.--row`.
- אל תיצור Block-ים חדשים אם יש patterns קיימים ב-`btn`, `link`, `product-price`, `product-quantity`, `form-item`, `form-grid`, `accordion-item`, `editor-area`.

---

## 4. CSS conventions (SCSS/CSS minified)

### 4.1 Sizing
- `html { font-size: 0.83333vw; }` בדסקטופ, `font-size: 4.10256vw` במובייל. **כל המידות ב-rem**, אף פעם לא px (פרט ל-1px לבורדרים).
- 1rem בדסקטופ ≈ 16px ב-1920px. 1rem במובייל ≈ 16px ב-390px.

### 4.2 Breakpoints (חובה — אין אחרים)
```scss
// Desktop / tablet landscape
@media (orientation: landscape), (min-width: 769px) and (orientation: portrait) { … }

// Mobile portrait
@media (max-width: 768px) and (orientation: portrait) { … }
```

### 4.3 Logical properties (RTL-safe)
תמיד השתמש ב:
- `padding-inline`, `padding-inline-start`, `padding-inline-end`
- `margin-inline-start`, `margin-inline-end`
- `inset-inline-start`, `inset-inline-end`
- `border-inline-start`, `border-inline-end`

לעולם לא `padding-left/right`, `margin-left/right` או `left/right` באלמנטים שצריכים להתהפך ב-RTL.

### 4.4 Hover guard
כל hover עוטף ב-`@media (any-hover: hover)` כדי לא להידבק במובייל:
```scss
@media (any-hover: hover) {
  .btn:hover { background: #cdffc3; }
}
```

### 4.5 צבעים, פונטים, אייקונים
- טקסט גוף: `#6e6c71`. כותרות: `#3f3e42` או `#020202`. אקסנט ירוק: `#cdffc3`. רקעים: `#f1f1f2`, `#f4f4f5`.
- פונט ברירת מחדל: `"Simpler Pro", sans-serif`. פונט משני: `ploni, sans-serif` (לכותרות עמוד מוצר).
- אייקונים דרך icomoon: `<i class="icon__arrow-left"></i>`, `icon__plus`, `icon__bag`, `icon__play`, `icon__dropdown` וכו'. אין SVG inline אם קיים icon מקביל.
- Transitions: `0.5s ease` ברירת מחדל.

### 4.6 Container
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
}
```

---

## 5. JavaScript conventions

### 5.1 Wrapper
כל קוד הסטודיו עטוף ב-jQuery IIFE:
```js
(function ($) {
  $(document).ready(function () {
    $('.preloader').fadeOut(1000);

    if ($('[data-fancybox]').length > 0) {
      Fancybox.bind("[data-fancybox]", {
        placeFocusBack: false,
        dragToClose: false,
      });
    }

    fixedHeaderActions();
    menuActions();
    accordionInit('.accordion-item', '.accordion-item__head');
    // … initializers נוספים
  });
})(jQuery);
```

### 5.2 Sliders (Swiper) — data-attribute driven
אל תיצור מופע Swiper ידני. השתמש ב-`.default-slider` עם data attributes:

```html
<div class="default-slider"
     data-initial="2"
     data-loop="true"
     data-autoplay="true"
     data-speed="5000"
     data-duration="1000"
     data-effect="slide"
     data-offset="20"
     data-video-progress>
  <div class="swiper-wrapper">
    <div class="swiper-slide">…</div>
  </div>
  <div class="btns">
    <button class="swiper-btn-prev default-prev"><i class="icon__arrow-right"></i></button>
    <div class="default-pagination"></div>
    <button class="swiper-btn-next default-next"><i class="icon__arrow-left"></i></button>
  </div>
</div>
```

חוקים:
- חיצים ב-RTL: prev = arrow-right, next = arrow-left.
- ל-slider עם וידאו הוסף `data-video-progress` (טבעת התקדמות) או `data-video-progress="bullets"` (פגיניציה מלאה).
- לא להחביא חיצים עם `display:none` מ-CSS — השתמש ב-`.btns.d-none` או הסר את ה-DOM כליל.

### 5.3 Accordions
```html
<div class="accordion-item">
  <button class="accordion-item__head" aria-expanded="false">
    <h3>שאלה</h3>
    <span class="plus-btn"></span>
  </button>
  <div class="accordion-item__body"><p>תשובה</p></div>
</div>
```
ה-init: `accordionInit('.accordion-item', '.accordion-item__head');`

### 5.4 Slide toggles ידניים
השתמש ב-`initSlideToggles(selector, { duration: 500, openedClass: 'opened' })` קיים. אל תכתוב slideUp/slideDown חדשים.

---

## 6. SEO ישראלי

חובה בכל עמוד:
1. **Title**: עברית, עד 60 תווים, פורמט `{{כותרת ייחודית}} | {{שם המותג}}`.
2. **Meta description**: 140–160 תווים, עברית טבעית, כולל מילת מפתח אחת.
3. **Canonical** absolute URL (חשוב ל-Google ישראל ולפילטור duplicates).
4. **OpenGraph + Twitter Card** עם תמונה 1200×630.
5. **JSON-LD Schema** רלוונטי:
   - דף בית: `Organization` + `WebSite` + `SearchAction`.
   - דף מוצר: `Product` עם `offers`, `aggregateRating`, `review`, `priceCurrency: "ILS"`.
   - דף בלוג: `Article` עם `author`, `datePublished`, `dateModified`.
   - דף יצירת קשר/חנות פיזית: `LocalBusiness` + `address` (`addressCountry: "IL"`).
6. **Breadcrumbs** semantic + JSON-LD `BreadcrumbList`.
7. **תמונות**: `alt` תיאורי בעברית, lazy-loading דרך `loading="lazy"` (פרט ל-LCP), שמות קבצים ללא רווחים, וידוא WebP/AVIF במידת האפשר.
8. **כותרות**: H1 יחיד לעמוד, היררכיה רציפה (אין דילוג מ-H2 ל-H4).
9. **Internal links** עם anchor text עברי בעל משמעות.
10. **lang attributes**: `<html lang="he">`. תוכן באנגלית בתוך פסקה — `<span lang="en">…</span>`.

---

## 7. נגישות (ת"י 5568 / WCAG 2.0 AA — חוק שוויון זכויות לאנשים עם מוגבלות)

חובה בכל פרויקט בישראל:

1. **הצהרת נגישות**: לינק `הצהרת נגישות` בפוטר מוביל לעמוד נפרד עם תוכן לפי תקנה 35 (פרטי רכז נגישות, רמת תאימות, תאריך, דרכי פנייה).
2. **Skip link**: `<a class="skip-link" href="#main">דלג לתוכן הראשי</a>` בתחילת ה-body. Visible on focus.
3. **תפקידי ARIA על בקרים אינטראקטיביים**:
   - `aria-label` על כל כפתור איקוני (`burger-btn`, `cart-btn`, `swiper-btn-*`, חצים בסליידר). דוגמה כבר קיימת: `<a class="cart-btn" aria-label="View shopping cart">`.
   - `aria-expanded` על אקורדיון ותפריט hamburger.
   - `aria-controls` מקושר ל-id של הפנל.
   - `aria-current="page"` על קישור התפריט הפעיל.
   - `aria-live="polite"` על הודעות סטטוס (הוספה לעגלה, שגיאת טופס).
4. **focus visible**: אסור `outline: none` בלי תחליף. השאר את ה-focus ring או הוסף `:focus-visible` משלך.
5. **טפסים**:
   - כל input חייב `<label>` קשור (`for` / `id`) — לא רק placeholder.
   - שגיאות מסומנות עם `aria-invalid="true"` ו-`aria-describedby` למיכל הטקסט.
6. **ניגודיות**: טקסט רגיל ≥ 4.5:1, טקסט גדול ≥ 3:1. בדוק את `#6e6c71` על רקעים בהירים — לעיתים נדרש החלפה ל-`#3f3e42` בשביל גודל קטן.
7. **תמונות**: `alt` ריק (`alt=""`) לתמונות דקורטיביות בלבד, אחרת תיאור עברי קצר.
8. **וידאו אוטומטי**: חייב `muted` (קיים כבר), כפתור pause, וכתוביות אם יש דיבור.
9. **פלאגין נגישות (אופציונלי, נפוץ בישראל)**: הכן hook להטמעת ענבל/User1st/Equalweb בהמשך — אל תכניס סקריפט שלהם בעצמך.
10. **ניווט מקלדת**: כל אינטראקציה זמינה ב-Tab/Shift+Tab/Enter/Space. בדוק את ה-mini-cart, ה-burger menu וה-Fancybox lightboxes.
11. **prefers-reduced-motion**:
    ```scss
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    }
    ```

---

## 8. WordPress / WooCommerce readiness

הקוד הסטטי ייהפך ל-theme. תכנן מראש:

1. **Class hooks**: כל סקשן עם class זהה לשם הקובץ ב-theme (`home-hero` → `template-parts/sections/home-hero.php`).
2. **שמירת ה-DOM של WooCommerce**: blocks כמו `.product-hero`, `.products-add-to-cart`, `.minicart-wrapper`, `.checkout-page__summary` כבר תואמים hooks סטנדרטיים. אל תשנה את שמות הקלאסים האלה.
3. **i18n**: כל מחרוזת בממשק עוברת דרך `__()`/`_e()` עם textdomain אחיד. בקבצי HTML הסטטיים — שמור הערה `{{__:string}}` ליד טקסט קבוע אם כבר ידוע שיהפוך לדינמי.
4. **תמונות**: בקובץ הסטטי `<img src="img/...">`, ב-WordPress יוחלף ב-`<?php echo esc_url( get_template_directory_uri() ); ?>/assets/img/...` או ב-ACF/featured image. השאר את ה-`alt` כדי שיתורגם ב-CMS.
5. **Menus**: `.main-menu > ul`, `.footer-menus__items`, `.footer-middle ul` יקבלו `wp_nav_menu()` עם `container=false` ו-`menu_class` תואם.
6. **Forms**: ניוזלטר ויצירת קשר — מבנה מאפשר Contact Form 7 או WPForms (`<form>` עם `name` attributes, לא `id`-driven).
7. **Mini-cart**: `#productCount` ו-`.minicart-wrapper__products` ייקראו דרך `WC()->cart` + AJAX `woocommerce_update_order_review`.
8. **Slugs**: השתמש ב-id-ים בעברית (`#products`, `#features`) רק כאנקרים. ה-permalinks של WP יישארו אנגלית (`/products/`, `/about/`).
9. **WooCommerce templates המכוסים על-ידי הקוד**: `single-product.php`, `archive-product.php`, `cart.php`, `checkout/form-checkout.php`, `myaccount/*`, `order-received.php`. כל קלאס שמופיע במבנה הסטטי חייב להישמר ב-template overrides.
10. **Performance**: רישום נכסים ב-`functions.php` עם `wp_enqueue_script(..., [], $ver, true)` — סקריפטים בפוטר. שמור על הסדר jQuery → Swiper → AOS → Fancybox → main.

---

## 9. Patterns מוכנים (אל תמציא מחדש)

| צורך | בלוק קיים | הערות |
|---|---|---|
| כפתור ראשי | `.btn.--primary` עם `<span>` + `<i class="icon__plus">` | ירוק על hover |
| לינק עם חץ | `.link` + `icon__arrow-left` | underline על span |
| כותרת סקשן | `.section-title` (h2) | font-size 3.75rem / 1.75rem mob |
| Hero עם וידאו | `.home-hero` + `<picture>` רספונסיבי | mob source ב-media query |
| גריד פיצ'רים | `.features__inner` | 4 עמודות דסקטופ, 2 מובייל |
| Slider מוצרים | `.products-slider` עם `.default-slider[data-initial="2"]` | סקייל אוטומטי על שכנים |
| וידאו עם טבעת התקדמות | `.default-slider[data-video-progress]` | JS כבר מטפל |
| Mini-cart | `.minicart-wrapper` תוך `<header>` + `data-fancybox` | לא לשנות מבנה |
| אקורדיון FAQ | `.accordion-item` + `accordionInit` | h2/h3 בתוך head |
| טופס | `.form-grid` + `.form-item.--type-2` | label צף עם רקע |
| צ'קאוט | `.checkout-page` (grid 2 עמודות) | `.payment_methods` תואם WooCommerce |
| פוטר | `.footer` + `.footer-middle` + `.footer-bottom` | כולל קישור הצהרת נגישות |

---

## 10. Checklist להגשה

לפני שמשחררים HTML חדש בדוק:
- [ ] `<html dir="rtl" lang="he">` קיים
- [ ] H1 יחיד; כל H2 הם `.section-title`
- [ ] כל סקשן עם `id` תואם לקלאס
- [ ] כל אייקון-בלבד button/anchor כולל `aria-label`
- [ ] כל form input עם `<label>` אמיתי
- [ ] כל img עם `alt` משמעותי או `alt=""` אם דקורטיבי
- [ ] meta description בעברית, canonical, OG, JSON-LD
- [ ] לינק "הצהרת נגישות" בפוטר
- [ ] sliders משתמשים ב-`.default-slider` עם data-attrs (לא Swiper ידני)
- [ ] hover עטוף ב-`@media (any-hover: hover)`
- [ ] רק `padding-inline/margin-inline/inset-inline` — לא left/right
- [ ] sizes ב-rem, breakpoints סטנדרטיים בלבד
- [ ] סקריפטים בסוף body בסדר הנכון
- [ ] השמות של הקלאסים שיורשו ל-WordPress נשמרו

אם משהו ברשימה לא מתקיים — **תקן לפני סיום**, אל תסגור את המשימה.
