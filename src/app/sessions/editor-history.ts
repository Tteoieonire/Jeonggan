import Cursor from '../../domain/navigation/cursor'
import type { MusicEditor } from '../../domain/editing/music-editor'
import { ActionHistory } from '../../features/history'

const DEFAULT_EDITOR_HISTORY_LIMIT = 100

export type EditorHistoryState = {
  cursor: Cursor
  anchor: Cursor | undefined
}

export type EditorHistory = ActionHistory<EditorHistoryState>

export function createEditorHistory(
  editor: MusicEditor,
  afterChange: () => void,
  maxRecords = DEFAULT_EDITOR_HISTORY_LIMIT
): EditorHistory {
  return new ActionHistory(
    () => captureEditorHistoryState(editor),
    state => restoreEditorHistoryState(editor, state),
    afterChange,
    maxRecords
  )
}

export function captureEditorHistoryState(
  editor: MusicEditor
): EditorHistoryState {
  return {
    cursor: editor.cursor.clone(),
    anchor: editor.anchor?.clone(),
  }
}

export function restoreEditorHistoryState(
  editor: MusicEditor,
  state: EditorHistoryState
): void {
  editor.anchor = state.anchor?.clone()
  editor.cursor.moveTo(state.cursor)
}
