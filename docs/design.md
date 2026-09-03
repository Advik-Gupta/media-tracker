# Design Guidelines - Personal Media Library

A visual identity for a personal movie/show/book tracker (Letterboxd + IMDb + Goodreads, but yours). Direction: **library ledger / ticket stub** - the feeling of a well-kept card catalog crossed with a cinema box office, not a SaaS dashboard.

Hard rules for whoever builds this (human or Claude Code):

- No gradients, anywhere.
- No generic default sans (no unstyled Inter/Roboto used flatly everywhere with no type hierarchy).
- No pill-shaped tags with a leading dot. Ever.
- Border-radius stays small and consistent (2–6px) - this is not a bubbly, glassmorphic app.
- No drop shadows for depth - use borders and flat color separation instead.

---

## 1. Color Palette - Dark Mode (default)

| Name         | Hex       | Role                                                                      |
| ------------ | --------- | ------------------------------------------------------------------------- |
| Ink          | `#14161C` | App background                                                            |
| Slate        | `#1D212B` | Card / surface background                                                 |
| Line         | `#2B303D` | Borders, dividers, input outlines                                         |
| Bone         | `#EDE9DD` | Primary text (warm off-white, never pure white)                           |
| Fog          | `#8C90A0` | Secondary/muted text, timestamps, metadata                                |
| Marquee Gold | `#E3A83B` | Primary accent - ratings, active states, primary buttons, links           |
| Cinder       | `#C24430` | Secondary accent - "watched/completed" state and destructive actions only |
| Teal         | `#3D8C79` | "Currently watching/reading" / in-progress state only                     |

Rules:

- Never use more than one accent color in the same component at once.
- Marquee Gold is the only color allowed on primary CTA buttons.
- Backgrounds stay flat single colors - Ink and Slate only, no gradients between them.

## 1b. Color Palette - Light Mode (complete, not an inversion)

A single accent hex can't carry both a near-black and a near-white background - gold-on-Ink is high contrast, that same gold on a light background is close to invisible. Light mode gets its own darker, more saturated accent values, same hues, tuned for contrast on a light surface. Full spec, not a guess:

| Name                 | Hex       | Role                                                             |
| -------------------- | --------- | ---------------------------------------------------------------- |
| Bone                 | `#F7F4EC` | App background                                                   |
| Surface              | `#EDE8DC` | Card fill                                                        |
| Line                 | `#D8D2C2` | Borders, dividers                                                |
| Ink                  | `#14161C` | Primary text                                                     |
| Fog (light)          | `#6B6F7C` | Secondary/muted text                                             |
| Marquee Gold (light) | `#B8842A` | Primary accent - darker than dark-mode gold, meets 4.5:1 on Bone |
| Cinder (light)       | `#A83A28` | Secondary accent - completed/destructive                         |
| Teal (light)         | `#2F6E5D` | In-progress accent                                               |

Every accent color in this system therefore has two values, dark and light - never reuse the dark-mode hex on a light background, or vice versa.

---

## 2. Typography

Three-role system, all condensed/geometric - matches your reference fonts, none of them cursive or "friendly rounded."

| Role         | Font           | Used for                                                                            |
| ------------ | -------------- | ----------------------------------------------------------------------------------- |
| Display      | **Fjalla One** | Page titles, section headers, wordmark/logo, movie/show/book titles on detail pages |
| Body         | **Montserrat** | Paragraphs, descriptions, nav, buttons, form fields                                 |
| Data/Numeric | **Agdasima**   | Ratings, runtimes, page counts, release years, counts ("142 watched"), timestamps   |

Using Agdasima only for numbers is what keeps Montserrat from reading as "default AI app font" - the numeric face is the detail that makes the type system feel deliberate.

**Type scale** (px, use rem in code):

| Token      | Size | Weight | Font       | Tracking                   |
| ---------- | ---- | ------ | ---------- | -------------------------- |
| Display XL | 48   | 700    | Fjalla One | 0.5px                      |
| Display L  | 32   | 700    | Fjalla One | 0.5px                      |
| Heading    | 22   | 700    | Fjalla One | 0.25px                     |
| Body L     | 17   | 500    | Montserrat | normal                     |
| Body       | 15   | 400    | Montserrat | normal                     |
| Caption    | 13   | 500    | Montserrat | 0.2px                      |
| Data L     | 28   | 500    | Agdasima   | 0.5px                      |
| Data       | 18   | 500    | Agdasima   | 0.5px uppercase for labels |

Rules:

- Fjalla One is always uppercase or sentence case, never lowercase-as-style - it's a headline face, treat it like one.
- Never use Fjalla One for body paragraphs - it's condensed and gets hard to read below 20px.
- Montserrat stays at 400–600 weight; don't go to 700+ except on buttons.
- **Agdasima has a hard floor of 16px, anywhere, no exceptions.** It's a narrow/thin numeral face - below that it stops being legible, especially rotated inside the stamp (see §4). If a layout wants it smaller, redesign the layout, don't shrink the font.
- Line height: 1.4 for body, 1.15 for display/headings, 1.0 for data numbers.

---

## 3. Spacing & Layout

8px base unit. Everything is a multiple of 8 (4 allowed only for icon-to-label gaps).

`4 · 8 · 16 · 24 · 32 · 48 · 64 · 96`

- Page gutter: 24px mobile, 64px desktop.
- Card grid gap: 16px.
- Section vertical rhythm: 48–64px between major sections, 24px between related blocks.
- Max content width: 1200px, centered.

**Cover grid** (the core browsing surface):

