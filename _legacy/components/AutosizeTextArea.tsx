'use client'

import * as React from 'react'
import { useImperativeHandle } from 'react'
import { cn } from '@/lib/utils'

interface UseAutosizeTextAreaProps {
  textAreaRef: HTMLTextAreaElement | null
  minHeight?: number
  maxHeight?: number
  triggerAutoSize: string
}

const offsetBorder = 2

export const useAutosizeTextArea = ({
  textAreaRef,
  triggerAutoSize,
  maxHeight = Number.MAX_SAFE_INTEGER,
  minHeight = 0,
}: UseAutosizeTextAreaProps) => {
  const [init, setInit] = React.useState(true)
  React.useEffect(() => {
    // We need to reset the height momentarily to get the correct scrollHeight for the textarea
    if (textAreaRef) {
      if (init) {
        textAreaRef.style.minHeight = `${minHeight + offsetBorder}px`
        if (maxHeight > minHeight) {
          textAreaRef.style.maxHeight = `${maxHeight}px`
        }
        setInit(false)
      }
      textAreaRef.style.height = `${minHeight + offsetBorder}px`
      const scrollHeight = textAreaRef.scrollHeight
      // We then set the height directly, outside of the render loop
      // Trying to set this with state or a ref will product an incorrect value.
      if (scrollHeight > maxHeight) {
        textAreaRef.style.height = `${maxHeight}px`
      } else {
        textAreaRef.style.height = `${scrollHeight + offsetBorder}px`
      }
    }
  }, [textAreaRef, triggerAutoSize, maxHeight, minHeight, init])
}

export type AutosizeTextAreaRef = {
  textArea: HTMLTextAreaElement | null
  maxHeight: number
  minHeight: number
  focus: () => void
}

type AutosizeTextAreaProps = {
  maxHeight?: number
  minHeight?: number
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>

export const AutosizeTextarea = React.forwardRef<
  AutosizeTextAreaRef,
  AutosizeTextAreaProps
>(
  (
    {
      maxHeight = Number.MAX_SAFE_INTEGER,
      minHeight = 90,
      className,
      onChange,
      value,
      ...props
    }: AutosizeTextAreaProps,
    ref: React.Ref<AutosizeTextAreaRef>,
  ) => {
    const textAreaRef = React.useRef<HTMLTextAreaElement | null>(null)
    const [triggerAutoSize, setTriggerAutoSize] = React.useState('')

    useAutosizeTextArea({
      textAreaRef: textAreaRef.current,
      triggerAutoSize: triggerAutoSize,
      maxHeight,
      minHeight,
    })

    useImperativeHandle(ref, () => ({
      textArea: textAreaRef.current,
      maxHeight,
      minHeight,
      focus: () => {
        if (textAreaRef.current) {
          textAreaRef.current.focus()
        }
      },
    }))

    React.useEffect(() => {
      if (value) {
        setTriggerAutoSize(value as string)
      }
    }, [value])

    return (
      <textarea
        {...props}
        value={value}
        ref={textAreaRef}
        style={{ minHeight: `${minHeight + offsetBorder}px` }}
        className={cn(
          'flex w-full rounded-md border border-border bg-input px-3 py-2 outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        onChange={(e) => {
          setTriggerAutoSize(e.target.value)
          onChange?.(e)
        }}
      />
    )
  },
)
AutosizeTextarea.displayName = 'AutosizeTextarea'
