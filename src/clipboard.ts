import Cursor from './cursor'
import type { Entry } from './viewer'

export type ClipboardData = ['Entry', Entry] | ['Range', Entry[][][]]

export function canPaste(
  clipboard: ClipboardData | undefined,
  isSelecting: boolean,
  anchor: Cursor | undefined,
  cursor: Cursor
): boolean {
  if (clipboard == null) return false

  const mode = clipboard[0]
  if (mode === 'Range') return true
  if (!isSelecting) return true

  return anchor?.chapter === cursor.chapter && anchor.cell === cursor.cell
}
