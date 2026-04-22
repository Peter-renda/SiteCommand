# SiteCommand Design System

A design system for **SiteCommand** — construction management software for general contractors. Built from the live Next.js application at [Peter-renda/SiteCommand](https://github.com/Peter-renda/SiteCommand).

Our brand voice is **simple, sharp, and intuitive**. Many of our users aren't tech-savvy, so every surface has to be straight-forward.

---

## Sources

| Source | Path |
|---|---|
| Codebase | `github.com/Peter-renda/SiteCommand` (branch `main`) |
| App tokens | `app/globals.css` (CSS variables + Tailwind v4 `@theme inline`) |
| Landing page | `app/page.tsx` |
| Dashboard | `app/dashboard/DashboardClient.tsx` |
| Project workspace | `app/projects/[id]/ProjectClient.tsx` |
| Logo artwork (PNG) | `public/logo.png`, `public/logowithwords.png` |

---

## Index (files in this folder)

| File | What it is |
|---|---|
| `colors_and_type.css` | All tokens — fonts, colors, type scale, spacing, radii, shadows, motion. Import this and you are 90% there. |
| `assets/logo.png` | Hex-plane + wordmark logo (marketing lockup) |
| `assets/logo-wordmark.png` | Logo over-wordmark-over-tagline lockup |
| `preview/` | Preview cards rendered in the Design System tab |
| `ui_kits/marketing/` | Recreation of the public-site landing page (`app/page.tsx`) |
| `ui_kits/app/` | Recreation of the in-app dashboard (`app/dashboard/DashboardClient.tsx`) |
| `SKILL.md` | Agent-skill entry-point — read this if invoked as a skill |

---

## Product context

SiteCommand is one product with **two surfaces**:

1. **Marketing site** (`app/page.tsx`, `app/solutions/*`, `app/pricing`, `app/about`, etc.) — editorial, airy, warm off-white (`#FAFAF9`). The headline typeface is DM Serif Display; everything else is Barlow.
2. **In-app dashboard + project workspace** (`app/dashboard/`, `app/projects/[id]/`) — utilitarian, gray-50 body, pure-white cards, no serif. Built for site supers, PMs, and contractors to manage RFIs, submittals, daily logs, drawings, schedules, budgets, and commitments.

Primary jobs-to-be-done inside the app:

- **RFI Management** — requests for information from submittal → resolution
- **Submittals** — approvals and shop drawings
- **Daily Logs** — manpower, weather, site notes
- **Drawing Control** — versioned sets
- **Schedule + Budget** — plan-vs-actual, spend tracking
- **Prime Contracts + Commitments** — prime contracts, POs, SOVs, change orders

---

## Content fundamentals

### Tone
- **Simple, sharp, intuitive.** Short sentences. Plain English over jargon. Never explain twice.
- Avoid marketing bluster. Don't say "revolutionary," "next-gen," "AI-powered." Describe the concrete thing.
- Address the reader as **"you"** and **"your crew"**. Never "we" addressing the user.
- Use em-dashes and en-dashes freely — they set rhythm.
- Contractions OK in marketing copy ("You're", "don't"). In-app microcopy is terser — no contractions in button labels or table headers.

### Casing
- **Title Case** for nav links and section headers ("Daily Logs", "Prime Contracts").
- **Sentence case** for button labels, form labels, empty states ("Get Started", "New Project", "No projects yet").
- **Uppercase + widely tracked** for eyebrows only: `Built for contractors`, `Platform`, `Get started today`. Always 600 weight, always `letter-spacing: 0.12em–0.15em`.
- Status strings in the app are **lowercase** by schema ("course of construction", "pre-construction", "warranty") — don't rewrite them.

### Voice examples (lifted from repo)
- Hero tagline: **"Take command of your site."** (display serif, second clause in C0C0BC gray + `<em>` tag but not italic)
- Subhead: "RFIs, submittals, daily logs, drawings, and schedules — managed in one place. Built for contractors who need clarity, not chaos."
- Bento card: "Track requests for information from submittal to resolution. No lost emails, no missed deadlines."
- Button: "Get Started" / "See a demo →" / "+ New Project"
- Empty state: "No projects yet" · "Create your first project to get started."

### Emoji & unicode
- **No emoji** anywhere in the product. Ever.
- Unicode arrows (`→`) are fine in marketing button labels.
- Star character uses an inline SVG, not `★`.

---

## Visual foundations

### Colors
- **Single brand accent**: `#D4500A` — warm orange, used only for the 6px eyebrow dot, progress fills, "Open" RFI badges, ambient hero glow, and the hex-plane logo. Never used as a button background.
- **Ink**: `#111110` is the primary CTA background. Not pure black. Matches editorial warmth.
- **Body background**:
  - Marketing surfaces use `#FAFAF9` (warm off-white) — softer than pure white.
  - App surfaces use `#F9FAFB` (gray-50) — cooler.
- **Semantic pills**: blue (bidding), green (active / approved), amber (pre-con / warning), purple (warranty), red (danger), orange (RFI open). All follow the `50` bg + `700` fg + `200` border pattern.

### Type
- **DM Serif Display** (400 weight only, regular + italic) — headlines, stat values, and the footer wordmark. Always `letter-spacing: -0.02em`, `line-height: 0.96–1.1`.
- **Barlow** (400 / 500 / 600 / 700) — everything else. Body at 16/1.6. Headings 14–18 at 600.
- **JetBrains Mono** — RFI IDs, project numbers, currency in tables. Always `font-variant-numeric: tabular-nums`.
- `text-wrap: balance` on all h1/h2/h3. `text-wrap: pretty` on all `<p>`.

### Backgrounds & imagery
- **No photography.** No hero images.
- **Ambient radial gradients** at ~4–6% opacity in brand orange anchor the hero and final CTA.
- **No patterns, no textures, no grain.**
- Product previews are **mocked inline** with real data — not screenshots.

### The double-bezel container (signature motif)
Every marketing hero card, bento cell, and CTA panel uses this two-layer treatment:
```
outer: 2px padded shell
  background: linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(235,235,233,0.6) 100%)
  border:     1px solid rgba(0,0,0,0.06)
  shadow:     0 24px 48px rgba(0,0,0,0.09), 0 6px 16px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)
inner:
  background: #FFFFFF
  shadow:     inset 0 1px 0 rgba(255,255,255,0.9)
  radius:     14px (when outer is 16), 22 (when outer is 24)
```
This is in `preview/components-bezel-card.html` and in `Chrome.jsx` as `<Bezel>`.

### Animation
- Three keyframes only: `fade-up`, `fade-in`, `scale-in`. 500–600ms. Easing = `cubic-bezier(0.22, 1, 0.36, 1)`.
- Stagger hero blocks with `.delay-100 / 200 / 300 / 400 / 500` (Tailwind-style utilities).
- Buttons: `active:scale-[0.98]` on press. Primary button hover = white overlay at 8% opacity, NOT a color shift. Ghost button hover = darker border + white bg.
- Hover on links: `color` transitions from `gray-400 → gray-900` at 150ms.

### Hover / press
- **Cards**: border darkens from `gray-100 → gray-300`, no shadow change.
- **Buttons**: primary darkens via white overlay (8% opacity). Ghost buttons darken via explicit background swap.
- **Rows** (table/list): subtle bg `gray-50` on hover.

### Borders
- Hairlines only: `rgba(0,0,0,0.04)` (divider), `rgba(0,0,0,0.06)` (card), `rgba(0,0,0,0.12)` (hover).
- Inputs: `border: 1px solid #E5E7EB` (gray-200). Focus: `box-shadow: 0 0 0 2px #111110` — no color change.
- **Never use a colored left-border accent** on cards. Use the top-left accent dot instead.

### Shadows
- Soft and low. `shadow-sm`: `0 2px 8px rgba(0,0,0,0.04)`. `shadow-lg`: `0 24px 48px rgba(0,0,0,0.09)`.
- Signature move: **inset top-highlight** (`inset 0 1px 0 rgba(255,255,255,0.9)`) on every raised card to imply warmth.

### Layout rules
- Marketing max-width `1280px`, centered, 40px side padding.
- App max-width `1152px` (`max-w-6xl`).
- Bento grid: 4 columns; "large" cards span 2.
- Header is sticky, 56px tall, with `backdrop-filter: blur(12px)` and a translucent warm-white background on marketing pages.

### Transparency / blur
- Sticky header: `rgba(250,250,249,0.85)` + 12px blur.
- Mock-product headers: `rgba(250,250,249,0.9)` (opaque-ish to nest inside the bezel).
- No glassmorphism elsewhere.

### Corner radii
- **4px** — focus-ring offset, tiny pills
- **6px** — inputs, icon-buttons, small buttons
- **8px** — row buttons, app-level buttons, chips
- **12px** — project cards, stat tiles, nav dropdowns
- **14/16px** — double-bezel inner/outer
- **22/24px** — CTA outer shell
- **9999** — avatars, status pills, brand dot

### Cards (canonical definition)
White bg · 1px `#F3F4F6` border · 12px radius · no shadow · 16–24px padding. On hover: border deepens to `#D1D5DB`. That's it.

---

## Iconography

- **Hand-authored inline `<svg>`** — viewBox `0 0 24 24`, `stroke-width: 1.75`, `stroke-linecap: round`, `stroke-linejoin: round`, `fill: none`. All icons are rendered this way directly in JSX; there is no icon font or sprite.
- `lucide-react` is **installed in `package.json` but not used in the core codebase** — if you reach for it, match the 1.75 stroke and round joins so it blends.
- **Per-type icon colors** on the dashboard activity row: RFI `#3B82F6`, submittal `#8B5CF6`, document `#6B7280`, daily-log `#22C55E`, task `#10B981`, drawing `#F97316`.
- **No emoji. No unicode glyph icons.**
- See `preview/brand-iconography.html` for the canonical set.

### Logo usage
- Two lockups live in `assets/`:
  - `logo-wordmark.png` (hex-plane + wordmark + tagline) — splash / marketing hero
  - `logo.png` (hex-plane + wordmark on one line, no tagline) — nav alternative
- **In-app chrome never uses the artwork** — the top-left brand is the plain text `SiteCommand` at 15/600. Match that in any app-adjacent design.

---

## UI Kits

| Kit | Files | Entry |
|---|---|---|
| **Marketing** | `ui_kits/marketing/{Chrome.jsx, Landing.jsx}` | `ui_kits/marketing/index.html` |
| **App** | `ui_kits/app/{Components.jsx, Dashboard.jsx}` | `ui_kits/app/index.html` |

---

## Caveats / known gaps

- **Fonts load from Google Fonts CDN** (Barlow, DM Serif Display, JetBrains Mono) — the repo uses `next/font/google` and doesn't ship TTF files. If you need offline fonts, download them from Google Fonts and drop into `fonts/`.
- **Slides not provided** — no deck template included, so `slides/` is intentionally absent.
- **App kit covers the dashboard only** — the deeper project workspace (RFIs list, submittals table, daily log composer, drawings viewer) is not yet recreated. Let the user know which they want next.
- **Logo artwork** in `assets/logo.png` is a rendered mock-up (paper grain background visible). For clean placement, isolate the mark or ask the user for a transparent PNG / SVG.
