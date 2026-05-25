import type { MusicEditor } from '../../domain/music-editor'
import type { Config } from '../../domain/viewer'
import { SNAP } from '../../domain/viewer'
import type { KeyboardCommand } from './index'

export type KeyboardNavigationCommand = Extract<
  KeyboardCommand,
  {
    type: 'moveUpDown' | 'moveLeftRight' | 'discardSelection' | 'home' | 'end'
  }
>

export type KeyboardNavigationEditor = Pick<
  MusicEditor,
  | 'createSelection'
  | 'cursor'
  | 'discardSelection'
  | 'isSelecting'
  | 'move'
  | 'moveEnd'
  | 'moveHome'
  | 'moveLeftRight'
  | 'moveRhythm'
  | 'moveUpDown'
>

export function executeKeyboardNavigation(
  command: KeyboardNavigationCommand,
  editor: KeyboardNavigationEditor,
  config: Pick<Config, 'rhythm'>
): void {
  switch (command.type) {
    case 'moveUpDown':
      prepareKeyboardSelection(editor, command.select)
      editor.moveUpDown(command.direction)
      return
    case 'moveLeftRight':
      prepareKeyboardSelection(editor, command.select)
      editor.moveLeftRight(command.direction)
      return
    case 'discardSelection':
      editor.discardSelection()
      return
    case 'home':
      if (command.rhythmMode) {
        editor.moveRhythm('cell', 0)
      } else {
        prepareKeyboardSelection(editor, command.select)
        command.toChapter
          ? editor.move('chapter', 0, SNAP.FRONT)
          : editor.moveHome()
      }
      return
    case 'end':
      if (command.rhythmMode) {
        const rhythm = config.rhythm
        editor.moveRhythm('cell', rhythm.length - 1)
        editor.moveRhythm('row', rhythm[rhythm.length - 1].length - 1)
      } else {
        prepareKeyboardSelection(editor, command.select)
        command.toChapter
          ? editor.move('chapter', -1, SNAP.BACK)
          : editor.moveEnd()
      }
      return
  }
}

export function prepareKeyboardSelection(
  editor: Pick<
    MusicEditor,
    'createSelection' | 'discardSelection' | 'isSelecting'
  >,
  select: boolean
): void {
  if (!select) editor.discardSelection()
  else if (!editor.isSelecting) editor.createSelection()
}
