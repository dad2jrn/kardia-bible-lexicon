import { describe, it, expect } from 'vitest'
import { repairTruncatedJSON, buildGenerationPrompt, buildCorrectionPrompt, JsonParseError } from './anthropic'
import { LAYER1_SCHEMA } from '@/constants/prompts'
import type { CategoryEntry, ValidatorResult } from '@/types'

// ── repairTruncatedJSON ───────────────────────────────────────────────────────

describe('repairTruncatedJSON', () => {
  it('closes an unterminated string', () => {
    const input = '{"key": "value'
    const result = JSON.parse(repairTruncatedJSON(input))
    expect(result.key).toBe('value')
  })

  it('closes unclosed braces', () => {
    const input = '{"a":1,"b":2'
    const result = JSON.parse(repairTruncatedJSON(input))
    expect(result).toEqual({ a: 1, b: 2 })
  })

  it('closes unclosed arrays', () => {
    const input = '["a","b"'
    const result = JSON.parse(repairTruncatedJSON(input))
    expect(result).toEqual(['a', 'b'])
  })

  it('strips trailing comma before closing', () => {
    const input = '{"items":["x","y",'
    const result = JSON.parse(repairTruncatedJSON(input))
    expect(result.items).toEqual(['x', 'y'])
  })

  it('handles nested truncation', () => {
    const input = '{"outer":{"inner":["a"'
    const result = JSON.parse(repairTruncatedJSON(input))
    expect(result.outer.inner).toEqual(['a'])
  })

  it('does not double-close already closed JSON', () => {
    const input = '{"key":"val"}'
    const result = JSON.parse(repairTruncatedJSON(input))
    expect(result).toEqual({ key: 'val' })
  })
})

// ── JsonParseError ────────────────────────────────────────────────────────────

describe('JsonParseError', () => {
  it('carries rawText', () => {
    const err = new JsonParseError('failed', 'raw content here')
    expect(err.rawText).toBe('raw content here')
    expect(err.name).toBe('JsonParseError')
    expect(err instanceof Error).toBe(true)
  })
})

// ── buildGenerationPrompt ─────────────────────────────────────────────────────

describe('buildGenerationPrompt', () => {
  it('includes the category name', () => {
    const prompt = buildGenerationPrompt('chesed')
    expect(prompt).toContain('"chesed"')
  })

  it('includes the LAYER1_SCHEMA', () => {
    const prompt = buildGenerationPrompt('chesed')
    expect(prompt).toContain(LAYER1_SCHEMA)
  })

  it('includes both new Phase 2 fields in the schema', () => {
    expect(LAYER1_SCHEMA).toContain('semantic_domain_id')
    expect(LAYER1_SCHEMA).toContain('textual_layer_id')
  })

  it('warns about no preamble or markdown fences', () => {
    const prompt = buildGenerationPrompt('YHWH')
    expect(prompt.toLowerCase()).toContain('no preamble')
    expect(prompt.toLowerCase()).toContain('no markdown fences')
  })
})

// ── buildCorrectionPrompt ─────────────────────────────────────────────────────

describe('buildCorrectionPrompt', () => {
  const fakeEntry: Partial<CategoryEntry> = {
    id: 'chesed',
    category_label: 'Steadfast Love',
    one_liner: 'The covenantal faithfulness of YHWH in relational action.',
  }

  it('embeds the current entry as JSON', () => {
    const prompt = buildCorrectionPrompt(
      fakeEntry as CategoryEntry,
      'Minor flags detected.',
      'Fix the one_liner framing.',
    )
    expect(prompt).toContain(JSON.stringify(fakeEntry, null, 2))
  })

  it('embeds the validator summary', () => {
    const prompt = buildCorrectionPrompt(
      fakeEntry as CategoryEntry,
      'Minor flags detected.',
      'Fix the one_liner framing.',
    )
    expect(prompt).toContain('Minor flags detected.')
  })

  it('embeds the combined corrections', () => {
    const prompt = buildCorrectionPrompt(
      fakeEntry as CategoryEntry,
      'Minor flags detected.',
      'Fix the one_liner framing.',
    )
    expect(prompt).toContain('Fix the one_liner framing.')
  })

  it('includes the schema', () => {
    const prompt = buildCorrectionPrompt(
      fakeEntry as CategoryEntry,
      '',
      '',
    )
    expect(prompt).toContain(LAYER1_SCHEMA)
  })
})

// ── LAYER1_SCHEMA integrity ───────────────────────────────────────────────────

describe('LAYER1_SCHEMA structure', () => {
  it('is valid partial JSON skeleton (contains the two new Phase 2 fields)', () => {
    expect(LAYER1_SCHEMA).toContain('semantic_domain_id')
    expect(LAYER1_SCHEMA).toContain('textual_layer_id')
  })

  it('retains the core fields from the HTML source', () => {
    const coreFields = [
      'id',
      'hebrew_root',
      'transliteration',
      'testament_scope',
      'category_label',
      'one_liner',
      'full_definition',
      'what_it_does',
      'what_it_is_not',
      'second_temple_context',
      'kardia_rendering',
      'surface_vehicles',
      'illustrative_renderings',
      'key_verses',
      'related_categories',
      'theological_notes',
      'version',
      'reviewed_by',
    ]
    for (const field of coreFields) {
      expect(LAYER1_SCHEMA, `LAYER1_SCHEMA must contain "${field}"`).toContain(`"${field}"`)
    }
  })

  it('english_glosses uses the two-tier structure', () => {
    expect(LAYER1_SCHEMA).toContain('"recommended"')
    expect(LAYER1_SCHEMA).toContain('"attested"')
    expect(LAYER1_SCHEMA).toContain('"loses"')
  })
})
