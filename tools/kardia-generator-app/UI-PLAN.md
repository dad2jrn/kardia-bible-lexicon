# UI Plan for Kardia Category Generator

## Objective

Transform the current Category Generator from a functional internal tool into a polished, professional product interface that feels scholarly, premium, modern, and trustworthy.

This plan is structured for implementation in phases so Codex can execute incrementally without losing cohesion.

## Product Design Direction

The target visual language should feel:

- Scholarly
- Premium
- Restrained
- Modern
- Calm
- Highly legible

The interface should communicate theological seriousness and product-grade polish, not generic startup styling or raw internal tooling.

## Core UX Goals

- Establish a clear visual hierarchy
- Create a professional application shell
- Improve readability and layout rhythm
- Replace form-like controls with intentional product components
- Strengthen branding and trust
- Make the primary workflow obvious
- Ensure the UI scales well across desktop and responsive breakpoints

---

# Phase 1 - Foundation and Design System

## Goal

Create the visual system and shared primitives before redesigning the page.

## Tasks

### 1.1 Audit current UI primitives
- Identify all existing reusable UI pieces:
  - buttons
  - cards
  - pills/chips
  - inputs
  - badges
  - headings
  - containers
  - dividers
- Document which pieces can be reused and which should be replaced

### 1.2 Define Kardia theme tokens
- Add semantic color tokens in Tailwind config
- Add spacing, radius, border, and shadow tokens
- Add font-size and typography scale tokens
- Avoid hardcoded one-off colors inside components where possible

### 1.3 Establish color palette
Implement a premium Kardia palette with semantic naming. Suggested baseline:

- `kardia.bg`
- `kardia.surface`
- `kardia.card`
- `kardia.border`
- `kardia.text`
- `kardia.muted`
- `kardia.gold`
- `kardia.goldDark`
- `kardia.success`
- `kardia.warning`

Suggested values:

- Background: `#0B1020`
- Surface: `#121A2B`
- Card: `#182235`
- Border: `#2A3650`
- Primary text: `#F5F1E8`
- Secondary text: `#B8C0D4`
- Gold accent: `#C8A96B`
- Dark gold: `#8D7448`

### 1.4 Define typography system
- Use a clean, premium UI font such as Inter for the interface
- Optionally reserve a serif accent for branding only
- Define usage for:
  - page title
  - section title
  - card title
  - body text
  - metadata labels
- Reduce excessive letter spacing on small labels

### 1.5 Create base component variants
Build or revise shared variants for:

- primary button
- secondary button
- ghost button
- section card
- selectable card
- selected card
- status badge
- helper text
- empty state
- loading state

### 1.6 Add interaction standards
Define consistent behavior for:
- hover
- active
- focus-visible
- disabled
- selected
- loading
- error

### 1.7 Create a lightweight UI reference page
- Build a temporary internal style page showing all components together
- Use this page to validate spacing, contrast, typography, and selection states before applying the redesign

## Deliverables
- Updated Tailwind theme tokens
- Shared component primitives
- Internal UI reference page

---

# Phase 2 - Application Shell and Layout Architecture

## Goal

Replace the current flat full-width slab with a structured, professional app shell.

## Tasks

### 2.1 Build a top-level application shell
Create a layout with:
- top navigation/header
- main content area
- optional left sidebar
- optional right summary rail

### 2.2 Redesign header
Header should include:
- Kardia logo or wordmark
- product title: `Category Generator`
- concise product subtitle
- provider status badge
- optional utility actions

### 2.3 Define responsive content grid
Use a layout that supports:
- desktop: left navigation + main + summary rail
- tablet: stacked summary rail below main
- mobile: single-column flow

Recommended desktop pattern:
- `xl:grid-cols-[280px_minmax(0,1fr)_320px]`

### 2.4 Add page width and spacing rhythm
- Constrain content to a sensible max width
- Establish consistent vertical spacing between sections
- Avoid giant uninterrupted containers

### 2.5 Introduce card-based section structure
Wrap major functional areas into deliberate cards:
- category selection
- model selection
- generation pipeline
- selected category summary
- generation readiness/status

### 2.6 Add background and depth treatment
- Use layered surfaces rather than plain white panels
- Add subtle shadows or tonal contrast
- Ensure visual separation without noisy effects

