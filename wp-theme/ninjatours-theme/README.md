# Ninja Tours — WordPress Theme

A custom WordPress theme for Ninja Tours (Hebrew RTL travel-planning site, Japan-focused). Built on **ACF Pro Flexible Content** with **programmatically-defined field groups** so structure lives in code, content stays editable in admin.

## Stack requirements

| Plugin                     | Required | Notes                                                  |
|----------------------------|----------|--------------------------------------------------------|
| Advanced Custom Fields PRO | ✅       | Field groups won't load without it                     |
| ACF Medium Editor Field    | Recommended | For inline-styled rich text in titles               |
| Contact Form 7             | Recommended | Used by the Contact section                          |
| Custom Post Type UI        | Optional | CPTs are theme-registered; install if migrating to a plugin later |

PHP 8.0+ and WP 6.0+.

---

## Installation

1. Drop this folder at `/wp-content/themes/ninjatours-theme/`.
2. Activate **Advanced Custom Fields PRO** + (optionally) **ACF Medium Editor Field** + **Contact Form 7**.
3. Activate the **Ninja Tours** theme. On first activation, the demo installer runs automatically and creates:
   - **6 pages** with full Flexible Content already populated:
     - Home — hero, why-us, trip-types, attractions, content+media, use-cases, testimonials, partners, contact
     - אודות — story, values, process, testimonials, contact
     - יצירת קשר — hero, contact form, tips
     - למה אנחנו — focused why-us + process + testimonials
     - יעדים פופולריים — destinations grid + attractions
     - בלוג — set as the posts page
   - **CPT posts** with their fields filled:
     - 4 destinations (with taglines + region taxonomy)
     - 6 attractions (with info-chips, tips, and category taxonomy)
     - 4 hotels (with rating, tagline, city + audience taxonomy)
     - 4 use cases (with duration, capacity, modal content, quote, audience + tag taxonomy)
     - 4 travel types — first one ("טבע ונופים") with full FC layout
     - 4 client reviews (with text + name + 5★ rating)
   - **Taxonomy terms** — categories ready for filter tabs/dropdowns
   - **3 nav menus** (Header 1, Header 2, Footer) wired to locations
   - **General Settings** — header CTA, email, footer copyright defaults
4. Visit any page — sections render with real content from the start.
5. Upload your own logo + featured images via Media Library; the theme references attachments by ID, so editors just upload and pick.

> **The installer runs once.** It writes a flag (`nt_demo_installed`) to options. Delete that option if you want it to re-run on next activation.

---

## How content is composed

### The mental model

Every page (and every CPT single) has **one ACF Flexible Content field** with the same library of section layouts. The editor adds whatever sections they want, in any order. The same Hero can appear on the homepage and a landing page; the same Contact section can be added to ten pages without copying content.

### Section library

| Layout name           | Slug              | What it does                                              |
|-----------------------|-------------------|-----------------------------------------------------------|
| Home Hero             | `home_hero`       | Full-bleed video / image hero with title + features + CTA |
| Why Us                | `why_us`          | Numbered card row with hover-reveal description           |
| Trip Types            | `trip_types`      | Slider of `travel-type` CPT                               |
| Attractions           | `attractions`     | Filter-tabs grid of `attraction` CPT                      |
| Destinations          | `destinations`    | Card grid of `destination` CPT                            |
| Hotels                | `hotels`          | Card grid of `hotel` CPT                                  |
| Use Cases             | `use_cases`       | Slider of `use-case` cards opening Fancybox modals        |
| Client Reviews        | `testimonials`    | Slider of `client-review` CPT                             |
| Process               | `process`         | Numbered timeline                                         |
| Partners              | `partners`        | Two scrolling logo rows                                   |
| Content + Media       | `content_media`   | Two-column text + image                                   |
| Image Separator       | `image_separator` | Full-bleed image divider                                  |
| Contact               | `contact`         | CF7 form + image                                          |
| Travel-Type Hero      | `travel_type_hero`| Compact hero used inside CPT detail pages                 |
| Meta Strip            | `meta_strip`      | White-bg row of icon + label + value                      |
| About + Sidebar       | `about_with_sidebar`| 2-col body + sidebar info card with CTA                  |
| Itinerary             | `itinerary`       | Day-by-day timeline cards                                 |
| Tips                  | `tips`            | 2×2 grid of numbered tip cards                            |

### Wrapper toggles every layout has

- **Use General Settings?** — pulls content from *General Settings → Sections Content* on the options page
- **Hide Section?** — render skip without deleting
- **Section ID** — custom anchor; auto-generated if blank

### Relation fields with fallback

Sections that pull from a CPT (`trip_types`, `attractions`, `destinations`, `hotels`, `use_cases`, `testimonials`) follow the same rule:

1. If the editor curated specific items in the relation field → render those
2. Otherwise → auto-load up to 10 latest posts from that CPT
3. If that CPT has no posts at all → the section silently does not render (no error, no broken state)

A `show_all` toggle on each forces option 2 even when the editor did pick items.

---

## Custom Post Types & Taxonomies

