import { createContext, use, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useClaimCheck } from './use-claim-check'

type CheckSessionValue = ReturnType<typeof useClaimCheck> & {
  draft: string
  setDraft: (draft: string) => void
}

const CheckSessionContext = createContext<CheckSessionValue | null>(null)

/**
 * The claim check for the whole site, above the pages, so a detour to the
 * chat or to a cited page keeps the result and the draft.
 */
export function CheckSessionProvider({ children }: { children: ReactNode }) {
  const { state, check, stop } = useClaimCheck()
  const [draft, setDraft] = useState('')
  const value = useMemo(
    () => ({ state, check, stop, draft, setDraft }),
    [state, check, stop, draft],
  )
  return <CheckSessionContext value={value}>{children}</CheckSessionContext>
}

export function useCheckSession() {
  const value = use(CheckSessionContext)
  if (!value) throw new Error('useCheckSession needs CheckSessionProvider')
  return value
}
