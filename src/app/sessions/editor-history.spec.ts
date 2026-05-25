import { describe, expect, it, vi } from 'vitest'

import Cursor from '../../domain/navigation/cursor'
import { Music } from '../../domain/music'
import { Config } from '../../domain/navigation/viewer'
import {
  captureEditorHistoryState,
  createEditorHistory,
  restoreEditorHistoryState,
} from './editor-history'

const CONFIG: Config = {
  name: '초장',
  tempo: 60,
  measure: [2],
  rhythm: [['떵'], ['덕']],
  hideRhythm: false,
  scale: [0, 2, 5, 7, 9],
  padding: 0,
}

describe('editor history helpers', () => {
  it('captures cursor and anchor by value', () => {
    const editor = makeEditor()
    editor.cursor.move(0, 2, 3, 4)
    editor.anchor = new Cursor(false, 0, 1, 0, 0)

    const state = captureEditorHistoryState(editor)
    state.cursor.move(0, 9, 9, 9)
    state.anchor?.move(0, 8, 8, 8)

    expect(editor.cursor.isEqualTo(new Cursor(false, 0, 2, 3, 4))).toBe(true)
    expect(editor.anchor?.isEqualTo(new Cursor(false, 0, 1, 0, 0))).toBe(true)
  })

  it('restores cursor and anchor without sharing state objects', () => {
    const editor = makeEditor()
    const state = {
      cursor: new Cursor(false, 0, 2, 3, 4),
      anchor: new Cursor(false, 0, 1, 0, 0),
    }

    restoreEditorHistoryState(editor, state)
    state.cursor.move(0, 9, 9, 9)
    state.anchor.move(0, 8, 8, 8)

    expect(editor.cursor.isEqualTo(new Cursor(false, 0, 2, 3, 4))).toBe(true)
    expect(editor.anchor?.isEqualTo(new Cursor(false, 0, 1, 0, 0))).toBe(true)
  })

  it('restores editor selection across undo and redo', () => {
    const editor = makeEditor()
    const afterChange = vi.fn()
    const history = createEditorHistory(editor, afterChange)
    editor.cursor.move(0, 0, 0, 0)
    editor.anchor = new Cursor(false, 0, 0, 0, 0)

    history.do(() => {
      editor.cursor.move(0, 1, 0, 0)
      editor.anchor = new Cursor(false, 0, 0, 0, 0)

      return () => {
        editor.cursor.move(0, 9, 9, 9)
        editor.anchor = undefined
      }
    })

    expect(editor.cursor.isEqualTo(new Cursor(false, 0, 1, 0, 0))).toBe(true)
    expect(editor.anchor?.isEqualTo(new Cursor(false, 0, 0, 0, 0))).toBe(true)
    expect(afterChange).toHaveBeenCalledTimes(1)

    history.undo()
    expect(editor.cursor.isEqualTo(new Cursor(false, 0, 0, 0, 0))).toBe(true)
    expect(editor.anchor?.isEqualTo(new Cursor(false, 0, 0, 0, 0))).toBe(true)
    expect(afterChange).toHaveBeenCalledTimes(2)

    history.redo()
    expect(editor.cursor.isEqualTo(new Cursor(false, 0, 1, 0, 0))).toBe(true)
    expect(editor.anchor?.isEqualTo(new Cursor(false, 0, 0, 0, 0))).toBe(true)
    expect(afterChange).toHaveBeenCalledTimes(3)
  })
})

function makeEditor() {
  const music = new Music('test')
  music.data.push(music.score.chapter(CONFIG))
  return music.getEditor()
}
