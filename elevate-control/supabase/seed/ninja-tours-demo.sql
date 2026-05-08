-- ════════════════════════════════════════════════════════════════════════
--  Ninja Tours — demo data seed
--  Run once in Supabase SQL Editor. Idempotent: re-running won't duplicate.
--
--  Populates:
--   - Project metadata (description, brand tokens, vercel URL, target dates,
--     current stage, workspace_settings)
--   - 4 CPTs + 2 taxonomies
--   - 7 pages (home, about, attractions/single, tours/single, contact,
--     privacy, terms) with parent/child links
--   - 7 generic section_definitions (insert-if-missing)
--   - Sections on the home page
--   - Finance: signed quote file, payment milestones checklist, invoices
--   - Spec: interview / content-spec files, client materials, client_notes
--   - Design: figma URL, brand book file, 5 design-page approvals (some
--     approved, some pending, some changes_requested)
--   - Development: 5 frontend page approvals
--   - QA: 8 checklist items + bug-report comments
--   - Content: 6 deliverable checklist items
--   - Integrations: 6 checklist items with input_type=text/url
--   - Launch: hosting + dates + 8-step checklist
--   - Training: 3 file rows
--   - Support: 2 tickets (one urgent, one normal)
--   - Comment threads on a couple of approvals + a workspace thread
--   - 8 activity_log entries
--   - 5 in-app notifications for the project owner
-- ════════════════════════════════════════════════════════════════════════

do $$
declare
  v_project_id      uuid;
  v_user_id         uuid;
  v_cpt_attr_id     uuid;
  v_cpt_tour_id     uuid;
  v_cpt_team_id     uuid;
  v_cpt_test_id     uuid;
  v_page_home_id    uuid;
  v_page_about_id   uuid;
  v_page_attr_id    uuid;
  v_page_tour_id    uuid;
  v_def_hero        uuid;
  v_def_feature     uuid;
  v_def_grid        uuid;
  v_def_test        uuid;
  v_def_cta         uuid;
  v_def_form        uuid;
  v_def_content     uuid;
  v_appr_home_d     uuid;
  v_appr_about_d    uuid;
  v_appr_attr_d     uuid;
  v_appr_home_dev   uuid;
  v_thread_id       uuid;
  v_ticket_id       uuid;
  v_target_at       timestamptz := now() + interval '45 days';
  v_kickoff_at      timestamptz := now() - interval '30 days';
