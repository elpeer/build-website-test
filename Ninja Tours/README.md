# Ninja Tours

אתר תדמית/לידים לסוכנות טיולים עצמאיים ליפן. נבנה לפי הקונבנציות של הסקיל `elevate-website-builder`.

## מבנה

```
Ninja Tours/
├── index.html            # עמוד בית מלא — 13 סקציות
├── accessibility.html    # הצהרת נגישות
├── css/main.css          # סגנונות בסיס + components + sections
├── js/main.js            # jQuery IIFE: preloader, header, menu, accordion, sliders, AOS, attractions filter
├── img/                  # תמונות (לוגו, hero, אטרקציות, טיולים, אווטרים, מסלולים)
├── video/                # וידאו רקע (אופציונלי)
├── fonts/                # icomoon (לא כלול — האייקונים כרגע SVG masks)
└── libs/                 # libs מקומיים (אופציונלי — כרגע משתמש ב-CDN)
```

## הסקציות בדף הבית

1. **Header** — לוגו, תפריט, CTA "תכנון לי טיול" אדום
2. **Hero** — הר פוג'י עם פריחת דובדבן, ribbon "תכנון מדויק / שירות אישי / זמינות 24/7"
3. **Why us** — 5 יתרונות עם הדגשה על המרכזי (מודגש באדום)
4. **Tour types** — סליידר 4 סוגי טיול (אקטיבי / רומנטי / משפחתי / קלאסי)
5. **Attractions** — גריד 6 אטרקציות עם פילטרים (טבע / תרבות / אוכל / עירוני)
6. **Process** — timeline 3 שלבי תכנון + פלאפון מוקאפ דביק
7. **Tailored Trips banner** — הטקסט הענק "TAILORED TRIPS" כ-broken element מאחורי הר פוג'י
8. **Customer tours** — 4 מסלולים שבנינו ללקוחות
9. **Testimonials** — סליידר 4 ביקורות בסגנון Google Review
10. **Founders** — פוטו ייסדים + טקסט אישי
11. **Plan trip / Form** — סקרה דקורטיבי, "LET'S PLAN YOUR TRIP" + טופס מילוי
12. **Pre-footer** — הר רקע
13. **Footer** — פוטר כהה עם תפריטים, פרטי קשר, רשתות, לוגו

## תמונות נדרשות (placeholder paths)

```
img/logo.svg                     # לוגו NINJA TOURS
img/logo-light.svg               # לוגו לרקע כהה (פוטר)
img/og-cover.jpg                 # 1200×630
img/home/hero.jpg                # 1920×800 — הר פוג'י עם פריחת דובדבן (desktop)
img/home/hero-mob.jpg            # 768×1024 — קרופ מובייל
img/home/tour-type-{1..4}.jpg    # 304×432 — סוגי טיולים
img/home/attraction-{1..6}.jpg   # 600×420 — אטרקציות
img/home/process-phone.png       # 320×640 — מוקאפ פלאפון עם screenshot של אפליקציה
img/home/process-{1..3}.jpg      # 480×320 — תמונות התהליך
img/home/fuji-banner.jpg         # 1920×600 — באנר הר פוג'י
img/home/customer-{1..4}.jpg     # 320×240 — מסלולי לקוחות
img/home/avatar-{1..4}.jpg       # 96×96 — אווטרים לעדויות
img/home/founders.jpg            # 600×750 — תמונת ייסדים
img/home/plan-mountain.jpg       # 600×750 — תמונה לטופס
img/home/pre-footer.jpg          # 1920×400 — הר רקע פרה-פוטר
img/icons/google.svg             # 24×24 — לוגו גוגל
```

## הרצה מקומית

```bash
cd "Ninja Tours"
python3 -m http.server 8000
# או: npx serve .
```

לפתוח בדפדפן: `http://localhost:8000`

## תלויות

הסקריפטים והסגנונות נטענים מ-CDN (jQuery, Swiper 8, AOS 2.3.4, Fancybox UI).
להעברה ל-production מומלץ להוריד אותם מקומית ל-`libs/`.

## פונטים

- **Noto Sans Hebrew** (Google Fonts) — Hebrew base font, כל העמוד
- **Inter** (Google Fonts) — Latin face לטקסטים אנגליים (LET'S PLAN, TAILORED TRIPS, מספרי שלבים)

## פלטת צבעים

```
--color-text:    #4a4a52      Body text
--color-heading: #1a1a1f      Headings
--color-strong:  #0d0d0d      Maximum contrast
--color-red:     #d62828      CTAs, accent words ("איתנו" / "מתאים לכם" / "פעם בחיים")
--color-pink-soft: #fde4e8    רקע סקציית הטופס (סקרה)
--color-dark:    #141416      פוטר ופרה-פוטר
```

## SEO + נגישות

- `<html dir="rtl" lang="he">`
- Title/description/canonical/OG/Twitter/JSON-LD (Organization)
- Skip link, ARIA labels על כל בקר אינטראקטיבי, label אמיתי ל-input
- `prefers-reduced-motion` תומך
- היררכיית כותרות: `h1` יחיד ב-hero, `h2.section-title` בכל סקשן, `h3` בכרטיסים ובעדויות
- `:focus-visible` עם outline אדום ל-2px
- כל התמונות עם `alt` (ריק לדקורטיביות)

## קונבנציות (לפי `elevate-website-builder`)

- BEM עם `.block__element` ו-`.block.--modifier`
- Logical properties בלבד (`inset-inline-start`, `padding-inline` וכו')
- `rem` בלבד (root `0.83333vw` desktop / `4.10256vw` mobile)
- שני breakpoints בלבד: `(orientation: landscape), (min-width: 769px) and (orientation: portrait)` ומובייל פורטרייט
- Sliders: `.default-slider` data-driven (Swiper 8)
- Animations: AOS עם `data-aos-anchor` לסנכרון בתוך הסקשן
- Hover guarded ב-`@media (any-hover: hover)`
