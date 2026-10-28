import { Fragment } from 'react'

/**
 * A file path that wraps after a slash, not in the middle of a name. Use it
 * with `[overflow-wrap:anywhere]`, so one very long name can still break.
 */
export default function PathText({ path }: { path: string }) {
  const parts = path.split('/')
  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {part}
          {index < parts.length - 1 && (
            <>
              /<wbr />
            </>
          )}
        </Fragment>
      ))}
    </>
  )
}
