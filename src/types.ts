import type { JSXElementConstructor, ReactElement } from 'react'

export type Meta = {
  id: string
  title: string
  date: string
  description: string
}

export type Article = {
  meta: Meta
  content: ReactElement<unknown, string | JSXElementConstructor<unknown>>
}
