import Cursor from '../../domain/navigation/cursor'
import type { Entry, EntryRange } from '../../domain/navigation/viewer'

export type ClipboardData = ['Entry', Entry] | ['Range', EntryRange]

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