| CPT              | Slug          | Taxonomies                                                |
|------------------|---------------|-----------------------------------------------------------|
| Destinations     | `destination` | `travel-region` (hierarchical)                            |
| Hotels           | `hotel`       | `hotel-city`, `hotel-audience`                            |
| Attractions      | `attraction`  | `attraction-category` (hierarchical)                      |
| Use Cases        | `use-case`    | `trip-audience`, `trip-tag`, `trip-length` (hierarchical) |
| Travel Types     | `travel-type` | (none)                                                    |
| Client Reviews   | `client-review` | (none — slider-only)                                    |

> CPTs are theme-registered for installation simplicity. **Move them to a site-specific plugin before going to production** so your data survives a theme switch.

---

## ACF: programmatic with JSON bridge

- All field groups defined in PHP under `inc/acf/*.php`. Each is independently modifiable.
- ACF Local JSON sync is enabled — `acf-json/` is the watched folder. Saving a field group via the admin UI auto-writes JSON there; new environments auto-load.
- To bring a code-defined group into the editable admin UI, use **Custom Fields → Tools → Import** and select the JSON, OR if a JSON drift exists you'll see ACF's "Sync Available" prompt.

### Adding a new section

Four files touch:

1. **`inc/acf/section-fields.php`** — add a `nt_section_<name>_fields()` function returning the layout's content fields, and add `<name>` to `nt_section_registry()`.
2. **`content/sections/<name>.php`** — the PHP renderer following the standard boilerplate (use `nt_get_section_group($data, '<name>')` to read content).
3. **`assets/app/css/main.css`** (or a section-specific file) — add the section CSS.
4. **`assets/app/previews/<name>.jpg`** + uncomment the rule in `assets/app/css/acf.css` — admin chooser preview.

That's it — the layout automatically appears in the **+ Add Row** chooser on every page.

---

## File layout

```
ninjatours-theme/
├── style.css                     # Theme metadata only
├── functions.php                 # Just include_once lines
├── header.php                    # WP-menu-driven header
├── footer.php                    # WP-menu-driven footer + General Settings socials
├── 404.php
├── search.php
├── index.php                     # Generic archive fallback
├── singular.php                  # Generic single fallback
├── single-attraction.php         # Default layout if FC empty
├── single-destination.php
├── single-hotel.php
├── single-travel-type.php
├── single-use-case.php
├── archive-attraction.php        # Filterable grid via AJAX
├── archive-destination.php
├── archive-hotel.php             # Filterable
├── archive-travel-type.php
├── archive-use-case.php          # Filterable
├── inc/
│   ├── assets.php                # wp_enqueue_*
│   ├── disable.php               # Remove WP cruft
│   ├── functions.php             # nt_render_*, nt_get_items_with_fallback
│   ├── post-types.php            # CPT registrations
│   ├── taxonomies.php            # Taxonomy registrations
│   ├── ajax.php                  # AJAX filter handlers
│   ├── theme-settings.php        # ACF options page, menus, theme support
│   ├── svg-support.php
│   ├── demo-content.php          # First-activation installer
│   └── acf/
│       ├── loader.php            # Loads all groups + JSON sync filters
│       ├── helpers.php           # nt_layout_subfields, nt_make_layout, …
│       ├── section-fields.php    # Per-layout content-field factories + registry
│       ├── flexible-content.php  # Builds the master flexible_content field
│       ├── options-general.php
│       ├── options-sections-content.php
│       ├── post-attraction.php
│       ├── post-destination.php
│       ├── post-hotel.php
│       ├── post-use-case.php
│       ├── post-travel-type.php
│       ├── post-client-review.php
│       └── taxonomy-fields.php
├── parts/
│   ├── meta.php
│   ├── attraction-card.php
│   ├── destination-card.php
│   ├── hotel-card.php
│   ├── use-case-card.php
│   └── use-case-modal.php
├── views/
│   └── page-flexible-content.php # The single page template
├── content/
│   ├── flexible-content.php      # Section dispatcher
│   └── sections/
│       ├── home_hero.php
│       ├── why_us.php
│       ├── trip_types.php
│       ├── attractions.php
│       ├── destinations.php
│       ├── hotels.php
│       ├── use_cases.php
│       ├── testimonials.php
│       ├── process.php
│       ├── partners.php
│       ├── contact.php
│       ├── content_media.php
│       ├── image_separator.php
│       ├── travel_type_hero.php
│       ├── meta_strip.php
│       ├── about_with_sidebar.php
│       ├── itinerary.php
│       └── tips.php
├── acf-json/                     # Auto-populated by ACF
└── assets/
    └── app/
        ├── css/main.css
        ├── css/hotels.css
        ├── css/hotel-detail.css
        ├── css/acf.css
        ├── js/main.js
        ├── js/ajax.js
        ├── images/               # Logo, leaves, contact, etc.
        └── previews/             # ACF chooser thumbnails (drop your own JPGs here)
```

---

## Editor's quick-start

1. **General Settings** → upload logo (light + dark), set email + social URLs, set Header CTA text.
2. **Appearance → Menus** → review the auto-created menus, attach to locations.
3. **Pages → Home** → click "+ Add Section" and start composing. The "Use General Settings?" toggle on each section pulls the content from your sitewide defaults.
4. **CPT posts** → for each Attraction/Hotel/Destination, fill the dedicated fields plus the Flexible Content for body customization (or leave empty to use the default single layout).

---

## License

All rights reserved — Elevate Digital Studio for Ninja Tours.
