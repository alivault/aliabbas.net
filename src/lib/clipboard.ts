/**
 * Puts text on the clipboard. The Clipboard API is only on a secure page
 * (https or localhost); on plain http, as on a LAN or Tailscale address,
 * it is missing. Then a selected, hidden field and the copy command do the
 * work. Call it from a click, so the browser allows the copy.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (window.isSecureContext && navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Fall through to the copy command.
  }
  const field = document.createElement('textarea')
  field.value = text
  field.setAttribute('readonly', '')
  field.style.cssText = 'position:fixed;top:0;left:0;opacity:0'
  const focused = document.activeElement
  document.body.appendChild(field)
  field.select()
  let done = false
  try {
    done = document.execCommand('copy')
  } catch {
    done = false
  }
  field.remove()
  if (focused instanceof HTMLElement) focused.focus({ preventScroll: true })
  return done
}
