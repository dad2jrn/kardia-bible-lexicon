/**
 * Validate Anthropic API keys used by the local client.
 * Keys must start with `sk-ant-` and contain at least one additional segment.
 */
export function validateAnthropicKey(raw: string): boolean {
  const value = raw.trim()
  return value.length > 'sk-ant-'.length && value.startsWith('sk-ant-')
}

/**
 * Validate OpenAI API keys used by the local client.
 * Keys must start with `sk-` (standard shared prefix) and include additional characters.
 */
export function validateOpenAiKey(raw: string): boolean {
  const value = raw.trim()
  return value.length > 'sk-'.length && value.startsWith('sk-')
}
