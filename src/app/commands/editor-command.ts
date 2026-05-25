import { RHYTHM_OBJ } from '../../domain/constants'
import type { CoordLevel } from '../../domain/navigation/cursor'
import type { MusicEditor } from '../../domain/editing/music-editor'
import type { EntryOf } from '../../domain/symbols'
import type { UndoOp } from '../../domain/navigation/viewer'
import type { ClipboardData } from '../../features/clipboard'
import { getEntryWriteUndo } from '../../features/entry-write'
import type { IME } from '../../features/ime'

type EditorHistoryPort = {
  do(op: () => UndoOp): void
  undo(): boolean
  redo(): boolean
}

export type EditorCommandHost = {
  editor: MusicEditor
  ime: IME
  history: EditorHistoryPort
  clipboard: ClipboardData | undefined
}

export type WriteEntryCommand<K extends keyof EntryOf = keyof EntryOf> = {
  type: 'writeEntry'
  where: K
  entry?: EntryOf[K]
  resetIme?: boolean
}

export type EditorCommand =
  | WriteEntryCommand
  | { type: 'erase' }
  | { type: 'changeShape'; level: CoordLevel; delta: -1 | 1 }
  | { type: 'toggleBreathMark' }
  | { type: 'writeRhythmTick'; tickIdx: number }
  | { type: 'cut' }
  | { type: 'copy' }
  | { type: 'paste' }
  | { type: 'undo' }
  | { type: 'redo' }

export function executeEditorCommand(
  host: EditorCommandHost,
  command: EditorCommand
): void {
  switch (command.type) {
    case 'writeEntry':
      writeEntry(host, command)
      return
    case 'erase':
      erase(host)
      return
    case 'changeShape':
      changeShape(host, command.level, command.delta)
      return
    case 'toggleBreathMark':
      toggleBreathMark(host)
      return
    case 'writeRhythmTick':
      host.history.do(() =>
        host.editor.writeRhythmTick(RHYTHM_OBJ[command.tickIdx])
      )
      return
    case 'cut':
      cut(host)
      return
    case 'copy':
      host.clipboard = host.editor.copy()
      return
    case 'paste':
      paste(host)
      return
    case 'undo':
      host.ime.reset()
      host.history.undo()
      return
    case 'redo':
      host.ime.reset()
      host.history.redo()
      return
  }
}

function writeEntry<K extends keyof EntryOf>(
  host: EditorCommandHost,
  command: WriteEntryCommand<K>
): void {
  const op = getEntryWriteUndo(host.editor, command.where, command.entry)
  if (op == null) return
  host.history.do(op)
  if (command.resetIme !== false) host.ime.reset()
}

function erase(host: EditorCommandHost): void {
  if (host.editor.isSelecting) return
  if (host.editor.cursor.rhythmMode) {
    host.history.do(() => host.editor.eraseRhythmTick())
  } else {
    host.history.do(() => host.editor.erase())
    host.ime.reset()
  }
}

function changeShape(
  host: EditorCommandHost,
  level: CoordLevel,
  delta: -1 | 1
): void {
  if (host.editor.isSelecting) return
  if (delta === +1) host.history.do(() => host.editor.add(level))
  else host.history.do(() => host.editor.del(level))
}

function toggleBreathMark(host: EditorCommandHost): void {
  if (host.editor.isSelecting || host.editor.cursor.rhythmMode) return
  host.history.do(() => host.editor.toggleBreathMark())
  host.ime.reset()
}

function cut(host: EditorCommandHost): void {
  host.history.do(() => {
    if (host.editor.isSelecting) {
      const [content, undo] = host.editor.cutRange()
      host.clipboard = ['Range', content]
      return undo
    }

    const [content, undo] = host.editor.cutEntry()
    host.clipboard = ['Entry', content]
    return undo
  })
}

function paste(host: EditorCommandHost): void {
  if (host.clipboard == null) return
  const [mode, content] = host.clipboard
  host.history.do(() =>
    mode === 'Entry'
      ? host.editor.pasteEntry(content)
      : host.editor.pasteRange(content)
  )
}
