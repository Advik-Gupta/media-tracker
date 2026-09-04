# Deploying Media Vault

The site is static: the build turns your data into plain HTML, and any host
that can serve files can serve it. The only thing that is not static is
**adding a series**, which runs a script. That is solved with a GitHub Action,
so you never need a terminal after the initial push.

Total time: about fifteen minutes, most of it waiting.

---

## What you get

| | |
|---|---|
| Live site | `https://<you>.github.io/<repo>/` |
| Adding a show or anime | Actions tab → *Add a series* → fill a box → Run |
| Removing / merging | Actions tab → *Manage series* |
| Cost | Free |
| Your progress | Stored in your browser, not on the server |

---

## Step 1 — Put it on GitHub

From the project folder:

```bash
git init
git add -A
git commit -m "Media Vault"
```

Create an **empty** repository on github.com — no README, no .gitignore, it
already has both. Then, using the URL it gives you:

```bash
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

> **A note on the folder name.** This project lives in a folder with a colon
> in its name (`Series:Movies Record`). Git handles that fine, but if you ever
> clone it somewhere and npm scripts fail with *"command not found"*, a colon
> in the path is why — it is the `PATH` separator. Renaming the folder fixes
> it. The scripts here call `node` directly, so they work either way.

## Step 2 — Turn on Pages

In the repository: **Settings → Pages → Build and deployment → Source**, and
choose **GitHub Actions**. Not "Deploy from a branch" — the Action publishes
the built site.

## Step 3 — Let Actions write to the repo

**Settings → Actions → General → Workflow permissions**, choose
**Read and write permissions**, and Save.

This is what lets *Add a series* commit the data it fetches. Without it the
add will run, fetch correctly, and then fail at the last step.

## Step 4 — Deploy

The first push already triggered it. Check the **Actions** tab: a *Deploy* run
should be green in a minute or two. Your site is at

```
https://<you>.github.io/<repo>/
```

If the run is not there, go to Actions → *Deploy* → **Run workflow**.

---

## Adding a series without a terminal

**Actions → Add a series → Run workflow.**

| Field | What to put |
|---|---|
| Name, or a TMDB id | `severance`, or `95396` |
| Which vault | `show` or `anime` |

An id is exact; a name is a search and takes the best match. If a name gets
you the wrong thing, search it on
[themoviedb.org](https://www.themoviedb.org/) and use the number from the URL.

It fetches every season and episode with ratings, commits, and the deploy
follows automatically. Two runs, about three minutes total, and the show is
live.

**Managing what is there** — Actions → *Manage series*:

- **remove** — takes the series id (the bit in its page URL, e.g. `severance`)
- **merge** — folds one into another. Parent `breakingbad`, child
  `bettercallsaul` gives one card holding both, and progress moves with it.

---

## What is not on the server

**Everything you have ticked lives in your browser**, in `localStorage`. That
has three consequences worth knowing before you rely on it:

- The deployed site starts empty even though localhost is full. They are
  different origins, and storage does not cross between them.
- Your progress does not follow you between devices, or between Chrome and
  Safari on the same one.
- Clearing site data clears your progress.

There is an **export/import** in the data panel on the home page. Use it once
right after deploying to carry your progress over, and now and then as a
backup. Real cross-device sync needs accounts and a database — that is the
Supabase route, and nothing here blocks it later.

---

## Optional: live search and preview when adding a show

The repo has an `api/` folder — three small serverless functions
(`api/search.js`, `api/show/[id].js`, `api/show/[id]/seasons.js`) that proxy
seriesgraph.com from the server, where its missing CORS header does not
matter. **These only run on a host that executes serverless functions —
Vercel is what they are written for. GitHub Pages cannot run them**; it only
serves files.

With them deployed, the *Add show* panel does more than hand you a command:
type a name, and after the same 1.5s debounce you get real search results,
and picking one shows the poster, synopsis, season and episode count, and
whether it is still airing — before you copy the command. Without them (any
static host, or Vercel before you deploy the functions), the panel detects
the 404 and falls back to the exact same command-only flow as before. Nothing
breaks either way; this is a nice-to-have layered on top of the GitHub Pages
setup above, not a replacement for it.

**They are also still just proxies.** A browser cannot write to your repo, so
the command is still how a show actually gets added — the point of `api/` is
a real look at what you are about to add, not skipping the command.

To use it: deploy the same repo to [vercel.com](https://vercel.com) as well
(import the GitHub repo, framework preset "Other", no build command needed —
Vercel serves `api/` automatically and the static files as-is). Point people
at whichever URL you want as the main one; the two deploys are independent
and both stay in sync with the same `main` branch.

---

## Where the data comes from

Two of the three sources cannot be called from a browser, which is why the
build bakes their answers into the repo rather than fetching at page load:

| Source | Used for | In the browser? |
|---|---|---|
| seriesgraph.com | Seasons, episodes, ratings | **No** — no CORS header. Build only. |
| ratingraph.com | Genres, ratings, synopses | Search **yes**, detail pages **no**. |
| OMDb | Cast, credits, awards, box office | **Yes** — used live on My List. |

So the site works offline-ish and fast, and the one thing that needs to be
live — looking up a title when you add it to My List — is the one thing that
is allowed to be.

The OMDb key sits in `assets/js/omdb.js` and ships to the browser. That is
normal for OMDb's free tier, but it is visible to anyone who views source, and
it is rate-limited to 1,000 requests a day across everyone using your site.
If that ever matters, put the key behind a small proxy.

---

## Other hosts

Netlify or Vercel work the same way and are marginally simpler for the deploy
half: point them at the repo, set the build command to `npm run build` and the
publish directory to `.`. You would still use the GitHub Actions above for
adding series, since that is about committing data rather than about hosting.

---

## When something breaks

**The site is up but every page is unstyled.** Pages is serving from a branch
instead of the Action. Settings → Pages → Source → GitHub Actions.

**Add a series ran green but nothing changed.** It found nothing for that
name. Open the run log — it says which titles it skipped. Use a TMDB id.

**Add a series failed on the commit step.** Workflow permissions are still
read-only. Step 3.

**A card 404s.** The build refuses to publish a bad link, so this means the
build did not run. Check the Actions tab for a failed *Deploy*.

**Everything looks a version behind.** The deploy runs after the commit, so a
content workflow means two runs. Wait for the second.
