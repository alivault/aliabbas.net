import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash'
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css'
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go'
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx'
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown'
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python'
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx'
// Only register the languages you actually use
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript'
import oneDark from 'react-syntax-highlighter/dist/esm/styles/prism/one-dark'

const codeTheme: typeof oneDark = Object.fromEntries(
  Object.entries(oneDark).map(([token, style]) => [
    token,
    { ...style, fontStyle: 'normal' },
  ]),
)

SyntaxHighlighter.registerLanguage('typescript', typescript)
SyntaxHighlighter.registerLanguage('ts', typescript)
SyntaxHighlighter.registerLanguage('tsx', tsx)
SyntaxHighlighter.registerLanguage('javascript', javascript)
SyntaxHighlighter.registerLanguage('js', javascript)
SyntaxHighlighter.registerLanguage('jsx', jsx)
SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('shell', bash)
SyntaxHighlighter.registerLanguage('sh', bash)
SyntaxHighlighter.registerLanguage('json', json)
SyntaxHighlighter.registerLanguage('python', python)
SyntaxHighlighter.registerLanguage('py', python)
SyntaxHighlighter.registerLanguage('go', go)
SyntaxHighlighter.registerLanguage('css', css)
SyntaxHighlighter.registerLanguage('markdown', markdown)
SyntaxHighlighter.registerLanguage('md', markdown)

interface CodeBlockProps {
  value: { code: string; language?: string; filename?: string }
}

export function CodeBlock({ value }: CodeBlockProps) {
  if (!value.code) return null

  // Square, with the thin HUD edge of the readers, on a dark ground that
  // lets the world show a little. Mono at 14px, the smallest size for code.
  return (
    <div className="border-hud/20 my-4 border">
      {value.filename && (
        <div className="border-hud/20 text-fg-muted border-b px-4 py-2 font-mono text-sm">
          {value.filename}
        </div>
      )}
      <SyntaxHighlighter
        language={value.language || 'text'}
        style={codeTheme}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          background: 'color-mix(in oklab, var(--background) 80%, transparent)',
          fontSize: '14px',
          lineHeight: '24px',
        }}
        codeTagProps={{ style: { fontSize: '14px' } }}
      >
        {value.code}
      </SyntaxHighlighter>
    </div>
  )
}
