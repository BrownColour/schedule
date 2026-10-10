# Trimester

MBA academic planner for two profiles (S and K), built with Next.js 14 + Supabase.

---

## Setup

### 1. Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In the project dashboard, open **SQL Editor**.
3. Paste the contents of `supabase/schema.sql` and click **Run**. This creates all tables, types, indexes and RLS policies.
4. Go to **Settings → API**. Copy:
   - **Project URL** — looks like `https://xxxx.supabase.co`
   - **anon / public key** — starts with `eyJ…`

The anon key is safe to expose in frontend code. Access is controlled by the RLS policies, which allow all operations (no auth is used; profiles are just an enum column).

### 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Deploy to Vercel

1. Push this folder to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Framework preset: **Next.js**. Click **Deploy**.

---

## Profiles

No authentication. On first open the app asks whether you are **S** or **K** — this is stored in `localStorage`. All data in Supabase is tagged with a `profile` column (`S` or `K`) so both users share one database but see separate events, courses and attendance.

To switch profiles: go to **Settings → Profile** and pick the other profile. You'll see a warning before switching. To reset completely, clear site data in your browser.

---

## Features

- **Today tab**: side-by-side comparison table for today and tomorrow (your column + the other person's), live now-line, coming week agenda.
- **Calendar**: Day, Week, Month, and full-Trimester agenda views.
- **Courses**: create courses with name, code, professor, credit type (half/full), colour, notes. Session counts tracked automatically.
- **Attendance**: per-session, per-course. Default is Present; click to toggle Absent. Shows percentage and warns when below 75%.
- **Events**: 9 types including sessions, tests, assignments, projects, exams. Assignment/project types show a dashed border. Recurring weekly sessions. Reschedule (cancels original, creates linked replacement). Session numbers derived at render time so cancelling one renumbers the rest.
- **Settings**: trimester management, profile switcher, dark/light toggle, JSON backup download, manual sync.
- **Optimistic UI**: every save applies immediately on screen; rolled back with a toast if the network request fails.