## Deliverables
- New page shell
- New header
- Responsive layout structure
- Card-based section framing

---

# Phase 3 - Category Selection Redesign

## Goal

Turn category selection into a premium, curated browsing experience.

## Tasks

### 3.1 Replace input-like term boxes with selectable cards or pills
Current category choices should no longer look like text inputs.

Implement as:
- selectable chips for compact mode
- selectable cards for richer mode

Preferred default:
- card-style selectable items with strong selected state

### 3.2 Improve category grouping
Group roots under clear section headings such as:
- God & Covenant
- Human Nature
- Relational & Ethical
- Worship & Presence
- Sin & Redemption

Make group headings visually distinct and easy to scan.

### 3.3 Add short descriptors
For each category item, support:
- label
- optional short descriptor
- optional metadata such as status, count, or completion state

Example:
- `Elohim`
- `God & covenant`

### 3.4 Create selected-state styling
Selected item should feel intentional, not just darkened.

Selected state should include:
- stronger border
- gold accent or ring
- subtle glow or elevated shadow
- clear label such as `Selected`

### 3.5 Improve completion/progress display
Replace `1 / 30 complete` style text with a more polished progress indicator.

Possible options:
- compact progress bar
- step badge
- completion chip

### 3.6 Add category summary panel
When a category is selected, show a summary card with:
- selected root
- group name
- completion state
- short explanation
- next action hint

### 3.7 Support keyboard navigation and accessibility
- clear focus states
- logical tab order
- ARIA labels for selection state
- screen reader-friendly selection behavior

## Deliverables
- Redesigned category selector
- Improved grouping and hierarchy
- Selected category summary component

---

# Phase 4 - Model Selection Redesign

## Goal

Make model selection look like a deliberate product choice, not a plain list.

## Tasks

### 4.1 Replace stacked rows with model cards
Each model should appear as a structured card showing:
- model name
- one-line purpose summary
- relative cost
- relative speed
- relative fidelity

### 4.2 Add recommendation treatment
For the recommended model:
- add a `Recommended` badge
- visually elevate the card
- explain why it is recommended

### 4.3 Improve selection state
Selected model card should have:
- strong border
- accent treatment
- obvious checked/selected indicator

### 4.4 Add comparison cues
Support quick scanning with concise metadata, for example:
- `Most reliable guard rails`
- `Fast iteration`
- `Highest theological fidelity`

### 4.5 Show current model summary
Below or beside the selector, show:
- currently selected model
- estimated cost per entry
- why it is suited to the current task

### 4.6 Handle provider-aware updates cleanly
If options depend on provider state:
- animate or transition gracefully when provider changes
- avoid jarring full reflows
- show disabled states if unavailable

## Deliverables
- Premium model selector
- Recommendation badge system
- Current model summary card

---

# Phase 5 - Generation Workflow and CTA Redesign

## Goal

Make the generation flow obvious, confident, and trustworthy.

## Tasks

### 5.1 Redesign the generation area as a workflow card
Instead of a plain bar and a button, create a proper workflow section.

Include:
- section title
- short explanation
- step summary
- readiness indicator
- primary CTA

### 5.2 Create a stronger primary CTA
Replace the weak full-width dark bar with a premium button.

Suggested labels:
- `Generate Elohim`
- `Generate Category Entry`
- `Start Generation`

The button should be:
- visually dominant
- clearly interactive
- disabled only when necessary with clear explanation

### 5.3 Add readiness checklist
Show concise generation prerequisites such as:
- category selected
- model selected
- provider connected
- API key present if required

### 5.4 Improve status messaging
Replace plain utilitarian messages with a clearer status system:
- ready
- generating
- validating
- completed
- failed

### 5.5 Add inline progress states
During generation, support:
- spinner or progress indicator
- current step label
- non-disruptive updates

### 5.6 Improve post-generation feedback
After completion, show:
- success state
- what was generated
- next available action
- retry or revise action if relevant

## Deliverables
- New workflow card
- Strong primary CTA
- Status and readiness system

---

# Phase 6 - Branding and Visual Polish

## Goal

Make the experience unmistakably Kardia and professionally finished.

## Tasks

