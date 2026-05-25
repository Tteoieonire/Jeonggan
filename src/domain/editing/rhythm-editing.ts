import type { RhythmTick } from '../constants'
import type Cursor from '../navigation/cursor'
import { type Chapter, idOp, type UndoOp } from '../navigation/viewer'

export type RhythmEditHost = {
  cursor: Cursor
  get(what: 'chapter'): Chapter
  moveRhythm(what: 'chapter' | 'cell' | 'row', where: number): UndoOp
}

export function addRhythmRow(editor: RhythmEditHost): UndoOp {
  const rows = editor.get('chapter').config.rhythm[editor.cursor.cell]
  rows.splice(editor.cursor.row + 1, 0, '')
  editor.moveRhythm('row', editor.cursor.row + 1)
  return () => {
    editor.moveRhythm('row', editor.cursor.row - 1)
    const rows = editor.get('chapter').config.rhythm[editor.cursor.cell]
    rows.splice(editor.cursor.row + 1, 1)
  }
}

export function delRhythmRow(editor: RhythmEditHost): UndoOp {
  const arr = editor.get('chapter').config.rhythm[editor.cursor.cell]
  const idx = editor.cursor.row

  let undo = idOp
  const keep = arr.length === 1
  if (keep) arr.push('')
  else undo = editor.moveRhythm('row', Math.min(idx, arr.length - 2))

  const old = arr.splice(idx, 1)[0]
  return () => {
    const arr = editor.get('chapter').config.rhythm[editor.cursor.cell]
    arr.splice(idx, keep ? 1 : 0, old)
    undo()
  }
}

export function currentRhythmTick(editor: RhythmEditHost): RhythmTick {
  return editor.get('chapter').config.rhythm[editor.cursor.cell][
    editor.cursor.row
  ]
}

export function writeRhythmTick(
  editor: RhythmEditHost,
  tick: RhythmTick
): UndoOp {
  const rows = editor.get('chapter').config.rhythm[editor.cursor.cell]
  const row = editor.cursor.row
  const old = rows.splice(row, 1, tick)[0]
  return () => rows.splice(row, 1, old)
}

export function eraseRhythmTick(editor: RhythmEditHost): UndoOp {
  return writeRhythmTick(editor, '')
}
