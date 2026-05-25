import { describe, expect, it } from 'vitest'

import Cursor from '../../domain/cursor'
import { Music, MusicEditor } from '../../domain/editor'
import { Chapter, Config } from '../../domain/viewer'
import {
  executeKeyboardNavigation,
  prepareKeyboardSelection,
} from './navigation'

const CONFIG: Config = {
  name: '초장',
  tempo: 60,
  measure: [4],
  rhythm: [['떵'], ['덕', '쿵'], [''], ['더', '쿵']],
  hideRhythm: false,
  scale: [0, 2, 5, 7, 9],
  padding: 0,
}

describe('keyboard navigation helpers', () => {
  it('prepares a keyboard selection when shift navigation begins', () => {
    const editor = makeEditor()

    prepareKeyboardSelection(editor, true)

    expect(editor.anchor?.isEqualTo(cursorAt(0))).toBe(true)
    expect(editor.isSelecting).toBe(false)
  })

  it('keeps an existing keyboard selection while shift navigation continues', () => {
    const editor = makeEditor()
    executeKeyboardNavigation(moveDown(true), editor, CONFIG)

    executeKeyboardNavigation(moveDown(true), editor, CONFIG)

    expect(editor.anchor?.isEqualTo(cursorAt(0))).toBe(true)
    expect(editor.cursor.isEqualTo(cursorAt(2))).toBe(true)
  })

  it('discards selection before plain movement', () => {
    const editor = makeEditor()
    executeKeyboardNavigation(moveDown(true), editor, CONFIG)

    executeKeyboardNavigation(moveDown(false), editor, CONFIG)

    expect(editor.anchor).toBeUndefined()
    expect(editor.cursor.isEqualTo(cursorAt(2))).toBe(true)
  })

  it('discards selection for escape', () => {
    const editor = makeEditor()
    executeKeyboardNavigation(moveDown(true), editor, CONFIG)

    executeKeyboardNavigation(
      { type: 'discardSelection', preventDefault: false },
      editor,
      CONFIG
    )

    expect(editor.anchor).toBeUndefined()
  })

  it('moves to the start and end of the current gak', () => {
    const editor = makeEditor()
    editor.cursor.move(0, 5, 0, 0)

    executeKeyboardNavigation(home(false), editor, CONFIG)
    expect(editor.cursor.isEqualTo(cursorAt(4))).toBe(true)

    executeKeyboardNavigation(end(false), editor, CONFIG)
    expect(editor.cursor.isEqualTo(cursorAt(7))).toBe(true)
  })

  it('moves to the start and end of the music when requested', () => {
    const editor = makeEditor({ chapters: 2 })
    editor.cursor.move(0, 5, 0, 0)

    executeKeyboardNavigation(home(true), editor, CONFIG)
    expect(editor.cursor.isEqualTo(cursorAt(0))).toBe(true)

    executeKeyboardNavigation(end(true), editor, CONFIG)
    expect(editor.cursor.isEqualTo(new Cursor(false, 1, 0, 0, 0))).toBe(true)
  })

  it('moves to rhythm start and end in rhythm mode', () => {
    const editor = makeEditor()
    editor.cursor.moveRhythm(0, 1, 1)

    executeKeyboardNavigation(
      { ...home(false), rhythmMode: true },
      editor,
      CONFIG
    )
    expect(editor.cursor.isEqualTo(new Cursor(true, 0, 0, 0, 0))).toBe(true)

    executeKeyboardNavigation(
      { ...end(false), rhythmMode: true },
      editor,
      CONFIG
    )
    expect(editor.cursor.isEqualTo(new Cursor(true, 0, 3, 1, 0))).toBe(true)
  })
})

function makeEditor({
  chapters = 1,
  cells = 8,
}: { chapters?: number; cells?: number } = {}): MusicEditor {
  const music = new Music(
    '',
    Array.from({ length: chapters }, () => new Chapter(CONFIG))
  )
  const editor = music.getEditor()
  for (let i = 1; i < cells; i += 1) editor.add('cell')
  editor.cursor.move(0, 0, 0, 0)
  return editor
}

function moveDown(select: boolean) {
  return {
    type: 'moveUpDown',
    direction: 'down',
    select,
    preventDefault: true,
  } as const
}

function home(toChapter: boolean) {
  return {
    type: 'home',
    rhythmMode: false,
    select: false,
    toChapter,
    preventDefault: true,
  } as const
}

function end(toChapter: boolean) {
  return {
    type: 'end',
    rhythmMode: false,
    select: false,
    toChapter,
    preventDefault: true,
  } as const
}

function cursorAt(cell: number): Cursor {
  return new Cursor(false, 0, cell, 0, 0)
}
