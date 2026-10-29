import type { CSSProperties } from 'react'
import { COLORS, SCHEME_STYLES } from '~/lib/design/tokens'
import type { ColorGroup } from '~/lib/design/tokens'

const GROUPS: ReadonlyArray<ColorGroup> = [
  'Surface',
  'Text',
  'Action',
  'Line',
  'Status',
]

function Half({ scheme, value }: { scheme: 'light' | 'dark'; value: string }) {
  return (
    <span
      className="block h-full flex-1"
      style={{ ...SCHEME_STYLES[scheme], background: value } as CSSProperties}
    />
  )
}

/** Every color token, light and dark side by side, by what it is for. */
export default function ColorTokens() {
  return (
    <div className="space-y-12">
      {GROUPS.map((group) => (
        <div key={group}>
          <h3 className="text-foreground text-base font-semibold">{group}</h3>
          <ul className="border-foreground/10 mt-4 grid border-t sm:grid-cols-2">
            {COLORS.filter((color) => color.group === group).map((color) => (
              <li
                key={color.name}
                className="border-foreground/10 flex gap-4 border-b py-4 sm:odd:pr-6 sm:even:pl-6"
              >
                <span
                  aria-hidden="true"
                  className="border-foreground/15 flex size-12 shrink-0 overflow-hidden rounded-full border"
                  title={`Light: ${color.light}. Dark: ${color.dark}.`}
                >
                  <Half scheme="light" value={color.light} />
                  <Half scheme="dark" value={color.dark} />
                </span>
                <div className="min-w-0 space-y-1">
                  <p className="text-foreground font-mono text-sm">
                    {color.tailwind}
                  </p>
                  <p className="text-foreground/60 text-sm leading-6">
                    {color.use}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <p className="text-foreground/55 text-sm leading-6">
        Each circle shows the light value on the left and the dark value on the
        right. The page follows the color scheme of your system.
      </p>
    </div>
  )
}
