import { describe, expect, it } from 'vitest'

import Cursor from '../../domain/cursor'
import { Music, MusicEditor } from '../../domain/editor'
import { Chapter, Config } from '../../domain/viewer'
import {
  moveCanvasCursor,
  selectCanvasRange,
  startCanvasDrag,
} from './canvas-selection'

const CONFIG: Config = {
  name: '초장',
  tempo: 60,
  measure: [2],
  rhythm: [['떵'], ['덕']],
  hideRhythm: false,
  scale: [0, 2, 5, 7, 9],
  padding: 0,
}

describe('canvas selection helpers', () => {
  it('moves the cursor and discards the existing selection', () => {
    const editor = makeEditor()
    editor.createSelection()

    moveCanvasCursor(editor, cursorAt(1))

    expect(editor.anchor).toBeUndefined()
    expect(editor.cursor.isEqualTo(cursorAt(1))).toBe(true)
  })

  it('creates a selection when selecting to a notation cell', () => {
    const editor = makeEditor()

    selectCanvasRange(editor, cursorAt(1))

    expect(editor.anchor?.isEqualTo(cursorAt(0))).toBe(true)
    expect(editor.cursor.isEqualTo(cursorAt(1))).toBe(true)
    expect(editor.isSelecting).toBe(true)
  })

  it('discards notation selection when selecting rhythm coordinates', () => {
    const editor = makeEditor()
    selectCanvasRange(editor, cursorAt(1))

    selectCanvasRange(editor, rhythmCursorAt(0))

    expect(editor.anchor).toBeUndefined()
    expect(editor.cursor.isEqualTo(rhythmCursorAt(0))).toBe(true)
  })

  it('starts dragging from the current cursor cell', () => {
    const editor = makeEditor()

    expect(startCanvasDrag(editor, cursorAt(0))).toBe(true)
  })

  it('ignores dragging from an unrelated cell', () => {
    const editor = makeEditor()

    expect(startCanvasDrag(editor, cursorAt(1))).toBe(false)
    expect(editor.cursor.isEqualTo(cursorAt(0))).toBe(true)
  })

  it('flips the active edge when dragging starts from the selection anchor', () => {
    const editor = makeEditor()
    selectCanvasRange(editor, cursorAt(1))

    expect(startCanvasDrag(editor, cursorAt(0))).toBe(true)

    expect(editor.anchor?.isEqualTo(cursorAt(1))).toBe(true)
    expect(editor.cursor.isEqualTo(cursorAt(0))).toBe(true)
    expect(editor.isSelecting).toBe(true)
  })
})

function makeEditor(): MusicEditor {
  const music = new Music('', [new Chapter(CONFIG)])
  const editor = music.getEditor()
  editor.add('cell')
  editor.add('cell')
  editor.cursor.move(0, 0, 0, 0)
  return editor
}

function cursorAt(cell: number): Cursor {
  return new Cursor(false, 0, cell, 0, 0)
}

function rhythmCursorAt(cell: number): Cursor {
  return new Cursor(true, 0, cell, 0, 0)
}
