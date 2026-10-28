import { createContext, useContext } from 'react'

/**
 * Chat and the claim checker stay mounted side by side under one layout.
 * A panel reads this to know if it is the one on screen, for example so
 * that Esc stops only the visible stream.
 */
export const PanelActiveContext = createContext(true)

export function usePanelActive() {
  return useContext(PanelActiveContext)
}
