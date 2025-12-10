import { defineConfig, Studio } from 'sanity'
import { structureTool } from 'sanity/structure'
import { codeInput } from '@sanity/code-input'
import { schemaTypes } from '../../sanity/schemaTypes'

const config = defineConfig({
  projectId: 'a5xqifrz',
  dataset: 'production',
  basePath: '/admin',
  plugins: [structureTool(), codeInput()],
  schema: {
    types: schemaTypes,
  },
})

export default function SanityStudio() {
  return <Studio config={config} />
}