begin
  -- ── Look up the project + a studio_admin user for FK targets ───────
  select id into v_project_id from projects where slug = 'ninja-tours';
  if v_project_id is null then
    raise exception 'Project ninja-tours not found. Create it first.';
  end if;

  select id into v_user_id from profiles where studio_admin = true order by created_at limit 1;
  if v_user_id is null then
    raise exception 'No studio_admin profile found. Create one first.';
  end if;

  -- ── Project metadata ───────────────────────────────────────────────
  update projects set
    client_name        = coalesce(nullif(client_name, ''), 'נינג''ה טורס בע"מ'),
    description        = 'חברת תיירות פרטית שעושה התאמות לחופשות ביפן באופן אישי לצרכי הלקוח. סיורים מודרכים, חוויות ייחודיות, ואטרקציות מחוץ לתלם.',
    vercel_url         = coalesce(vercel_url, 'https://ninja-tours.vercel.app'),
    current_stage      = 'design',
    target_at          = v_target_at,
    kickoff_at         = v_kickoff_at,
    has_wordpress      = true,
    has_mobile_design  = true,
    design_tokens      = '{
      "colors": {
        "primary":   "#1a3a52",
        "secondary": "#c1272d",
        "accent":    "#f4a261",
        "neutral":   "#f8f5ee"
      },
      "fonts": {
        "headings": "''Heebo'', sans-serif",
        "body":     "''Assistant'', sans-serif"
      }
    }'::jsonb,
    workspace_settings = jsonb_build_object(
      'design',       jsonb_build_object('figma_url', 'https://www.figma.com/file/example/ninja-tours-design'),
      'development',  jsonb_build_object('cms_url', 'https://staging.ninja-tours.co.il/wp-admin', 'staging_url', 'https://staging.ninja-tours.co.il'),
      'qa',           jsonb_build_object('clickup_url', 'https://app.clickup.com/example/list/ninja-tours-qa'),
      'content',      jsonb_build_object('cms_url', 'https://staging.ninja-tours.co.il/wp-admin', 'status_note', 'עמוד הבית הושלם. עמוד אודות בעבודה. ארכיונים ממתינים.'),
      'spec',         jsonb_build_object('client_notes', 'מה שחשוב לנו:
• אווירה ייחודית, לא תיירות מסחרית סטנדרטית
• דגש על חוויות אותנטיות ולא רק לאטרקציות מסורתיות
• עיצוב מודרני אבל עם אסטטיקה יפנית מינימליסטית
• קלות הזמנה — שאיש לא יצטרך להתקשר טלפון'),
      'launch',       jsonb_build_object(
        'hosting',        'Cloudways',
        'domain',         'ninja-tours.co.il',
        'staging_url',    'https://staging.ninja-tours.co.il',
        'production_url', 'https://ninja-tours.co.il',
        'launch_at',      to_char(v_target_at, 'YYYY-MM-DD HH24:MI')
      )
    )
  where id = v_project_id;

  -- ── Section definitions (global, idempotent) ──────────────────────
  insert into section_definitions (slug, name_he, category, description, cpt_driven, is_global) values
    ('home_hero',          'Hero ראשי',          'hero',    'באנר ראשי עם תמונה רקע, כותרת, תת-כותרת ו-CTA',            false, true),
    ('feature_grid',       'גריד תכונות',        'feature', '3-6 כרטיסי תכונה עם אייקון, כותרת וטקסט קצר',              false, true),
    ('cpt_grid',           'גריד CPT דינמי',     'listing', 'רשימת פוסטים מ-CPT עם פילטרים אופציונליים',                 true,  true),
    ('testimonial_slider', 'סליידר המלצות',      'social',  'קרוסלה של המלצות לקוחות',                                   true,  true),
    ('cta_block',          'בלוק קריאה לפעולה',  'cta',     'באנר רחב עם כותרת, תיאור וכפתור',                           false, true),
    ('contact_form',       'טופס יצירת קשר',    'utility', 'טופס שדות עם validation ושליחת מייל',                       false, true),
    ('content_block',      'בלוק תוכן',          'content', 'בלוק תוכן חופשי (WYSIWYG) עם תמונות וטקסט',                false, true)
  on conflict (slug) do nothing;

  select id into v_def_hero    from section_definitions where slug='home_hero';
  select id into v_def_feature from section_definitions where slug='feature_grid';
  select id into v_def_grid    from section_definitions where slug='cpt_grid';
  select id into v_def_test    from section_definitions where slug='testimonial_slider';
  select id into v_def_cta     from section_definitions where slug='cta_block';
  select id into v_def_form    from section_definitions where slug='contact_form';
  select id into v_def_content from section_definitions where slug='content_block';

  -- ── CPTs ──────────────────────────────────────────────────────────
  insert into cpts (project_id, slug, name_he, has_archive, has_single, "order") values
    (v_project_id, 'attractions',   'אטרקציות',     true,  true,  10),
    (v_project_id, 'tour-packages', 'חבילות טיול',  true,  true,  20),
    (v_project_id, 'team-members',  'חברי צוות',    false, false, 30),
    (v_project_id, 'testimonials',  'המלצות לקוחות', false, false, 40)
  on conflict (project_id, slug) do nothing;

  select id into v_cpt_attr_id from cpts where project_id=v_project_id and slug='attractions';
  select id into v_cpt_tour_id from cpts where project_id=v_project_id and slug='tour-packages';
  select id into v_cpt_team_id from cpts where project_id=v_project_id and slug='team-members';
  select id into v_cpt_test_id from cpts where project_id=v_project_id and slug='testimonials';

  -- ── Taxonomies ─────────────────────────────────────────────────────
  insert into taxonomies (project_id, cpt_id, slug, name_he, hierarchical, terms) values
    (v_project_id, v_cpt_attr_id, 'attraction-category', 'קטגוריות אטרקציה', true,  '["טבע","תרבות","קולינריה","היסטוריה","הרפתקאות"]'::jsonb),
    (v_project_id, v_cpt_attr_id, 'destination',         'יעדים',           true,  '["טוקיו","קיוטו","אוסקה","הוקאידו","אוקינאווה"]'::jsonb),
    (v_project_id, v_cpt_tour_id, 'duration',            'משך הטיול',       false, '["3-5 ימים","6-8 ימים","9-14 ימים","חופשה ארוכה"]'::jsonb)
  on conflict (cpt_id, slug) do nothing;

  -- ── Pages ─────────────────────────────────────────────────────────
  insert into pages (project_id, slug, name_he, name_en, type, status, "order", notes, created_by, cpt_id) values
    (v_project_id, 'home',          'דף הבית',           'Home',        'page',    'sectioned', 10, 'עמוד הראשי — מציג את החברה, אטרקציות נבחרות, חבילות, המלצות וטופס.', v_user_id, null),
    (v_project_id, 'about',         'אודות',             'About',       'page',    'designed',  20, 'סיפור החברה, ערכים, ופרזנטציה של חברי הצוות.',                       v_user_id, null),
    (v_project_id, 'attractions',   'אטרקציות',          'Attractions', 'archive', 'planned',   30, 'ארכיון של כל האטרקציות עם פילטרים לפי קטגוריה ויעד.',                v_user_id, v_cpt_attr_id),
    (v_project_id, 'attraction',    'אטרקציה',           'Attraction',  'single',  'planned',   31, 'תבנית של עמוד אטרקציה בודד.',                                       v_user_id, v_cpt_attr_id),
    (v_project_id, 'tour-packages', 'חבילות טיול',       'Tours',       'archive', 'planned',   40, 'רשימת חבילות עם פילטרים לפי משך וקטגוריה.',                          v_user_id, v_cpt_tour_id),
    (v_project_id, 'tour-package',  'חבילת טיול',        'Tour',        'single',  'planned',   41, 'תבנית של חבילה בודדת.',                                             v_user_id, v_cpt_tour_id),
    (v_project_id, 'contact',       'צור קשר',           'Contact',     'page',    'planned',   50, 'טופס יצירת קשר + פרטי החברה.',                                       v_user_id, null),
    (v_project_id, 'privacy',       'מדיניות פרטיות',    'Privacy',     'service', 'planned',   60, 'מדיניות פרטיות לפי GDPR.',                                          v_user_id, null),
    (v_project_id, 'terms',         'תקנון',             'Terms',       'service', 'planned',   70, 'תקנון שימוש בשירות.',                                                v_user_id, null)
  on conflict (project_id, slug) do nothing;

  select id into v_page_home_id  from pages where project_id=v_project_id and slug='home';
  select id into v_page_about_id from pages where project_id=v_project_id and slug='about';
  select id into v_page_attr_id  from pages where project_id=v_project_id and slug='attractions';
  select id into v_page_tour_id  from pages where project_id=v_project_id and slug='tour-packages';

  -- ── Sections on the home page ─────────────────────────────────────
  delete from sections where page_id = v_page_home_id;
  insert into sections (page_id, definition_id, definition_slug, "order", status, notes, content) values
    (v_page_home_id, v_def_hero,    'home_hero',          10, 'built',     'Hero ראשי עם רקע וידאו של נופי יפן + כותרת "תכננו את החופשה ביפן" + CTA "התחל לתכנן"', '{"field_schema":[{"key":"headline","label_he":"כותרת ראשית","type":"text","required":true},{"key":"subheadline","label_he":"כותרת משנה","type":"textarea","required":false},{"key":"cta_text","label_he":"טקסט כפתור","type":"text","required":true},{"key":"cta_url","label_he":"לינק כפתור","type":"url","required":true},{"key":"video_url","label_he":"וידאו רקע","type":"url","required":false}]}'::jsonb),
    (v_page_home_id, v_def_feature, 'feature_grid',       20, 'reviewed',  '4 כרטיסי תכונה — תכנון אישי, מדריך מקומי, תמיכה 24/7, מחיר קבוע',                       '{"field_schema":[{"key":"items","label_he":"פריטים","type":"repeater","required":true,"sub_fields":[{"key":"icon","label_he":"אייקון","type":"icon","required":true},{"key":"title","label_he":"כותרת","type":"text","required":true},{"key":"description","label_he":"תיאור","type":"textarea","required":true}]}]}'::jsonb),
    (v_page_home_id, v_def_grid,    'cpt_grid',           30, 'in_dev',    'גריד דינמי של 6 אטרקציות נבחרות',                                                         ('{"field_schema":[{"key":"section_title","label_he":"כותרת על-עמודית","type":"text","required":true},{"key":"items_count","label_he":"מספר פריטים","type":"number","required":true}],"cpt_driven":true,"cpt_id":"' || v_cpt_attr_id::text || '","cpt_slug":"attractions","cpt_name_he":"אטרקציות"}')::jsonb),
    (v_page_home_id, v_def_grid,    'cpt_grid',           40, 'planned',   'גריד דינמי של 3 חבילות טיול מומלצות',                                                     ('{"field_schema":[{"key":"section_title","label_he":"כותרת","type":"text","required":true}],"cpt_driven":true,"cpt_id":"' || v_cpt_tour_id::text || '","cpt_slug":"tour-packages","cpt_name_he":"חבילות טיול"}')::jsonb),
    (v_page_home_id, v_def_test,    'testimonial_slider', 50, 'planned',   'סליידר של המלצות לקוחות מ-CPT',                                                           ('{"field_schema":[],"cpt_driven":true,"cpt_id":"' || v_cpt_test_id::text || '","cpt_slug":"testimonials","cpt_name_he":"המלצות"}')::jsonb),
    (v_page_home_id, v_def_cta,     'cta_block',          60, 'planned',   'בלוק "מוכנים להתחיל לתכנן?" עם כפתור צור קשר',                                            '{"field_schema":[{"key":"title","label_he":"כותרת","type":"text","required":true},{"key":"subtitle","label_he":"תת-כותרת","type":"textarea","required":false},{"key":"cta_text","label_he":"טקסט כפתור","type":"text","required":true},{"key":"cta_url","label_he":"לינק","type":"url","required":true}]}'::jsonb),
    (v_page_home_id, v_def_form,    'contact_form',       70, 'planned',   'טופס "צור קשר מהיר" עם 4 שדות ושליחה למייל',                                              '{"field_schema":[]}'::jsonb);

  -- ── Finance: payment milestones (checklist) ───────────────────────
  delete from checklist_items where project_id = v_project_id and workspace = 'finance';
  insert into checklist_items (project_id, workspace, title, description, status, position, created_by) values
    (v_project_id, 'finance', 'מקדמה — 30%', 'תשלום מקדמה לפתיחת הפרויקט',                'done',    10, v_user_id),
    (v_project_id, 'finance', 'אחרי אישור עיצוב — 30%', 'תשלום אמצעי בסיום שלב העיצוב',     'done',    20, v_user_id),
    (v_project_id, 'finance', 'בסיום הפיתוח — 30%', 'תשלום שלישי לפני QA',                  'pending', 30, v_user_id),
    (v_project_id, 'finance', 'עליה לאוויר — 10%',     'יתרת התשלום לאחר עליה לאוויר',     'pending', 40, v_user_id);

  -- ── Spec: deliverables checklist (client to provide) ──────────────
  delete from checklist_items where project_id = v_project_id and workspace = 'spec';
  insert into checklist_items (project_id, workspace, title, description, status, position, created_by) values
    (v_project_id, 'spec', 'לוגו ב-SVG ו-PNG',         'גרסת צבע ושחור-לבן',          'done',        10, v_user_id),
    (v_project_id, 'spec', 'ספר מותג / Brand book',     'אם קיים — קובץ PDF',           'done',        20, v_user_id),
    (v_project_id, 'spec', 'תמונות איכותיות',           'מינימום 30 תמונות במידות גדולות', 'in_progress', 30, v_user_id),
    (v_project_id, 'spec', 'גישה לחשבונות חברתיים',     'אינסטגרם, פייסבוק לאיסוף תוכן',  'pending',     40, v_user_id),
    (v_project_id, 'spec', 'רשימת כותבי תוכן',          'מי כותב טקסטים לאתר',           'pending',     50, v_user_id);

  -- ── Design: 5 page approvals ─────────────────────────────────────
  delete from client_approvals where project_id = v_project_id and workspace = 'design';
  insert into client_approvals (project_id, workspace, title, description, link_url, status, status_note, status_changed_by, status_changed_at, position, created_by, metadata) values
    (v_project_id, 'design', 'דף הבית',         'Hero ראשי, גריד תכונות, אטרקציות נבחרות, טסטימוניאלס, CTA',     'https://www.figma.com/file/example/ninja-tours/home', 'approved',          'מאושר. אהבתי במיוחד את הגוונים', v_user_id, now() - interval '5 days', 10, v_user_id,
     '{"desktop_url":"https://www.figma.com/file/example/home-desktop","mobile_url":"https://www.figma.com/file/example/home-mobile"}'::jsonb),
    (v_project_id, 'design', 'אודות',           'סיפור החברה, חברי צוות, וערכים',                                  'https://www.figma.com/file/example/about',           'changes_requested', 'הצוות נראה רחוק מדי, אפשר להגדיל ולקרב? ואת הטקסט הראשי לקצר במחצית', v_user_id, now() - interval '2 days', 20, v_user_id,
     '{"desktop_url":"https://www.figma.com/file/example/about-desktop","mobile_url":"https://www.figma.com/file/example/about-mobile"}'::jsonb),
    (v_project_id, 'design', 'ארכיון אטרקציות', 'גריד אטרקציות + פילטרים לפי קטגוריה ויעד',                       'https://www.figma.com/file/example/attractions',     'pending',           null, null, null, 30, v_user_id,
     '{"desktop_url":"https://www.figma.com/file/example/attractions-desktop","mobile_url":"https://www.figma.com/file/example/attractions-mobile"}'::jsonb),
    (v_project_id, 'design', 'אטרקציה (single)','תבנית עמוד אטרקציה בודד',                                          'https://www.figma.com/file/example/attraction-single','pending',           null, null, null, 40, v_user_id,
     '{"desktop_url":"https://www.figma.com/file/example/attraction-single-desktop","mobile_url":"https://www.figma.com/file/example/attraction-single-mobile"}'::jsonb),
    (v_project_id, 'design', 'צור קשר',         'טופס + פרטי קשר + מפה',                                            'https://www.figma.com/file/example/contact',         'pending',           null, null, null, 50, v_user_id,
     '{"desktop_url":"https://www.figma.com/file/example/contact-desktop","mobile_url":"https://www.figma.com/file/example/contact-mobile"}'::jsonb);

  select id into v_appr_home_d  from client_approvals where project_id=v_project_id and workspace='design' and title='דף הבית';
  select id into v_appr_about_d from client_approvals where project_id=v_project_id and workspace='design' and title='אודות';
  select id into v_appr_attr_d  from client_approvals where project_id=v_project_id and workspace='design' and title='ארכיון אטרקציות';

  -- ── Development: 5 frontend approvals ─────────────────────────────
  delete from client_approvals where project_id = v_project_id and workspace = 'development';
  insert into client_approvals (project_id, workspace, title, description, link_url, status, position, created_by) values
    (v_project_id, 'development', 'דף הבית — staging',  'גרסת פרונט לבדיקה',    'https://staging.ninja-tours.co.il/',          'pending', 10, v_user_id),
    (v_project_id, 'development', 'אודות — staging',    'גרסת פרונט לבדיקה',    'https://staging.ninja-tours.co.il/about',     'pending', 20, v_user_id),
    (v_project_id, 'development', 'אטרקציות — staging', 'ארכיון עם פילטרים',    'https://staging.ninja-tours.co.il/attractions','pending', 30, v_user_id),
    (v_project_id, 'development', 'צור קשר — staging',  'טופס פעיל',             'https://staging.ninja-tours.co.il/contact',   'pending', 40, v_user_id),
    (v_project_id, 'development', 'תקנון — staging',     '',                      'https://staging.ninja-tours.co.il/terms',     'pending', 50, v_user_id);

  select id into v_appr_home_dev from client_approvals where project_id=v_project_id and workspace='development' and title='דף הבית — staging';

  -- ── QA: testing checklist ─────────────────────────────────────────
  delete from checklist_items where project_id = v_project_id and workspace = 'qa';
  insert into checklist_items (project_id, workspace, title, description, status, position, created_by) values
    (v_project_id, 'qa', 'בדיקת responsive בכל המסכים', 'iPhone, אנדרואיד, iPad, דסקטופ', 'pending', 10, v_user_id),
    (v_project_id, 'qa', 'בדיקת טופס יצירת קשר',         'שליחה והגעה למייל',              'pending', 20, v_user_id),
    (v_project_id, 'qa', 'בדיקת מהירות (Lighthouse)',    'מינימום 90 ב-Performance',       'pending', 30, v_user_id),
    (v_project_id, 'qa', 'בדיקת SEO (כותרות, meta)',     'tags, og:image, canonical',       'pending', 40, v_user_id),
    (v_project_id, 'qa', 'בדיקת נגישות',                 'WCAG AA',                         'pending', 50, v_user_id),
    (v_project_id, 'qa', 'בדיקת RTL וטקסטים בעברית',     'דגש על מספרים, תאריכים',          'pending', 60, v_user_id),
    (v_project_id, 'qa', 'תאימות דפדפנים',               'Chrome, Safari, Firefox, Edge',   'pending', 70, v_user_id),
    (v_project_id, 'qa', 'בדיקת קישורים שבורים',         'כל הלינקים הפנימיים והחיצוניים',  'pending', 80, v_user_id);

  -- ── Content: deliverables ─────────────────────────────────────────
  delete from checklist_items where project_id = v_project_id and workspace = 'content';
  insert into checklist_items (project_id, workspace, title, description, status, position, created_by) values
    (v_project_id, 'content', 'תוכן עמוד הבית',         'כותרות, תיאורים, CTA',                'pending', 10, v_user_id),
    (v_project_id, 'content', 'טקסט עמוד אודות',       'סיפור החברה (~300 מילים)',           'pending', 20, v_user_id),
    (v_project_id, 'content', 'ביוגרפיות חברי הצוות',   '4 חברי צוות עם תמונה ותיאור קצר',     'pending', 30, v_user_id),
    (v_project_id, 'content', '12 אטרקציות ראשוניות',   'תיאור + תמונה + קטגוריה לכל אחת',     'pending', 40, v_user_id),
    (v_project_id, 'content', '4 חבילות טיול מובילות',  'כותרת, תיאור, מחיר, אייקונים',        'pending', 50, v_user_id),
    (v_project_id, 'content', 'טקסטי עמוד יצירת קשר',   'כותרות וטקסטי השירה',                 'pending', 60, v_user_id);

  -- ── Integrations: marketing/analytics ─────────────────────────────
  delete from checklist_items where project_id = v_project_id and workspace = 'integrations';
  insert into checklist_items (project_id, workspace, title, description, input_type, status, position, created_by) values
    (v_project_id, 'integrations', 'Google Tag Manager',    'הזינו את ה-GTM ID',                              'text', 'pending', 10, v_user_id),
    (v_project_id, 'integrations', 'Google Analytics 4',    'GA4 Measurement ID (G-XXXX)',                     'text', 'pending', 20, v_user_id),
    (v_project_id, 'integrations', 'פיקסל פייסבוק',          'Pixel ID (15 ספרות)',                            'text', 'pending', 30, v_user_id),
    (v_project_id, 'integrations', 'מערכת דיוור (Mailchimp)','API Key + List ID',                              'text', 'pending', 40, v_user_id),
    (v_project_id, 'integrations', 'Hotjar / מפת חום',       'Site ID',                                         'text', 'pending', 50, v_user_id),
    (v_project_id, 'integrations', 'WhatsApp Business',      'מספר ה-WhatsApp לכפתור הצף',                    'text', 'pending', 60, v_user_id);

  -- ── Launch checklist ──────────────────────────────────────────────
  delete from checklist_items where project_id = v_project_id and workspace = 'launch';
  insert into checklist_items (project_id, workspace, title, description, status, position, created_by) values
    (v_project_id, 'launch', 'הגדרת אחסון',                  'Cloudways VULTR HF 2GB',                            'done',    10, v_user_id),
    (v_project_id, 'launch', 'התקנת SSL',                    'Lets Encrypt דרך Cloudways',                       'done',    20, v_user_id),
    (v_project_id, 'launch', 'גיבויים אוטומטיים יומיים',     'Cloudways native + Updraft חיצוני',                 'pending', 30, v_user_id),
    (v_project_id, 'launch', 'העברת DNS',                    'הצבעת A record ל-IP של Cloudways',                  'pending', 40, v_user_id),
    (v_project_id, 'launch', 'בדיקות סופיות בפרודקשן',       'כל מה שעבר QA + טופס + תשלום',                      'pending', 50, v_user_id),
    (v_project_id, 'launch', 'הגשה ל-Google Search Console', 'Sitemap + verification',                            'pending', 60, v_user_id),
    (v_project_id, 'launch', 'מעקב ראשוני אחרי עליה',         '24 שעות ראשונות — לבדוק error logs',                'pending', 70, v_user_id),
    (v_project_id, 'launch', 'שליחת אישור ללקוח',            'מייל סיכום + לינק לפרודקשן + הוראות תחזוקה',         'pending', 80, v_user_id);

  -- ── Project files (placeholders with public image URLs) ───────────
  -- Finance
  delete from project_files where project_id = v_project_id and workspace = 'finance';
  insert into project_files (project_id, workspace, category, filename, storage_path, file_url, mime_type, size_bytes, uploaded_by) values
    (v_project_id, 'finance', 'signed_quote', 'הצעת-מחיר-חתומה.pdf', v_project_id::text || '/files/finance/signed-quote.pdf', 'https://example.com/files/quote.pdf',   'application/pdf', 245000, v_user_id),
    (v_project_id, 'finance', 'invoice',      'חשבונית-מקדמה.pdf',    v_project_id::text || '/files/finance/invoice-1.pdf',   'https://example.com/files/invoice1.pdf','application/pdf', 180000, v_user_id),
    (v_project_id, 'finance', 'invoice',      'חשבונית-עיצוב.pdf',    v_project_id::text || '/files/finance/invoice-2.pdf',   'https://example.com/files/invoice2.pdf','application/pdf', 175000, v_user_id);

  -- Spec
  delete from project_files where project_id = v_project_id and workspace = 'spec';
  insert into project_files (project_id, workspace, category, filename, storage_path, file_url, mime_type, size_bytes, uploaded_by) values
    (v_project_id, 'spec', 'interview_summary', 'סיכום-ראיון.pdf', v_project_id::text || '/files/spec/interview.pdf', 'https://example.com/files/interview.pdf', 'application/pdf', 320000, v_user_id),
    (v_project_id, 'spec', 'content_spec',      'אפיון-תוכן.pdf',  v_project_id::text || '/files/spec/content-spec.pdf', 'https://example.com/files/content-spec.pdf', 'application/pdf', 480000, v_user_id),
    (v_project_id, 'spec', 'client_materials',  'logo.svg',         v_project_id::text || '/files/spec/logo.svg', 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=400', 'image/svg+xml',  18000,  v_user_id),
    (v_project_id, 'spec', 'client_materials',  'תמונת-מותג-1.jpg', v_project_id::text || '/files/spec/brand-1.jpg', 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1200', 'image/jpeg', 1200000, v_user_id),
    (v_project_id, 'spec', 'client_materials',  'תמונת-מותג-2.jpg', v_project_id::text || '/files/spec/brand-2.jpg', 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1200',   'image/jpeg', 1100000, v_user_id);

  -- Design
  delete from project_files where project_id = v_project_id and workspace = 'design';
  insert into project_files (project_id, workspace, category, filename, storage_path, file_url, mime_type, size_bytes, uploaded_by) values
    (v_project_id, 'design', 'brand', 'brand-book-final.pdf',         v_project_id::text || '/files/design/brand-book.pdf',   'https://example.com/files/brand-book.pdf', 'application/pdf', 4500000, v_user_id),
    (v_project_id, 'design', 'brand', 'color-palette.png',            v_project_id::text || '/files/design/colors.png',        'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200', 'image/png',  450000,  v_user_id);

  -- Training files
  delete from project_files where project_id = v_project_id and workspace = 'training';
  insert into project_files (project_id, workspace, filename, storage_path, file_url, mime_type, size_bytes, uploaded_by) values
    (v_project_id, 'training', 'מדריך-וורדפרס.pdf', v_project_id::text || '/files/training/wp-guide.pdf', 'https://example.com/files/wp-guide.pdf', 'application/pdf', 2400000, v_user_id),
    (v_project_id, 'training', 'מדריך-עריכת-תוכן.pdf', v_project_id::text || '/files/training/content-guide.pdf', 'https://example.com/files/content-guide.pdf', 'application/pdf', 1800000, v_user_id);

  -- ── Comment threads + messages ────────────────────────────────────
  -- Thread on the "אודות" design approval (the changes-requested one)
  insert into comment_threads (project_id, context_type, context_id, workspace, title, status, priority, created_by, created_at, updated_at)
  values (v_project_id, 'approval', v_appr_about_d, 'design', 'אודות — בקשת תיקון', 'in_progress', 'normal', v_user_id, now() - interval '2 days', now() - interval '4 hours')
  returning id into v_thread_id;

  insert into comment_messages (thread_id, author_id, author_label, body, created_at) values
    (v_thread_id, v_user_id, 'הלקוח', 'הצוות נראה רחוק מדי. אפשר להגדיל את התמונות ולקרב? גם הטקסט הראשי ארוך מדי לדעתי, אפשר לקצר במחצית?', now() - interval '2 days'),
    (v_thread_id, v_user_id, 'מעצב הסטודיו', 'ברור! אעדכן עד מחר. גם נחשוב על הטקסט עם הקופירייטר.', now() - interval '1 day 6 hours'),
    (v_thread_id, v_user_id, 'הלקוח', 'מצוין, תודה!', now() - interval '4 hours');

  -- Workspace thread on design (general)
  insert into comment_threads (project_id, context_type, workspace, title, status, priority, created_by, created_at, updated_at)
  values (v_project_id, 'workspace', 'design', 'תגובות כלליות — עיצוב', 'open', 'normal', v_user_id, now() - interval '7 days', now() - interval '1 day');

  -- ── Support tickets ───────────────────────────────────────────────
  insert into comment_threads (project_id, context_type, workspace, title, status, priority, created_by, created_at, updated_at)
  values (v_project_id, 'ticket', 'support', 'טופס יצירת הקשר לא שולח מיילים', 'in_progress', 'urgent', v_user_id, now() - interval '6 hours', now() - interval '1 hour')
  returning id into v_ticket_id;

  insert into comment_messages (thread_id, author_id, author_label, body, created_at) values
    (v_ticket_id, v_user_id, 'הלקוח',           'אנשים ממלאים את הטופס באתר אבל אנחנו לא מקבלים את המיילים. בדוק דחוף, מאבדים לידים!', now() - interval '6 hours'),
    (v_ticket_id, v_user_id, 'דניאל / סטודיו', 'בודק עכשיו, נראה שיש בעיה עם ה-SMTP. אעדכן בעוד שעה.', now() - interval '5 hours'),
    (v_ticket_id, v_user_id, 'דניאל / סטודיו', 'הבעיה אותרה — ה-API key של Mailgun היה לא נכון. עדכנתי, נבדק.', now() - interval '1 hour');

  insert into comment_threads (project_id, context_type, workspace, title, status, priority, created_by, created_at)
  values (v_project_id, 'ticket', 'support', 'בקשת שינוי קטן בתפריט', 'open', 'normal', v_user_id, now() - interval '3 days');

  -- ── Activity log ──────────────────────────────────────────────────
  delete from activity_log where project_id = v_project_id and entity_type in ('seed');
  insert into activity_log (project_id, actor_id, kind, entity_type, summary, created_at) values
    (v_project_id, v_user_id, 'created', 'page',    'נוצר עמוד הבית עם 7 סקשנים מתוך ניתוח של Claude', now() - interval '20 days'),
    (v_project_id, v_user_id, 'updated', 'project', 'שלב הפרויקט עודכן ל-design', now() - interval '15 days'),
    (v_project_id, v_user_id, 'created', 'cpt',     'נוסף CPT: אטרקציות', now() - interval '14 days'),
    (v_project_id, v_user_id, 'created', 'cpt',     'נוסף CPT: חבילות טיול', now() - interval '14 days'),
    (v_project_id, v_user_id, 'updated', 'design',  'אישור עיצוב לדף הבית התקבל', now() - interval '5 days'),
    (v_project_id, v_user_id, 'updated', 'design',  'בקשת תיקון לעמוד אודות', now() - interval '2 days'),
    (v_project_id, v_user_id, 'created', 'ticket',  'טיקט תמיכה דחוף — טופס לא שולח', now() - interval '6 hours'),
    (v_project_id, v_user_id, 'updated', 'ticket',  'דניאל החל לעבוד על הטיקט', now() - interval '5 hours');

  -- ── Notifications for the studio admin (skip if table not yet migrated) ──
  if to_regclass('public.notifications') is not null then
    execute 'delete from notifications where user_id = $1 and project_id = $2 and kind in (''approval'',''ticket'',''comment'')'
      using v_user_id, v_project_id;
    execute $sql$
      insert into notifications (user_id, project_id, kind, title, body, link, read_at, created_at) values
        ($1, $2, 'approval', 'בקשה לתיקון: אודות',                   'הצוות נראה רחוק מדי. אפשר להגדיל ולקרב?', '/projects/ninja-tours/manage/design',  null, now() - interval '2 days'),
        ($1, $2, 'ticket',   'טיקט דחוף: טופס יצירת הקשר לא שולח',  'אנשים ממלאים את הטופס באתר אבל...',     '/projects/ninja-tours/manage/support', null, now() - interval '6 hours'),
        ($1, $2, 'comment',  'תגובה חדשה: אודות',                   'מצוין, תודה!',                            '/projects/ninja-tours/manage/design',  null, now() - interval '4 hours'),
        ($1, $2, 'approval', 'אושר: דף הבית',                       'הלקוח אישר את עיצוב דף הבית',             '/projects/ninja-tours/manage/design',  now() - interval '5 days', now() - interval '5 days'),
        ($1, $2, 'comment',  'הלקוח כתב על אודות',                  'הצוות נראה רחוק מדי...',                  '/projects/ninja-tours/manage/design',  now() - interval '1 day', now() - interval '2 days')
    $sql$ using v_user_id, v_project_id;
  else
    raise notice 'notifications table not found — skipping notifications seed (run migration 0014_notifications.sql first)';
  end if;

  raise notice 'Seed complete for project %', v_project_id;
end $$;
