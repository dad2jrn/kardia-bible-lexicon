# Kardia Generator — React/TypeScript Rewrite Plan

This file is the **living implementation plan** for the React/TypeScript rewrite of
`tools/kardia-generator-v2.html`. At the start of every new chat, read this file to
understand what has been built and what comes next. After each phase or task is
completed, update this file by checking the box and adding any relevant notes.

---

## Context & Goals

**What this tool does:**  
A local-only internal tool for generating Hebrew category entries for the Kardia Bible
Lexicon. It calls the Anthropic API directly from the browser (no production deployment,
no server-side key handling needed), runs a generation pass, a validation pass, and a
Kardia verse translation pass per entry. Approved entries are persisted to SQLite and
exported as `categories.json` to commit to the main repo.

**Source of truth for existing logic:**  
`tools/kardia-generator-v2.html` — all prompts, schemas, generation flow, correction
loop, and rendering logic live there. Do not invent new behavior; migrate faithfully.

**Key architectural decisions already made:**
- Vite + React + TypeScript (frontend)
- Express + better-sqlite3 (local server, runs alongside Vite via `concurrently`)
- Tailwind CSS + shadcn/ui for components
- API key stays in `localStorage` (browser-side only, never hits the server)
- Anthropic API called directly from the browser (`anthropic-dangerous-direct-browser-access: true`)
- Approved entries move from `localStorage` → SQLite (replaces old localStorage storage)
- Schema auto-installs on first server boot
- Single `npm run dev` starts both Vite and Express
- Vite proxies `/api/*` → `http://localhost:3001`

---

## Directory Structure (target)

```
tools/kardia-generator-app/
├── PLAN.md                        ← this file
├── package.json                   ← root: scripts, concurrently, workspaces
├── client/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── types/
│   │   │   └── index.ts           ← all shared TS interfaces
│   │   ├── constants/
│   │   │   ├── categories.ts      ← CATEGORIES map
│   │   │   └── prompts.ts         ← SYSTEM_PROMPT, VALIDATOR_PROMPT, LAYER1_SCHEMA, KARDIA_VERSE_PROMPT
│   │   ├── lib/
│   │   │   ├── anthropic.ts       ← callAPI, runGeneration, runValidation, runKardiaVerseTranslation, repairTruncatedJSON
│   │   │   └── utils.ts           ← catToId, escapeHTML, etc.
│   │   ├── hooks/
│   │   │   ├── useApiKey.ts       ← localStorage get/set/clear
│   │   │   └── useEntries.ts      ← fetch/create/update/delete approved entries via /api
│   │   └── components/
│   │       ├── layout/
│   │       │   ├── Header.tsx
│   │       │   └── Footer.tsx
│   │       ├── ApiKeyModal.tsx
│   │       ├── SettingsDrawer.tsx
│   │       ├── CategoryGrid.tsx
│   │       ├── ModelSelector.tsx
│   │       ├── GeneratePanel.tsx  ← button + status bar
│   │       ├── output/
│   │       │   ├── OutputSection.tsx
│   │       │   ├── JsonPanel.tsx
│   │       │   ├── ValidatorPanel.tsx
│   │       │   ├── PreviewPanel.tsx
│   │       │   └── RecoveryPanel.tsx
│   │       ├── ProgressSection.tsx
│   │       └── database/
│   │           ├── DatabaseSection.tsx
│   │           └── ApprovedEntry.tsx
└── server/
    ├── tsconfig.json
    ├── index.ts                   ← Express app, listens on 3001
    ├── db.ts                      ← better-sqlite3 init + schema install
    └── routes/
        └── entries.ts             ← GET/POST/PUT/DELETE /api/entries
```

---

## SQLite Schema

Schema is defined in `data/schema/kardia_schema.sql` (repo root) and installed
automatically on first server boot via `server/db.ts`. Full three-layer normalized
design: reference tables → categories + surface vehicles → lexeme map → verse index.
FTS5 triggers maintain `categories_fts` automatically.

**Schema boot behaviour:**
- On first boot: `_schema_meta` table does not exist → run full schema install → seed
  reference tables → log "Kardia schema installed"
- On subsequent boots: `_schema_meta` exists → skip install entirely → log "Kardia
  schema already installed"
- If `_schema_meta` exists but `schema_version` does not match the current SQL file:
  log a warning ("Schema version mismatch — manual migration may be required") and
  continue. Do not auto-migrate. Do not crash. The warning is surfaced in the server
  console only.

Two fields added to AI output in Phase 2 (the **only** permitted deviation from
verbatim migration of `LAYER1_SCHEMA`):
- `semantic_domain_id` — one of: `god-covenant`, `human-nature`, `relational-ethical`,
  `worship-presence`, `sin-redemption`, `land-creation`, `leadership-vocation`,
  `eschatology-hope`, `nt-lxx-distinctive`, `spiritual-beings-reframed`
- `textual_layer_id` — one of: `pre-exilic`, `exilic`, `post-exilic`, `second-temple`, `nt`

The AI can classify both fields correctly from entry content. No UI dropdowns needed.

