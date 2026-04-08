// ── Kardia Generator — Anthropic API helpers ──────────────────────────────────
// All logic migrated verbatim from tools/kardia-generator-v2.html.
// The model selection is passed in at call time; localStorage key handling
// is the responsibility of the caller (useApiKey hook).

import type { CategoryEntry, KardiaVerse, ValidatorResult } from '@/types'
import { SYSTEM_PROMPT, VALIDATOR_PROMPT, KARDIA_VERSE_PROMPT, LAYER1_SCHEMA } from '@/constants/prompts'

// ── Low-level fetch wrapper ───────────────────────────────────────────────────

export interface AnthropicMessage {
  content: Array<{ type: string; text: string }>
  stop_reason: string
}

export async function callAPI(
  key: string,
  system: string,
  user: string,
  model: string,
): Promise<AnthropicMessage> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 8000,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || `API error ${res.status}`)
  }

  return res.json()
}

// ── JSON repair ───────────────────────────────────────────────────────────────

/**
 * Best-effort repair for truncated JSON strings.
 * Migrated verbatim from tools/kardia-generator-v2.html repairTruncatedJSON().
 */
export function repairTruncatedJSON(text: string): string {
  let t = text

  // Close any open string
  const quoteCount = (t.match(/(?<!\\)"/g) || []).length
  if (quoteCount % 2 !== 0) t += '"'

  // Count open braces/brackets and close them
  let opens = 0
  let arrayOpens = 0
  for (const ch of t) {
    if (ch === '{') opens++
    else if (ch === '}') opens--
    else if (ch === '[') arrayOpens++
    else if (ch === ']') arrayOpens--
  }

  // Close trailing comma before closing
  t = t.replace(/,\s*$/, '')
  t += ']'.repeat(Math.max(0, arrayOpens))
  t += '}'.repeat(Math.max(0, opens))

  return t
}

// ── Generation ────────────────────────────────────────────────────────────────

/**
 * Run the generation pass. Returns a parsed CategoryEntry.
 * On parse failure after auto-repair, throws — caller should show recovery UI.
 */
export async function runGeneration(
  key: string,
  userPrompt: string,
  model: string,
): Promise<CategoryEntry> {
  const res = await callAPI(key, SYSTEM_PROMPT, userPrompt, model)
  const raw = res.content[0].text.trim()
  const stopReason = res.stop_reason

  // Strip markdown fences if present
  let text = raw
    .replace(/^```json\s*/, '')
    .replace(/^```\s*/, '')
    .replace(/\s*```$/, '')
    .trim()

  // Attempt 1 — clean parse
  try {
    return JSON.parse(text) as CategoryEntry
  } catch (_e1) {
    // fall through
  }

  // Attempt 2 — auto-repair truncated JSON
  if (stopReason === 'max_tokens' || !text.endsWith('"')) {
    try {
      const repaired = repairTruncatedJSON(text)
      const parsed = JSON.parse(repaired) as CategoryEntry
      parsed._truncation_warning = true
      return parsed
    } catch (_e2) {
      // fall through
    }
  }

  // Attempt 3 — unrecoverable: throw with raw text so caller can surface recovery UI
  throw new JsonParseError(
    'JSON parse failed — raw output preserved. Copy it before retrying.',
    text,
  )
}

export class JsonParseError extends Error {
  constructor(
    message: string,
    public readonly rawText: string,
  ) {
    super(message)
    this.name = 'JsonParseError'
  }
}

/**
 * Build the user prompt for the initial generation pass.
 */
export function buildGenerationPrompt(category: string): string {
  return `Generate a complete Kardia Lexicon Layer 1 JSON entry for the Hebrew category: "${category}"

Use exactly this schema structure:
${LAYER1_SCHEMA}

Critical reminders:
- The what_it_is_not field: state the Western misreading ONCE briefly, then pivot immediately to positive Hebrew covenantal description. Do not dwell in the error.
- The one_liner: frame this word as the interior life of covenant structure, not as voluntary gift beyond obligation.
- The second_temple_context: use only categories those communities recognized. No modern ecclesiological language.
- The english_glosses: use the required two-tier structure (recommended / attested with loses field).
- Respond with ONLY the JSON object. No preamble, no markdown fences.`
}

/**
 * Build the correction prompt for the correction-loop pass.
 */
export function buildCorrectionPrompt(
  currentEntry: CategoryEntry,
  validatorSummary: string,
  combinedCorrections: string,
): string {
  return `You previously generated this Hebrew category entry:
${JSON.stringify(currentEntry, null, 2)}

A theological reviewer identified these issues in the validator report:
${validatorSummary}

The following corrections must be applied to produce the revised entry:

${combinedCorrections}

Generate a revised version of the complete JSON entry that addresses every correction listed above.
Apply all the same system prompt constraints.
Preserve everything that was correct in the original — only revise what the corrections target.
Use the same schema structure:
${LAYER1_SCHEMA}

Respond with ONLY the corrected JSON object. No preamble, no markdown fences.`
}

// ── Validation ────────────────────────────────────────────────────────────────

/**
 * Run the theological validation pass.
 * Migrated verbatim from tools/kardia-generator-v2.html runValidation().
 */
export async function runValidation(
  key: string,
  entry: CategoryEntry,
  model: string,
): Promise<ValidatorResult> {
  const res = await callAPI(
    key,
    VALIDATOR_PROMPT,
    `Review this Kardia Lexicon entry:\n${JSON.stringify(entry, null, 2)}`,
    model,
  )
  const text = res.content[0].text.trim()
  try {
    return JSON.parse(text) as ValidatorResult
  } catch (_e) {
    return JSON.parse(text.replace(/```json|```/g, '').trim()) as ValidatorResult
  }
}

// ── Kardia verse translation ──────────────────────────────────────────────────

/**
 * Run the Kardia verse translation pass.
 * Migrated verbatim from tools/kardia-generator-v2.html runKardiaVerseTranslation().
 */
export async function runKardiaVerseTranslation(
  key: string,
  entry: CategoryEntry,
  model: string,
): Promise<KardiaVerse[]> {
  const verses = entry.key_verses || []
  if (verses.length === 0) return []

  const kardiaWord = entry.kardia_rendering || ''
  const prompt =
    'Generate Kardia translations for the key verses of this Hebrew category entry.\n\n' +
    'Category: ' +
    (entry.category_label || '') +
    ' (' +
    (entry.transliteration || '') +
    ')\n' +
    'Hebrew root: ' +
    (entry.hebrew_root || '') +
    '\n' +
    'Kardia rendering of this word: "' +
    kardiaWord +
    '"\n' +
    'One-liner: ' +
    (entry.one_liner || '') +
    '\n\n' +
    'Key verses to translate: ' +
    verses.join(', ') +
    '\n\n' +
    'For each verse, show a standard rendering alongside the Kardia translation so the contrast is visible.\n' +
    'The Kardia translation must use "' +
    kardiaWord +
    '" (or its natural grammatical form) wherever this Hebrew category appears in the verse.\n\n' +
    'Respond ONLY with the JSON array. No preamble, no markdown fences.'

  try {
    const res = await callAPI(key, KARDIA_VERSE_PROMPT, prompt, model)
    const text = res.content[0].text.trim()
    try {
      return JSON.parse(text) as KardiaVerse[]
    } catch (_e) {
      return JSON.parse(text.replace(/```json|```/g, '').trim()) as KardiaVerse[]
    }
  } catch (e) {
    console.warn('Kardia verse translation failed:', (e as Error).message)
    return []
  }
}
