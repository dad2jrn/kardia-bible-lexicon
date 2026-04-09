# Phase 1 Primitive Audit

_Date: April 8, 2026_

## Summary
The current Category Generator UI is primarily styled with ad-hoc Tailwind class strings and the default shadcn/Base UI primitives. Only buttons, badges, accordions/dialog/tabs, and a textarea expose reusable APIs. Cards, selection controls, dividers, helper text, and loading/empty containers are implemented inline inside feature components, which makes redesigning slow and inconsistent. The table below captures the decision for each primitive needed in Phase 1.

| Primitive | Current Source | Issues | Decision |
| --- | --- | --- | --- |
| Buttons (primary/secondary/ghost/destructive) | `src/components/ui/button.tsx` (Base UI + CVA variants) | Palette tied to default light theme, lacks semantic tokens, hover/focus inconsistent, uses generic border radii. | **Reuse with major retokening** – keep component + variant API, replace tokens, spacing, and interaction layer. |
| Badges/Status pills | `src/components/ui/badge.tsx` | Same issues as buttons plus no semantic tones (success/warning/info). | **Reuse with additional semantic variants** – update palette + states. |
| Chips/Pills | Not defined, built ad-hoc in `CategoryGrid` and elsewhere. | Inconsistent padding, no selected states. | **New** – create selectable card/chip primitive. |
| Cards / Surfaces | Inline `<div>`s w/ `rounded-xl border` (e.g., CategoryGrid, GeneratePanel). | No shared padding rhythm, no layered surfaces, repeated class strings. | **New** – create SectionCard + SurfaceCard components w/ tokens. |
| Inputs/Textareas | Only textarea primitive exists; form inputs largely raw HTML. | Acceptable for now but needs token update for focus rings + background. | **Reuse** – keep component but migrate to semantic tokens later. |
| Helper / Metadata text | None (plain `<p>` tags). | Typographic scale inconsistent, uppercase tracking overused. | **New** – create helper/label text utility. |
| Empty / Loading states | Each section rolls its own spinner or placeholder. | No consistent skeleton, overlays, or tone. | **New** – create shared EmptyState + LoadingState components. |
| Dividers | Inline `<hr>` w/ direct colors. | No semantic token. | **New** – add utility class using border tokens. |
| Headings / Typography scale | Global CSS sets `font-sans` only; component headings use arbitrary `text-xs` combos. | No documented hierarchy. | **New** – create typography tokens + helper classes for title/section/card/body/meta.

## Notes
- Existing spacing scale relies on Tailwind defaults (`gap-3`, `px-4`), so Phase 1 must introduce semantic spacing tokens before layout refactors.
- Interaction patterns (hover/focus/disabled) differ per component; new tokens should define focus ring, gold accent, and selected outlines globally.
- The UI currently loads Geist; per plan we'll adopt Inter for all UI typography and reserve serif accents for later phases.
