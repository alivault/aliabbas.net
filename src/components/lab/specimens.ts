/** The demos of the lab, in tab order. The id is the `demo` search value. */
export const SPECIMENS = [
  { id: 'streaming-list', label: 'Streaming answer' },
  { id: 'citation-drawer', label: 'Citation drawer' },
  { id: 'fluid-resizer', label: 'Fluid resizer' },
  { id: 'state-transition', label: 'Moving card' },
] as const

export type SpecimenId = (typeof SPECIMENS)[number]['id']

export function isSpecimenId(value: unknown): value is SpecimenId {
  return SPECIMENS.some((specimen) => specimen.id === value)
}

/** The id of a tab, so a panel can name its tab. */
export function tabId(id: SpecimenId) {
  return `lab-tab-${id}`
}
