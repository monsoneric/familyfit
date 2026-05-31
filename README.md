# Family Fit — Phase 1

A family fitness challenge web app built with React + Vite + Supabase.

---

## Setup (15 minutes)

### 1. Create a Supabase project
1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Click **New project** — name it "familyfit"
3. Wait ~2 minutes for provisioning

### 2. Run the schema
1. In your Supabase dashboard, go to **SQL Editor → New query**
2. Paste the contents of `schema.sql`
3. Click **Run**
4. You should see "Success" — your tables, views, and seed data are ready

### 3. Get your API keys
In Supabase: **Project Settings → API**
- Copy **Project URL**
- Copy **anon / public** key

### 4. Configure the app
```bash
cp .env.example .env
```
Edit `.env`:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Install and run
```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173)

---

## Default passcode
The seed SQL sets the default passcode to: **`familyfit2025`**

To change it:
1. Run `sha256sum` on your new passcode (or use an online SHA-256 tool)
2. Update the `passcode_hash` row in the `settings` table via Supabase dashboard

---

## Deploy to Vercel (free)
1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → Import project → select your repo
3. Add environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
4. Click Deploy — done. Share the URL with your family.

---

## Project structure
```
src/
  lib/
    supabase.js    — Supabase client
    auth.js        — Passcode login, localStorage session
    queries.js     — All database calls
  hooks/
    useRealtime.js — Live leaderboard subscriptions
  components/
    Avatar.jsx     — Color-coded member avatars
    NavBar.jsx     — Top navigation
    ProgressBar.jsx
    StatCard.jsx
  pages/
    LoginPage.jsx  — Passcode + member selector
    DashboardPage.jsx — Live leaderboard per challenge
    LogPage.jsx    — Activity logging form
    FeedPage.jsx   — Real-time activity feed
    ManagePage.jsx — Members, challenge creation
  App.jsx          — Root router
```

---

## Phase 2 (next)
- Progress charts (Recharts)
- Team challenges
- Emoji reactions on feed
- Edit/delete activities
- All exercise types

## Phase 3
- Strava/Garmin auto-sync
- Push notifications
- Mobile PWA
- Badges and streaks
