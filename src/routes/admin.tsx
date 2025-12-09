import { createFileRoute } from '@tanstack/react-router'
import { defineConfig, Studio } from "sanity"
import { structureTool } from "sanity/structure"
import { codeInput } from "@sanity/code-input"
import { schemaTypes } from "../sanity/schemaTypes"

const config = defineConfig({
  projectId: "a5xqifrz",
  dataset: "production",
  basePath: "/admin",
  plugins: [structureTool(), codeInput()],
  schema: {
    types: schemaTypes,
  },
});

export const Route = createFileRoute('/admin')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="h-screen max-h-dvh overscroll-none">
      <Studio config={config} />
    </div>
  )
}
