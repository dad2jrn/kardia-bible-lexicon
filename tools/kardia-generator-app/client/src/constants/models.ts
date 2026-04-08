import type { ApiProvider } from '@/types'

export type ModelId =
  | 'claude-sonnet-4-6'
  | 'claude-opus-4-6'
  | 'claude-haiku-4-5-20251001'
  | 'gpt-5.4'
  | 'gpt-5.4-pro'
  | 'gpt-5.4-mini'
  | 'gpt-5.4-nano'
  | 'gpt-5'
  | 'gpt-4.1'

export interface ModelOption {
  id: ModelId
  label: string
  subtitle: string
  costHint: string
  provider: ApiProvider
}

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: 'claude-sonnet-4-6',
    label: 'Sonnet 4.6',
    subtitle: 'Most reliable guard rails',
    costHint: '~$0.03 / entry',
    provider: 'anthropic',
  },
  {
    id: 'claude-opus-4-6',
    label: 'Opus 4.6',
    subtitle: 'Highest theological fidelity',
    costHint: '~$0.05 / entry',
    provider: 'anthropic',
  },
  {
    id: 'claude-haiku-4-5-20251001',
    label: 'Haiku 4.5',
    subtitle: 'Fast iteration, budget friendly',
    costHint: '~$0.01 / entry',
    provider: 'anthropic',
  },
  {
    id: 'gpt-5.4',
    label: 'GPT-5.4',
    subtitle: 'Flagship — best intelligence; recommended default',
    costHint: 'Flagship',
    provider: 'openai',
  },
  {
    id: 'gpt-5.4-pro',
    label: 'GPT-5.4 pro',
    subtitle: 'Smarter and more precise; higher cost',
    costHint: 'Precision tier',
    provider: 'openai',
  },
  {
    id: 'gpt-5.4-mini',
    label: 'GPT-5.4 mini',
    subtitle: 'Strongest mini; good for fast iteration',
    costHint: 'Mini tier',
    provider: 'openai',
  },
  {
    id: 'gpt-5.4-nano',
    label: 'GPT-5.4 nano',
    subtitle: 'Cheapest; built for high-volume simple tasks',
    costHint: 'Nano tier',
    provider: 'openai',
  },
  {
    id: 'gpt-5',
    label: 'GPT-5',
    subtitle: 'Previous flagship reasoning model',
    costHint: 'Legacy flagship',
    provider: 'openai',
  },
  {
    id: 'gpt-4.1',
    label: 'GPT-4.1',
    subtitle: 'Smartest non-reasoning model; reliable for structured JSON',
    costHint: 'Structured',
    provider: 'openai',
  },
]

export const MODEL_OPTIONS_BY_PROVIDER: Record<ApiProvider, ModelOption[]> = {
  anthropic: MODEL_OPTIONS.filter(option => option.provider === 'anthropic'),
  openai: MODEL_OPTIONS.filter(option => option.provider === 'openai'),
}

export const DEFAULT_MODEL_BY_PROVIDER: Record<ApiProvider, ModelId> = {
  anthropic: 'claude-sonnet-4-6',
  openai: 'gpt-5.4',
}

export const MODEL_META_BY_ID: Record<ModelId, ModelOption> = MODEL_OPTIONS.reduce(
  (acc, option) => {
    acc[option.id] = option
    return acc
  },
  {} as Record<ModelId, ModelOption>,
)
