---
name: sitecommand-design
description: Use this skill to generate well-branded interfaces and assets for SiteCommand (construction management software), either for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files — especially `colors_and_type.css` (tokens), `ui_kits/marketing/` (public site), and `ui_kits/app/` (in-app dashboard).

Key brand rules to internalize:
- Voice is **simple, sharp, intuitive** — many users aren't tech-savvy.
- **DM Serif Display** for headlines only (40–80px, `letter-spacing: -0.02em`). **Barlow** everything else.
- Single brand accent `#D4500A` — used sparingly (dot, progress fill, RFI open pill, ambient hero glow). Never as a button background.
- Primary CTA is **ink black `#111110`**, not brand orange.
- Marketing body `#FAFAF9`, app body `#F9FAFB`. Cards are pure white with 1px `#F3F4F6` border, 12px radius, no shadow.
- Signature "**double-bezel**" container (2px gradient outer + white inner + inset top-highlight) for hero previews, bento cells, and CTAs.
- No emoji. No stock photography. Hand-authored inline SVG icons only (1.75 stroke, round joins).
- Empty states, buttons, and form labels use **sentence case**. Eyebrows are **UPPERCASE + 0.12em tracking**.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out of `assets/` and create static HTML files for the user to view — import `colors_and_type.css` for all tokens. If working on production code, read the rules here and in `README.md` to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions (surface: marketing page, in-app screen, email, deck? audience: contractor, admin, subcontractor?), and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
