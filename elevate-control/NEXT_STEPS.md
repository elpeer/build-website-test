# Next Steps — Elevate Control

You have a working Phase 1 scaffold. To bring it online, follow these steps.

## 1. Apply the database schema (5 minutes)

The migration is at `supabase/migrations/0001_initial_schema.sql`.

**Option A — Supabase SQL Editor (quickest):**
1. Open https://siohhswzfuckkdhpuyop.supabase.co/project/_/sql
2. Click "New Query"
3. Paste the entire contents of `0001_initial_schema.sql`
4. Click "Run"
5. Verify in the Table Editor that all 10 tables appeared

**Option B — Supabase CLI:**
```bash
cd elevate-control
npx supabase login
npx supabase link --project-ref siohhswzfuckkdhpuyop
npx supabase db push
```

After it runs successfully, regenerate the TypeScript types from the live schema:
```bash
npx supabase gen types typescript --project-id siohhswzfuckkdhpuyop > lib/supabase/database.types.ts
```
This replaces the hand-written placeholder types with the real ones.

## 2. Initialize as its own Git repo (2 minutes)

```bash
cd elevate-control
git init
git add -A
git commit -m "Initial scaffold: schema + Next.js + auth + dashboard"
gh repo create elevate-control --private --source=. --remote=origin
git push -u origin main
```

## 3. Set up environment variables (3 minutes)

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL="https://siohhswzfuckkdhpuyop.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_mPoesxiyCvldMhp9D55Baw_DSaI42qL"
SUPABASE_SECRET_KEY="<the secret key — never commit this>"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 4. Install dependencies and run (3 minutes)

```bash
pnpm install            # or npm install / yarn install
pnpm dev                # → http://localhost:3000
```

Visit http://localhost:3000 — you should be redirected to `/sign-in`. Enter your email, get a magic-link, click it, land on `/projects` (empty list).

## 5. Create yourself as the first studio admin

After signing in via magic-link, your auth user is created automatically (with a profile row triggered by the schema). To grant yourself studio-admin privileges, run this SQL in Supabase SQL Editor:

```sql
update profiles
set studio_admin = true,
    role = 'super_admin'
where email = 'your-email@example.com';
```

You should now see the "אדמין" section in the sidebar.

## 6. Deploy to Vercel (5 minutes)

```bash
npm i -g vercel
vercel
```

Or push to GitHub and import the repo at https://vercel.com/new — it auto-detects Next.js. Then add the same env vars in Vercel Settings → Environment Variables (use the production Supabase URL/keys).

After deploy, update Supabase Auth's redirect URLs:
- Supabase Dashboard → Authentication → URL Configuration
- Add `https://your-vercel-url.vercel.app/auth/callback` to the allow list

## 7. Configure email templates (optional polish)

Supabase Dashboard → Authentication → Email Templates → Magic Link

Customize the Hebrew copy:
```html
<h2>הגעת לקישור ההתחברות שלך ל-Elevate Control</h2>
<p>לחץ על הקישור הבא כדי להיכנס. הקישור תקף 60 דקות.</p>
<p><a href="{{ .ConfirmationURL }}">התחברות</a></p>
```

## What's next (Phase 2+)

After Phase 1 is live and you've created your first project manually through SQL or by building a `/projects/new` form, the next features are:

1. **Project detail page** (`/projects/[slug]`) — page tree, member list, designs
2. **Project creation form** — slug, name, client, PM
3. **Page editor** — CRUD for pages within a project
4. **Section editor** — add/reorder/configure sections on a page
5. **Design upload UI** — drag-and-drop into a project, with viewport detection
6. **Crop tool** — draw rectangles on a design to mark section regions
7. **Activity feed** — real-time stream from `activity_log` via Supabase Realtime

I can build any of these on demand — just point me at the priority and I'll implement. The data layer is ready, the UI patterns are set, the auth is solid.

## Troubleshooting

**Magic link redirects to `localhost` from production** → Check that `NEXT_PUBLIC_APP_URL` is set to your Vercel URL in production env vars. The callback URL is computed from this.

**RLS blocks me from seeing my own data** → You're not yet `studio_admin` and not a `project_member`. Run the SQL in step 5.

**`Cannot read properties of null (reading 'auth')`** → Env vars aren't loaded. Check `.env.local` exists and Next.js is running with `pnpm dev` (not pre-built).

**Migration fails: type already exists** → Drop the existing types first, or re-create the schema in a fresh Supabase project. The migration assumes a clean DB.