- Grid: 6 cols desktop / 4 tablet / 3 mobile, 16px gutters.
- No card shadow. Separation comes from background vs card-fill color, plus a 1px Line border.
- **Aspect ratio is media-type-specific, not one-size-fits-all:**
  - Movies / shows: 2:3 (standard poster ratio).
  - Books: native cover ratio, roughly 2:3 to 1:1.6 - do not force-crop book covers to the film poster ratio, they're proportioned differently and cropping loses real cover art.
- Within a mixed grid (e.g. a combined "recently added" row), let each card's image box size to its own media type's ratio rather than clipping everything to a shared box.

```
[ Poster ]  [ Poster ]  [ Cover  ]  [ Poster ]
  Title       Title       Title       Title
  ★ Data      ★ Data      ★ Data      ★ Data
```

---

## 4. Signature Element - the Stamp

Every catalog app needs one memorable detail. Here: a **due-date stamp**, borrowed from library card catalogs, used as the rating/status marker on every cover card.

- A small rectangular tag in the bottom-left corner of each cover, background color of the surface it sits on, 1px Marquee Gold border, Data font (min 16px per §2), sitting flat at 0deg by default.
- Contains, depending on status:
  - Watched/finished: the rating (`8.4`).
  - Plan to watch/read: the release year (`2019`).
  - **Currently watching a show: progress instead of rating - `S2E6`.** This is a tracker for shows specifically; collapsing "watching" into a flat status loses the data people actually check. Same field, same font, just different content per state.
- **Rotation is a hover-only interaction, not a resting state.** At rest the stamp is flat (0deg) - across a grid of 100+ items, everything sitting at -2deg reads as noise, not craft. On hover/focus, it rotates to -2deg and "stamps down" with an 80ms scale from 1.05 → 1, no bounce/spring easing.

---

## 5. Components

**Buttons**

- Primary: Marquee Gold fill, Ink text, 4px radius, Montserrat 600, uppercase, 0.5px tracking.
- Secondary: transparent fill, 1px Line border, Bone (or Ink in light mode) text. Border becomes Marquee Gold on hover.
- Never use a filled Cinder button except for "Remove" / "Delete" confirmations.

**Status tags** (replaces pill+dot pattern - explicitly forbidden)

- Rectangular, 2px radius, 1px border, no leading dot/icon.
- Text only, Agdasima (min 16px), uppercase.
- Color-coded by border + text color only (not fill): Fog = "Plan to watch," Teal = "In progress," Cinder = "Completed."

```
┌ WATCHING ┐   ┌ COMPLETED ┐   ┌ PLANNED ┐
```

**Watchlist checkbox**

- Custom, not a native checkbox or a rounded toggle switch.
- Square outline (Line color), fills with a single-stroke checkmark in Marquee Gold on check - not an icon-font checkmark.

**Lists (Letterboxd-style user lists)**

- Numbered with Agdasima numerals, right-aligned, Fog color - list rank is real content here, not decoration, so numbering is justified.
- List row: cover thumbnail (native ratio, small) + title (Fjalla One, Body L size) + your rating/status (stamp, smaller but ≥16px) + Fog metadata line underneath.

**Icons**

- One outline-only icon set, consistent throughout (e.g. Lucide). 1.5px stroke, 20px default size.
- No filled icons, no duotone, no mixing icon packs - outline-only matches the flat/border aesthetic everywhere else in this system.
- Any icon-only button (search, sort, filter, menu) needs a visible text label on hover/focus at minimum; primary actions always ship with a label, per the icon-only rule in §7.

**Focus state (keyboard navigation)**

- Every interactive element - links, buttons, checkboxes, cards, list rows - gets a 2px Marquee Gold outline, 2px offset, on `:focus-visible`. No exceptions carved out for "it looks messy here." This is a tool meant for daily use; tab-through has to work.

**Loading / error / toast states**

- Loading: skeleton blocks in Slate/Surface color (not a spinner) - matches the flat, static aesthetic; a spinning icon would be the one moving/decorative element in an otherwise still system.
- Error/toast: same card treatment as everything else - flat fill, 1px border (Cinder border for errors), no drop shadow, appears as a fixed-position flat card, not a shadowed floating chip.
- Empty states: written in the app's voice, direct - "Nothing here yet. Add your first watch." Not cutesy, not apologetic.

---

## 6. Motion

Minimal and functional only:

- Hover: 120ms ease-out on color/border transitions.
- Stamp: 80ms scale + rotation on hover/focus only (see §4) - the one deliberate motion moment in the system.
- Page transitions: none, or a simple 100ms fade - no slide/parallax.
- Reduced motion: respect `prefers-reduced-motion`, disable the stamp animation and any skeleton shimmer entirely.

---

## 7. Explicit "Don't" List

1. No gradients (backgrounds, buttons, text, borders - none).
2. No pill badges with a leading colored dot.
3. No large rounded corners (nothing above 6px radius, ever).
4. No drop shadows for elevation - use borders/flat color contrast, including on toasts and modals.
5. No stock "AI app" cream (`#F4F1EA`) + terracotta (`#D97757`) combo, and no near-black + neon-green/vermilion combo either.
6. No mixing more than 2 accent colors in one screen.
7. No native browser checkboxes/radios left unstyled.
8. No Fjalla One below 20px or on paragraph text; no Agdasima below 16px anywhere.
9. No icon-only actions without a text label on primary actions.
10. No reusing a dark-mode accent hex on a light-mode background, or vice versa - always use the mode-matched value from §1/§1b.
11. No resting-state rotation on the stamp - flat by default, rotated only on hover/focus.