### 6.1 Integrate Kardia brand identity
- Add the Kardia logo or wordmark in the header
- Use accent color intentionally
- Ensure the interface feels aligned with the brand rather than generic SaaS

### 6.2 Introduce premium spacing and composition
- Normalize internal card padding
- Tighten or loosen gaps where needed
- Ensure no section feels cramped or empty

### 6.3 Refine iconography
- Add minimal icon support where useful
- Avoid decorative overload
- Use icons only where they improve scanability

### 6.4 Improve visual rhythm
- Align headings, badges, and cards consistently
- Make all sections feel part of one system
- Remove visual noise and redundant borders

### 6.5 Add empty, hover, and loading polish
Ensure the interface still looks intentional in all states:
- no selection
- loading provider
- unavailable options
- generation in progress
- generation error

### 6.6 Review contrast and readability
- Validate text contrast
- ensure muted text remains readable
- ensure gold accents remain elegant, not gaudy

## Deliverables
- Branded UI pass
- Improved polish across all states
- More cohesive visual rhythm

---

# Phase 7 - Responsiveness and Accessibility

## Goal

Ensure the redesign works cleanly across screen sizes and is accessible.

## Tasks

### 7.1 Responsive layout pass
Validate:
- large desktop
- laptop
- tablet
- mobile

### 7.2 Reflow section order for smaller screens
On smaller screens:
- stack summary below main content
- reduce multi-column category layouts
- preserve clear CTA visibility

### 7.3 Touch-target audit
- ensure tap targets meet minimum size expectations
- verify spacing between interactive elements

### 7.4 Keyboard navigation audit
- tab order
- visible focus
- selection controls
- CTA usability

### 7.5 Screen reader and semantics audit
- proper headings
- button semantics
- region labels
- aria-selected or equivalent states
- status announcements if generation updates dynamically

### 7.6 Contrast and motion audit
- verify contrast ratios
- respect reduced-motion preferences for transitions and hover effects

## Deliverables
- Responsive UI pass
- Accessibility improvements
- Reduced-motion and contrast validation

---

# Phase 8 - Cleanup, QA, and Handoff

## Goal

Stabilize the redesign and make it ready for ongoing development.

## Tasks

### 8.1 Remove obsolete styles and components
- delete dead CSS classes
- remove deprecated layout wrappers
- simplify component variants where possible

### 8.2 Standardize class composition
- reduce giant inline Tailwind class strings where helpful
- extract reusable patterns into components or helper utilities

### 8.3 QA all states
Test:
- default state
- category selected
- model selected
- provider disconnected
- generation ready
- generating
- generation success
- generation failure

### 8.4 Verify consistency across sections
Check:
- border radius
- card shadows
- button sizes
- label spacing
- typography hierarchy

### 8.5 Create implementation notes
Document:
- design tokens
- shared components
- expected usage patterns
- future extension guidance

### 8.6 Capture before-and-after screenshots
Useful for:
- validating progress
- stakeholder review
- future regression checks

## Deliverables
- Cleaned production-ready UI
- QA checklist
- implementation notes

---

# Execution Order Summary

1. Foundation and design system
2. Application shell and page layout
3. Category selection redesign
4. Model selection redesign
5. Generation workflow redesign
6. Branding and visual polish
7. Responsive and accessibility pass
8. Cleanup, QA, and handoff

---

# Codex Implementation Guidance

## General instructions for Codex

- Do not do a superficial restyle only
- Prioritize layout architecture before micro-styling
- Reuse components where possible
- Prefer semantic Tailwind tokens over raw arbitrary color values
- Maintain clean component boundaries
- Preserve existing functionality while improving presentation
- Avoid introducing flashy effects that undermine seriousness
- The final result should feel like a premium scholarly application, not a generic dashboard

## Suggested implementation approach

For each phase:
1. inspect the current component structure
2. make the structural changes first
3. refine styling second
4. validate responsive behavior
5. commit in small, reviewable increments

## Definition of done

The redesign is complete when:
- the page has a strong visual hierarchy
- the interface feels branded and professional
- the selection workflow is obvious
- the primary CTA is clear and confident
- the layout works across screen sizes
- accessibility and states are handled cleanly
- the overall product feels trustworthy and polished
