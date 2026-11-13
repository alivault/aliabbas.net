import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'

/** Letters that the face of the HUD has, so the width does not jump. */
const CHARACTERS = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#+*')
const FRAMES = 14
const FRAME_MS = 38

function scramble(word: string, revealed: number) {
  return Array.from(word, (character, index) =>
    index < revealed || character === ' '
      ? character
      : CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)],
  ).join('')
}

/**
 * A label that scrambles into its new text when the text changes, letter
 * by letter from the left, as the old home page did with its words. Use it
 * where one control changes its job in place (Index, Return, Close).
 * Screen readers get the real text only. With reduced motion, the text
 * changes at once.
 *
 * `from` scrambles in on mount too: a control that takes the place of
 * another (Close over Index) starts from the old label.
 */
export default function ScrambleText({
  text,
  from,
}: {
  text: string
  from?: string
}) {
  const reduceMotion = useReducedMotion()
  const [shown, setShown] = useState(from ?? text)
  /** The text that last showed in full. A cut-off scramble starts again. */
  const settled = useRef(from ?? text)

  useEffect(() => {
    if (settled.current === text) return
    if (reduceMotion) {
      settled.current = text
      setShown(text)
      return
    }
    let frame = 0
    setShown(scramble(text, 0))
    const timer = window.setInterval(() => {
      frame += 1
      if (frame >= FRAMES) {
        window.clearInterval(timer)
        settled.current = text
        setShown(text)
        return
      }
      setShown(scramble(text, Math.floor((frame / FRAMES) * text.length)))
    }, FRAME_MS)
    return () => window.clearInterval(timer)
  }, [text, reduceMotion])

  return (
    <>
      <span aria-hidden="true">{shown}</span>
      <span className="sr-only">{text}</span>
    </>
  )
}