---

## REST API (Express, port 3001)

| Method | Path              | Description                                                  |
|--------|-------------------|--------------------------------------------------------------|
| GET    | /api/entries      | Return all approved entries (reconstructed from normalized tables) |
| POST   | /api/entries      | Insert or replace an entry (upsert by `id`) — used for Approve & Save and Import |
| PUT    | /api/entries/:id  | Patch an existing entry (kardia_verses + scalar fields) — used for verse generation |
| DELETE | /api/entries/:id  | Remove an entry (cascades to all child tables)               |

**Route semantics are strict:** Approve & Save always uses `POST` (upsert). Verse
translation patching always uses `PUT /:id`. These must not be swapped.

---

## Implementation Phases

### Phase 0 — Project Scaffold ✓
- [x] Create `package.json` at `tools/kardia-generator-app/` with `concurrently` dev script
- [x] Scaffold `client/` with Vite + React + TypeScript (`npm create vite`)
- [x] Install and configure Tailwind CSS v4 in `client/`
- [x] Install and initialise shadcn/ui in `client/` (Tabs, Dialog, Accordion, Badge, Button, Textarea, ScrollArea) — note: shadcn 4.2 uses `@base-ui/react` instead of Radix UI for these components
- [x] Scaffold `server/` with `tsconfig.json`, `index.ts`, `db.ts`, `routes/entries.ts`
- [x] Install `express`, `better-sqlite3`, `cors`, `tsx` in server
- [x] Vite proxy: `/api` → `http://localhost:3001` in `vite.config.ts`
- [x] Verify `npm run dev` starts both client (5173) and server (3001) successfully

### Phase 1 — Data Layer (server) ✓
- [x] `server/db.ts`: loads `data/schema/kardia_schema.sql` on first boot (idempotent guard on `_schema_meta`); full canonical normalized schema
- [x] `server/routes/entries.ts`: GET (reconstruct from normalized tables), POST (full upsert transaction across all child tables), PUT (patch kardia_verses + scalar fields), DELETE (cascade)
- [x] `server/index.ts`: no changes needed — already correctly configured
- [x] Smoke-test all endpoints with curl — all passing

### Phase 2 — Types & Constants (client) ✓
- [x] `src/types/index.ts`: interfaces for `CategoryEntry`, `ValidatorResult`, `ValidatorFlag`, `KardiaVerse`, `IllustrativeRendering`, `EnglishGlosses`
- [x] `src/constants/categories.ts`: `CATEGORIES` map (migrated from HTML)
- [x] `src/constants/prompts.ts`: migrate `SYSTEM_PROMPT`, `VALIDATOR_PROMPT`, `KARDIA_VERSE_PROMPT` **verbatim** from HTML — do not alter wording; then add `semantic_domain_id` and `textual_layer_id` to `LAYER1_SCHEMA` as the only permitted deviation. Confirm `KARDIA_VERSE_PROMPT` contains the full rendering principles content (natural phrasing, not gloss insertion, contextually fitted per verse — see `rendering-principles.md`) and not just the outer prompt wrapper.
- [x] `src/lib/utils.ts`: `catToId`, `escapeHTML`
- [x] `src/lib/anthropic.ts`: `callAPI`, `runGeneration`, `repairTruncatedJSON`, `runValidation`, `runKardiaVerseTranslation`
- [x] Vitest installed; 29 unit tests written and passing (utils.test.ts, anthropic.test.ts); TypeScript type-checks clean

### Phase 3 — Hooks ✓
- [x] `useApiKey`: read/write/clear key in localStorage; derive `isConnected`, `maskedKey`
- [x] `useEntries`: fetch entries on mount, expose `approve`, `updateEntry`, `deleteEntry`, loading/error state

### Phase 4 — App Shell & API Key Flow
- [x] `App.tsx`: top-level layout, route state (no router needed — single page) — Implemented April 8, 2026 with modal/drawer wiring plus placeholder sections (`App.test.tsx` covers status + drawer behaviour).
- [x] `Header.tsx`: title, API status pill, gear button — Added React layout + lucide icon with tone-specific styling (`components/layout/Header.test.tsx`).
- [x] `Footer.tsx`: static footer text — New component mirrors legacy copy (smoke-tested April 8, 2026).
- [x] `ApiKeyModal.tsx`: first-run modal (Dialog), validates `sk-ant-` prefix, saves to localStorage — Implemented with shared validator + unit tests in `components/ApiKeyModal.test.tsx`.
- [x] `SettingsDrawer.tsx`: collapsible drawer under header, show/hide toggle, save button — Completed with validation + CTA + tests (`components/SettingsDrawer.test.tsx`).
- [x] Wire: show modal if no key in localStorage on mount; pill shows connected/disconnected — Observed via manual sanity run and automated coverage in `App.test.tsx`; helper validation logic covered by `src/lib/validation.test.ts`.

### Phase 5 — Category & Model Selection
- [ ] `CategoryGrid.tsx`: renders groups + buttons from `CATEGORIES`; marks completed IDs; emits `onSelect`
- [ ] `ModelSelector.tsx`: three model buttons (Sonnet 4.6, Opus 4.6, Haiku 4.5); emits `onSelect`

