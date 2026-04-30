# Ninja Tours

אתר תדמית/מכירה לסוכנות טיולים, נבנה לפי הקונבנציות של הסקיל `elevate-website-builder`.

## מבנה

```
Ninja Tours/
├── index.html          # עמוד בית (placeholder content - ממתין לעיצוב Figma)
├── css/main.css        # סגנונות בסיס + components + sections
├── js/main.js          # jQuery IIFE: preloader, header, menu, accordion, sliders, AOS
├── img/                # תמונות (לוגו, hero, tours, icons, social)
├── video/              # וידאו רקע (אופציונלי)
├── fonts/              # Simpler Pro / ploni / icomoon (לא כלולים — צריך להוסיף)
└── libs/               # libs מקומיים (אופציונלי — כרגע משתמש ב-CDN)
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
להעברה ל-production מומלץ להוריד אותם מקומית ל-`libs/` לפי המבנה:

```
libs/
├── jquery/jquery.min.js
├── swiper/swiper.min.js + swiper.min.css
├── aos/aos.js + aos.css
└── fancybox/fancybox.js + fancybox.css
```

## פונטים שעדיין צריך להוסיף

הסגנונות מצפים ל-`Simpler Pro` (גוף), `ploni` (כותרות מוצר) ו-`icomoon` (אייקונים).
הצניחו את הקבצים תחת `fonts/` והפעילו את בלוקי `@font-face` ב-`css/main.css` (כרגע מוערים).

עד אז ה-fallback הוא `Heebo`/`Arial Hebrew`/sans-serif והאייקונים יציגו codepoint ריק.

## מה עוד חסר

- [ ] **תוכן Figma** — ה-MCP של Figma התנתק לפני שהצלחנו לשלוף את העיצוב המלא של `node-id=59-1848`. ברגע שהחיבור חוזר, צריך להחליף את ה-placeholders ב-`home-hero`, ב-`tours-slider` ובשאר הסקציות בערכים האמיתיים (טקסטים, צבעים מדויקים, מידות, תמונות).
- [ ] **לוגו ותמונות** — `img/logo.svg`, `img/home/hero.jpg`, `img/home/tour-{1,2,3}.jpg`, `img/home/feature-{1..4}.svg`, `img/icons/{instagram,facebook,tiktok}.svg`.
- [ ] **OG cover** — `img/og-cover.jpg` בגודל 1200×630.
- [ ] **עמוד הצהרת נגישות** — `/accessibility.html` עם פרטי רכז נגישות לפי תקנה 35.

## מוכן ל-WordPress

שמות הקלאסים, מבנה התפריטים ומבנה הטופס תואמים `wp_nav_menu`, `WC()->cart` ותבניות WooCommerce. ראה SKILL.md סעיף 8 לפרטים.

## SEO + נגישות

- `<html dir="rtl" lang="he">`
- Title/description/canonical/OG/Twitter/JSON-LD (Organization + WebSite)
- Skip link, ARIA labels על כל בקר אינטראקטיבי, label אמיתי ל-input, `prefers-reduced-motion`
- היררכיית כותרות: `h1` יחיד ב-hero, `h2.section-title` בכל סקשן, `h3` בכרטיסי טיולים ובאקורדיון
