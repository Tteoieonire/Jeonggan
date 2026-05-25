import type { MusicEditor } from '../../domain/music-editor'
import { mergeActions, type UndoOp } from '../../domain/viewer'
import type { KeyboardCommand } from './index'

export type KeyboardEditCommand = Extract<
  KeyboardCommand,
  {
    type:
      | 'backspaceSelection'
      | 'backspace'
      | 'deleteSelection'
      | 'deleteForward'
      | 'cutSelection'
  }
>

export type KeyboardEditEditor = Pick<
  MusicEditor,
  'backspace' | 'cutRange' | 'deletekey' | 'delRange' | 'isEmptyRange'
>

export function getKeyboardEditUndo(
  command: KeyboardEditCommand,
  editor: KeyboardEditEditor
): () => UndoOp {
  switch (command.type) {
    case 'backspaceSelection':
      return editor.isEmptyRange()
        ? mergeActions(
            () => editor.delRange(),
            () => editor.backspace()
          )
        : () => editor.cutRange()[1]
    case 'backspace':
      return () => editor.backspace()
    case 'deleteSelection':
      return editor.isEmptyRange()
        ? mergeActions(
            () => editor.delRange(),
            () => editor.deletekey()
          )
        : () => editor.cutRange()[1]
    case 'deleteForward':
      return () => editor.deletekey()
    case 'cutSelection':
      return () => editor.cutRange()[1]
  }
}
