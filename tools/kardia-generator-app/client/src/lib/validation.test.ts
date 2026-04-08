import { describe, expect, it } from 'vitest'

import { validateAnthropicKey } from './validation'

describe('validateAnthropicKey', () => {
  it('accepts keys that start with sk-ant- and rejects malformed keys', () => {
    expect(validateAnthropicKey('sk-ant-valid-1234')).toBe(true)
    expect(validateAnthropicKey('  sk-ant-another-key  ')).toBe(true)
    expect(validateAnthropicKey('sk-live-123')).toBe(false)
    expect(validateAnthropicKey('')).toBe(false)
  })
})
