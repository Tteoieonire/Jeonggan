import type { MusicEditor } from '../../domain/music-editor'
import type { Config, UndoOp } from '../../domain/viewer'
import type { IME } from '../../features/ime'
import type { KeyboardCommand } from '../../features/keyboard'
import { getKeyboardEditUndo } from '../../features/keyboard/edit'
import { executeKeyboardNavigation } from '../../features/keyboard/navigation'
import type { EditorCommand } from './editor-command'
import { editorCommandFromKeyboard } from './editor-keyboard-command'

export type EditorKeyboardExecutorHost = {
  editor: MusicEditor
  config: Config
  ime: IME
  octave: number
  sigimShow: boolean
  execute(command: EditorCommand): void
  doWithHistory(op: () => UndoOp): void
  writeOctave(delta: 1 | -1): void
}

export function executeEditorKeyboardCommand(
  host: EditorKeyboardExecutorHost,
  command: KeyboardCommand
): void {
  const editorCommand = editorCommandFromKeyboard(command, host)
  if (editorCommand != null) {
    host.execute(editorCommand)
    return
  }

  switch (command.type) {
    case 'ignore':
      return
    case 'moveUpDown':
    case 'moveLeftRight':
    case 'discardSelection':
    case 'home':
    case 'end':
      executeKeyboardNavigation(command, host.editor, host.config)
      return
    case 'backspaceSelection':
    case 'backspace':
    case 'deleteSelection':
    case 'deleteForward':
    case 'cutSelection':
      host.doWithHistory(getKeyboardEditUndo(command, host.editor))
      return
    case 'octave':
      host.writeOctave(command.delta)
      return
    case 'selectAll':
      host.editor.selectAll()
      return
  }
}
