import { REST_OBJ, YUL_OBJ } from '../domain/constants'
import type { MusicEditor } from '../domain/editor'
import type { IME } from '../features/ime'
import { resolveImeWrite } from '../features/ime-write'
import type { KeyboardCommand } from '../features/keyboard'
import type { EditorCommand } from './editor-command'

export type EditorKeyboardCommandState = {
  editor: Pick<MusicEditor, 'isSelecting'>
  ime: IME
  octave: number
  sigimShow: boolean
}

export function editorCommandFromKeyboard(
  command: KeyboardCommand,
  state: EditorKeyboardCommandState
): EditorCommand | undefined {
  switch (command.type) {
    case 'shapeChange':
      return {
        type: 'changeShape',
        level: command.what,
        delta: command.delta,
      }
    case 'eraseRhythmTick':
      return { type: 'erase' }
    case 'deleteRhythmRow':
      return { type: 'changeShape', level: 'row', delta: -1 }
    case 'imeBackspace':
      return {
        type: 'writeEntry',
        where: command.where,
        entry: state.ime.backspace(),
        resetIme: false,
      }
    case 'eraseModifier':
      return { type: 'writeEntry', where: 'modifier', entry: undefined }
    case 'eraseEntry':
      return { type: 'erase' }
    case 'paste':
      return { type: 'paste' }
    case 'copy':
      return { type: 'copy' }
    case 'writeRest':
      return { type: 'writeEntry', where: 'main', entry: REST_OBJ }
    case 'writeIme':
      return imeWriteCommand(command, state)
    case 'writeRhythmTick':
      return { type: 'writeRhythmTick', tickIdx: command.tickIdx }
    case 'undo':
      return { type: 'undo' }
    case 'redo':
      return { type: 'redo' }
    case 'cut':
      return { type: 'cut' }
    case 'writePitch':
      return {
        type: 'writeEntry',
        where: 'main',
        entry: YUL_OBJ[state.octave + 3][command.pitchIdx],
      }
    default:
      return undefined
  }
}

function imeWriteCommand(
  command: Extract<KeyboardCommand, { type: 'writeIme' }>,
  state: EditorKeyboardCommandState
): EditorCommand | undefined {
  const write = resolveImeWrite(state.ime, {
    key: command.key,
    shiftKey: command.shiftKey,
    isSelecting: state.editor.isSelecting,
    sigimShow: state.sigimShow,
  })
  if (write.type === 'none') return undefined
  return {
    type: 'writeEntry',
    where: write.where,
    entry: write.entry,
    resetIme: false,
  }
}
