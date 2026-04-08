import { describe, expect, it } from 'vitest'

import { validateAnthropicKey, validateOpenAiKey } from './validation'

describe('validateAnthropicKey', () => {
  it('accepts keys that start with sk-ant- and rejects malformed keys', () => {
    expect(validateAnthropicKey('sk-ant-valid-1234')).toBe(true)
    expect(validateAnthropicKey('  sk-ant-another-key  ')).toBe(true)
    expect(validateAnthropicKey('sk-live-123')).toBe(false)
    expect(validateAnthropicKey('')).toBe(false)
  })
})

describe('validateOpenAiKey', () => {
  it('accepts keys that start with sk- and rejects malformed keys', () => {
    expect(validateOpenAiKey('sk-valid-openai-key')).toBe(true)
    expect(validateOpenAiKey('  sk-openai-123  ')).toBe(true)
    expect(validateOpenAiKey('ak-live-invalid')).toBe(false)
    expect(validateOpenAiKey('')).toBe(false)
  })
})
