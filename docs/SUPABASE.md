# Turning on accounts

Accounts are optional. Without them the site works exactly as it does now —
your vault saves in the browser. With them, the same vault follows you to any
device you sign in on.

Four steps, about ten minutes.

---

## 1. Create the project

[supabase.com](https://supabase.com) → **New project**. Any region; the free
tier is enough. Wait for it to finish provisioning.

## 2. Create the table

**SQL Editor → New query**, paste the whole of `supabase/schema.sql`, **Run**.

That creates one table, `user_state` — a single row per account holding that
account's whole vault as JSON — with row level security switched on, so an
account can only ever read and write its own row. It also adds a trigger that
gives every new signup an empty row.

## 3. Fill in the environment

Two values, both from **Project Settings**:

| Variable | Where to find it |
|---|---|
| `SUPABASE_URL` | Project Settings → **Data API** → Project URL |
| `SUPABASE_ANON_KEY` | Project Settings → **API Keys** → `anon` / `public` |

**In Vercel:** Settings → Environment Variables → add both → **Redeploy**.
They are read at build time, so a change only takes effect on the next build.

**Locally:** copy `.env.example` to `.env.local` and fill the same two in.

> The anon key is *meant* to be public — it ends up in the page, and row level
> security is what actually protects the data. Do **not** put the
> `service_role` key here; it bypasses every policy.

## 4. Decide about email confirmation

**Authentication → Sign In / Providers → Email.**

- **Confirm email ON** (the default) — a new account has to click a link
  before it can sign in. Safer, and the sign-up form says so.
- **Confirm email OFF** — signing up signs you straight in. Easier if the
  site is only for you and a few people.

Either works; the app handles both.

---

## What happens once it is on

A **Sign in** chip appears in the top bar of every page, and
`/pages/account.html` has the form.

- **Signed out** — everything works, saved in that browser. Same as today.
- **Signing in for the first time** — whatever is already in that browser is
  uploaded, so nothing you have ticked is lost.
- **Signed in** — changes are pushed a couple of seconds after you make them,
  and pulled down when you sign in somewhere else.

### What is synced

Everything of yours that cannot be fetched again: watch progress, the shows
and anime you added, filler marks, hidden shows, the order you dragged cards
into.

Deliberately **not** synced: cached season and episode data, and the OMDb
cache. Both come back from the API on demand, and storing them would make
every sync large and — worse — stale, since a show that gained a season would
come back from the database missing it.

### If two devices disagree

Last write wins, on the app's own clock. Two devices edited while both offline
will not merge — the one that saves later overwrites. That is a deliberate
simplification for a personal tracker; a real merge needs a timestamp per
episode, which is a lot of machinery for the problem.

---

## Checking it works

1. Sign up. **Table Editor → user_state** should show a row for you.
2. Tick an episode, wait two seconds, refresh that row — `data` should have
   changed and `client_updated` gone up.
3. Sign in on another browser. Your vault should appear.

If nothing lands: open the console. `window.MV_CONFIG` should hold your URL
and key — if the values are empty strings, the build did not see the
environment variables, and a redeploy after setting them fixes it.
