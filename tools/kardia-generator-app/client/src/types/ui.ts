export type ApprovalStatus = 'idle' | 'saving' | 'success' | 'error'

export interface ApprovalState {
  status: ApprovalStatus
  message: string | null
}
