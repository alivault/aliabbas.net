import { createFileRoute } from '@tanstack/react-router'
import { DESIGN_RULES } from '~/lib/design/rules'
import { designTokensDocument } from '~/lib/design/tokens'

export const Route = createFileRoute('/design_/tokens.json')({
  server: {
    handlers: {
      GET: () =>
        Response.json(designTokensDocument(DESIGN_RULES), {
          headers: {
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
          },
        }),
    },
  },
})
