import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  JsonParseError,
  buildCorrectionPrompt,
  buildGenerationPrompt,
  runGeneration,
  runKardiaVerseTranslation,
  runValidation,
} from '@/lib/anthropic'
import type { CategoryEntry, KardiaVerse, ValidatorResult, ApiProvider } from '@/types'
import type { CategorySelection } from '@/types/category'
import type { ModelId } from '@/constants/models'

export type GeneratorStep = 'idle' | 'generating' | 'validating' | 'translating' | 'complete' | 'error'

export interface GeneratorStatus {
  step: GeneratorStep
  label: string
  helperText: string
  tone: 'muted' | 'info' | 'success' | 'error'
}

export interface CorrectionRequest {
  combinedCorrections: string
}

export interface UseGeneratorReturn {
  entry: CategoryEntry | null
  validator: ValidatorResult | null
  kardiaVerses: KardiaVerse[]
  rawRecovery: string | null
  error: string | null
  iteration: number
  status: GeneratorStatus
  isBusy: boolean
  canGenerate: boolean
  generateFresh: (
    category: CategorySelection,
    model: ModelId,
    apiKey: string,
    provider: ApiProvider,
  ) => Promise<void>
  regenerateWithSameParams: () => Promise<void>
  retryAfterFailure: () => Promise<void>
  requestCorrections: (corrections: CorrectionRequest) => Promise<void>
  abortInFlight: () => void
  resetOutputs: () => void
}

interface GeneratorParams {
  category: CategorySelection
  model: ModelId
  apiKey: string
  provider: ApiProvider
}

function getStatusFromStep(step: GeneratorStep, error: string | null): GeneratorStatus {
  switch (step) {
    case 'generating':
      return {
        step,
        label: 'Generating entry',
        helperText: 'Running model primary pass…',
        tone: 'info',
      }
    case 'validating':
      return {
        step,
        label: 'Validating theology',
        helperText: 'Applying validator checklist…',
        tone: 'info',
      }
    case 'translating':
      return {
        step,
        label: 'Translating verses',
        helperText: 'Producing Kardia verse renderings…',
        tone: 'info',
      }
    case 'complete':
      return {
        step,
        label: 'Generation complete',
        helperText: 'Review the JSON, validator flags, and preview below.',
        tone: 'success',
      }
    case 'error':
      return {
        step,
        label: 'Generation failed',
        helperText: error ?? 'Unknown error. Try again in a moment.',
        tone: 'error',
      }
    default:
      return {
        step: 'idle',
        label: 'Ready to generate',
        helperText: 'Select a category and provide an API key to begin.',
        tone: 'muted',
      }
  }
}

export function useGenerator(): UseGeneratorReturn {
  const [entry, setEntry] = useState<CategoryEntry | null>(null)
  const [validator, setValidator] = useState<ValidatorResult | null>(null)
  const [kardiaVerses, setKardiaVerses] = useState<KardiaVerse[]>([])
  const [rawRecovery, setRawRecovery] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<GeneratorStep>('idle')
  const [iteration, setIteration] = useState(0)

  const lastParamsRef = useRef<GeneratorParams | null>(null)
  const lastCategoryIdRef = useRef<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const abortInFlight = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  const resetOutputs = useCallback(() => {
    abortInFlight()
    setEntry(null)
    setValidator(null)
    setKardiaVerses([])
    setRawRecovery(null)
    setError(null)
    setStep('idle')
    setIteration(0)
    lastParamsRef.current = null
    lastCategoryIdRef.current = null
  }, [abortInFlight])

  useEffect(() => {
    return () => {
      abortInFlight()
    }
  }, [abortInFlight])

  interface RunPipelineOptions {
    promptOverride?: string
  }

  const runPipeline = useCallback(
    async (params: GeneratorParams, options?: RunPipelineOptions) => {
      abortInFlight()
      setError(null)
      setRawRecovery(null)
      setStep('generating')

      if (params.category.id !== lastCategoryIdRef.current) {
        setIteration(0)
        setEntry(null)
        setValidator(null)
        setKardiaVerses([])
        setRawRecovery(null)
      }
      lastCategoryIdRef.current = params.category.id
      lastParamsRef.current = params

      const controller = new AbortController()
      abortControllerRef.current = controller

      const prompt = options?.promptOverride ?? buildGenerationPrompt(params.category.label)

      try {
        const generated = await runGeneration(params.apiKey, prompt, params.model, params.provider, {
          signal: controller.signal,
        })
        setEntry(generated)

        setStep('validating')
        const validated = await runValidation(params.apiKey, generated, params.model, params.provider, {
          signal: controller.signal,
        })
        setValidator(validated)

        setStep('translating')
        let verses: KardiaVerse[] = []
        try {
          verses = await runKardiaVerseTranslation(params.apiKey, generated, params.model, params.provider, {
            signal: controller.signal,
          })
        } catch (translationErr) {
          console.warn('Verse translation error:', translationErr)
        }
        setKardiaVerses(verses)

        setIteration(prev => prev + 1)
        setStep('complete')
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          setError('Generation cancelled.')
          setStep('idle')
        } else if (err instanceof JsonParseError) {
          setError(err.message)
          setRawRecovery(err.rawText)
          setEntry(null)
          setValidator(null)
          setKardiaVerses([])
          setStep('error')
        } else {
          setError((err as Error).message || 'Unexpected error occurred.')
          setStep('error')
        }
      } finally {
        abortControllerRef.current = null
      }
    },
    [abortInFlight],
  )

  const generateFresh = useCallback(
    async (category: CategorySelection, model: ModelId, apiKey: string, provider: ApiProvider) => {
      await runPipeline({ category, model, apiKey, provider })
    },
    [runPipeline],
  )

  const regenerateWithSameParams = useCallback(async () => {
    if (!lastParamsRef.current) return
    await runPipeline(lastParamsRef.current)
  }, [runPipeline])

  const requestCorrections = useCallback(
    async ({ combinedCorrections }: CorrectionRequest) => {
      if (!lastParamsRef.current || !entry || !validator) {
        throw new Error('No generator run to correct yet.')
      }
      const prompt = buildCorrectionPrompt(entry, validator.summary, combinedCorrections)
      await runPipeline(lastParamsRef.current, { promptOverride: prompt })
    },
    [entry, validator, runPipeline],
  )

  const retryAfterFailure = useCallback(async () => {
    await regenerateWithSameParams()
  }, [regenerateWithSameParams])

  const isBusy = step === 'generating' || step === 'validating' || step === 'translating'
  const status = useMemo(() => getStatusFromStep(step, error), [step, error])
  const canGenerate = !isBusy

  return {
    entry,
    validator,
    kardiaVerses,
    rawRecovery,
    error,
    iteration,
    status,
    isBusy,
    canGenerate,
    generateFresh,
    regenerateWithSameParams,
    retryAfterFailure,
    requestCorrections,
    abortInFlight,
    resetOutputs,
  }
}