### Phase 6 — Generation Flow
- [ ] `GeneratePanel.tsx`: Generate button + status bar (loading/error/success states)
- [ ] Wire generation in `App.tsx` (or a `useGenerator` hook): call `runGeneration` → `runValidation` → `runKardiaVerseTranslation` in sequence; update `currentEntry`, `currentValidator`, `iterationCount`
- [ ] `OutputSection.tsx`: tabs wrapper (shadcn Tabs); shows only when entry exists
- [ ] `JsonPanel.tsx`: monospace JSON display, Approve & Save / Copy JSON / Regenerate Fresh buttons
- [ ] `ValidatorPanel.tsx`: overall badge, summary, flag list with checkboxes, select-all, queued count badge, correction textarea, Regenerate with Corrections button
- [ ] `PreviewPanel.tsx`: rendered reader preview (Hebrew root, category label, one-liner, full definition, what-it-is-not block, Kardia rendering, gloss pills, illustrative renderings, Kardia verse translations)
- [ ] `RecoveryPanel.tsx`: shown on JSON parse failure; displays raw text, Copy Raw / Retry buttons
- [ ] Truncation warning banner in JsonPanel when `entry._truncation_warning` is set

### Phase 7 — Approve & Persist
- [ ] Approve & Save: call `POST /api/entries` (upsert), mark category complete, clear output section, update progress
- [ ] `ProgressSection.tsx`: overall bar + per-group bars from entry list
- [ ] `DatabaseSection.tsx` + `ApprovedEntry.tsx`: accordion list of approved entries; sub-tabs JSON / Reader Preview; Copy JSON button; Generate Missing Verse Translations button; **Remove from database button** (calls `DELETE /api/entries/:id`, prompts for confirmation, removes from accordion on success)
- [ ] Export `categories.json`: reconstruct export envelope (version, description, license, etc.) and trigger download
- [ ] Import `categories.json`: file input, parse, upsert all entries via `POST /api/entries`, show result banner (n imported, n failed)

### Phase 8 — Correction Loop
- [ ] Flag checkboxes in `ValidatorPanel` build `autoCorrections` string on submit
- [ ] Combine auto-corrections + manual textarea into `combinedCorrections`
- [ ] Send correction prompt to `runGeneration`, then re-validate, then re-translate verses
- [ ] Increment `iterationCount`, update iteration badge

### Phase 9 — Generate Missing Verses (Database section)
- [ ] "Generate Verse Translations" button on approved entries that have no `_kardia_verses`
- [ ] Call `runKardiaVerseTranslation`, patch entry via `PUT /api/entries/:id`, re-render preview

### Phase 10 — Polish & QA
- [ ] Verify all prompts migrated verbatim from HTML source — diff `SYSTEM_PROMPT`, `VALIDATOR_PROMPT`, `KARDIA_VERSE_PROMPT` character-for-character against the HTML
- [ ] Verify `LAYER1_SCHEMA` matches HTML exactly except for the two added fields (`semantic_domain_id`, `textual_layer_id`)
- [ ] Verify correction loop produces valid JSON on re-parse
- [ ] Check all accordion/tab interactions
- [ ] Responsive layout check
- [ ] Confirm `npm run dev` cold-start (no existing `kardia.db`) creates DB and installs schema automatically
- [ ] Confirm `npm run dev` warm-start (existing `kardia.db`) skips schema install without error
- [ ] Confirm schema version mismatch logs a warning and does not crash
- [ ] Confirm `DELETE /api/entries/:id` cascades correctly (no orphaned child rows remain)
- [ ] Confirm import of existing `data/categories.json` works end-to-end

---

## How to start a new chat on this project

1. Open `tools/kardia-generator-app/PLAN.md` — identify the first unchecked item.
2. Open `tools/kardia-generator-v2.html` — this is the source of truth for all logic and prompts.
3. Check the current file tree under `tools/kardia-generator-app/` to see what exists.
4. Implement the next unchecked phase. Mark tasks complete as you go.
5. After the session, ensure this file reflects what was actually built.

---

## Notes

- The Anthropic API key is **never** sent to the Express server. It lives only in browser `localStorage` and goes directly to `api.anthropic.com`.
- The Express server handles **only** SQLite persistence — no AI calls, no key storage.
- `kardia.db` should be added to `.gitignore` (local data only).
- The `data/categories.json` in the repo root is a separate export artifact — the tool writes to it via the Export button, not automatically.
- Do not alter the wording of any system prompt or schema. They are theological guard rails and must be migrated verbatim. The only permitted addition to `LAYER1_SCHEMA` is `semantic_domain_id` and `textual_layer_id`.
- The route semantics for POST vs PUT are intentional and must not be conflated: POST = upsert (Approve & Save, Import), PUT = patch (verse translations only).
- `routes/entries.ts` already has DELETE implemented (Phase 1). The UI for it is Phase 7. Do not re-implement the route.
