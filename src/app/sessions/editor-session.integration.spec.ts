import { describe, expect, it } from 'vitest'

import { YUL_OBJ } from '../../domain/constants'
import Cursor from '../../domain/cursor'
import type { Entry } from '../../domain/viewer'
import type { KeyboardInput } from '../../features/keyboard'
import { EditorSession } from './editor-session'

describe('EditorSession integration', () => {
  it('maps keyboard input through editing history', () => {
    const session = new EditorSession()

    const write = press(session, 'KeyX')
    expect(write.type).toBe('writePitch')
    expect(mainAt(session, 0)).toEqual(YUL_OBJ[3][2])
    expect(session.canUndo(false)).toBe(true)

    const undo = press(session, 'KeyZ', { ctrlKey: true })
    expect(undo.type).toBe('undo')
    expect(mainAt(session, 0)).toEqual(YUL_OBJ[3][0])
    expect(session.canRedo(false)).toBe(true)

    const redo = press(session, 'KeyZ', { ctrlKey: true, shiftKey: true })
    expect(redo.type).toBe('redo')
    expect(mainAt(session, 0)).toEqual(YUL_OBJ[3][2])
  })

  it('cuts a canvas-selected range and restores it across undo and redo', () => {
    const session = new EditorSession()
    const firstCell = new Cursor(false, 0, 0, 0, 0)
    const secondCell = new Cursor(false, 0, 1, 0, 0)

    session.moveTo(secondCell)
    press(session, 'KeyU')
    expect(mainAt(session, 0)).toEqual(YUL_OBJ[3][0])
    expect(mainAt(session, 1)).toEqual(YUL_OBJ[3][3])

    session.moveTo(firstCell)
    session.pointerDown(firstCell)
    session.pointerOver(secondCell)
    session.pointerUp()

    expect(session.editor.isSelecting).toBe(true)
    const selectedAnchor = session.editor.anchor?.clone()
    const selectedCursor = session.editor.cursor.clone()

    const cut = press(session, 'KeyX', { ctrlKey: true })
    expect(cut.type).toBe('cut')
    expect(session.clipboard?.[0]).toBe('Range')
    expect(mainAt(session, 0)).toBeUndefined()
    expect(mainAt(session, 1)).toBeUndefined()

    press(session, 'KeyZ', { ctrlKey: true })
    expect(mainAt(session, 0)).toEqual(YUL_OBJ[3][0])
    expect(mainAt(session, 1)).toEqual(YUL_OBJ[3][3])
    expect(session.editor.anchor?.isEqualTo(selectedAnchor!)).toBe(true)
    expect(session.editor.cursor.isEqualTo(selectedCursor)).toBe(true)

    press(session, 'KeyZ', { ctrlKey: true, shiftKey: true })
    expect(mainAt(session, 0)).toBeUndefined()
    expect(mainAt(session, 1)).toBeUndefined()
    expect(session.editor.anchor?.isEqualTo(selectedAnchor!)).toBe(true)
    expect(session.editor.cursor.isEqualTo(selectedCursor)).toBe(true)
  })
})

function press(
  session: EditorSession,
  code: string,
  input: Partial<KeyboardInput> = {}
) {
  const command = session.getKeyboardCommand(
    {
      code,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      ...input,
    },
    false
  )
  session.executeKeyboardCommand(command)
  return command
}

function mainAt(session: EditorSession, cell: number): Entry['main'] {
  return session.music.data[0].data[cell].data[0].data[0].data.main
}
