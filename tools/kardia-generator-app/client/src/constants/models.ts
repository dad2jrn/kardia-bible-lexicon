export type ModelId = 'claude-sonnet-4-6' | 'claude-opus-4-6' | 'claude-haiku-4-5-20251001'

export interface ModelOption {
  id: ModelId
  label: string
  subtitle: string
  costHint: string
}

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: 'claude-sonnet-4-6',
    label: 'Sonnet 4.6',
    subtitle: 'Most reliable guard rails',
    costHint: '~$0.03 / entry',
  },
  {
    id: 'claude-opus-4-6',
    label: 'Opus 4.6',
    subtitle: 'Highest theological fidelity',
    costHint: '~$0.05 / entry',
  },
  {
    id: 'claude-haiku-4-5-20251001',
    label: 'Haiku 4.5',
    subtitle: 'Fast iteration, budget friendly',
    costHint: '~$0.01 / entry',
  },
]
