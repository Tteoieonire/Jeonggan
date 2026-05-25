import Cursor from '../../domain/navigation/cursor'
import type { MusicEditor } from '../../domain/editing/music-editor'

export type CanvasSelectionEditor = Pick<
  MusicEditor,
  | 'anchor'
  | 'createSelection'
  | 'cursor'
  | 'discardSelection'
  | 'isSelecting'
  | 'normalizeSelection'
>

export function moveCanvasCursor(
  editor: CanvasSelectionEditor,
  coord: Cursor
): void {
  editor.discardSelection()
  editor.cursor.moveTo(coord)
}

export function selectCanvasRange(
  editor: CanvasSelectionEditor,
  coord: Cursor
): void {
  if (editor.cursor.rhythmMode || coord.rhythmMode) {
    editor.discardSelection()
  } else if (!editor.isSelecting) {
    editor.createSelection()
  }

  editor.cursor.moveTo(coord)
  editor.normalizeSelection()
}

export function startCanvasDrag(
  editor: CanvasSelectionEditor,
  coord: Cursor
): boolean {
  if (editor.anchor?.isEqualTo(coord, 'cell')) {
    editor.anchor.moveTo(editor.cursor)
    editor.cursor.moveTo(coord)
    editor.normalizeSelection()
    return true
  }

  return editor.cursor.isEqualTo(coord, 'cell')
}
