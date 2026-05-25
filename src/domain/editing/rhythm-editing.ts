import type { RhythmTick } from '../constants'
import type Cursor from '../navigation/cursor'
import {
  type Chapter,
  type Config,
  idOp,
  type UndoOp,
} from '../navigation/viewer'

export type RhythmEditHost = {
  cursor: Cursor
  get(what: 'chapter'): Chapter
  moveRhythm(what: 'chapter' | 'cell' | 'row', where: number): UndoOp
}

export function addRhythmRow(editor: RhythmEditHost): UndoOp {
  const chapter = editor.get('chapter')
  const config = chapter.config
  const cell = editor.cursor.cell
  const row = editor.cursor.row + 1

  chapter.setConfig(
    withRhythmRows(config, cell, insertAt(config.rhythm[cell], row, ''))
  )
  const undoMove = editor.moveRhythm('row', row)
  return () => {
    undoMove()
    chapter.setConfig(config)
  }
}

export function delRhythmRow(editor: RhythmEditHost): UndoOp {
  const chapter = editor.get('chapter')
  const config = chapter.config
  const cell = editor.cursor.cell
  const arr = config.rhythm[cell]
  const idx = editor.cursor.row

  let undo = idOp
  const keep = arr.length === 1
  if (!keep) undo = editor.moveRhythm('row', Math.min(idx, arr.length - 2))

  const rows = keep ? ['' as RhythmTick] : removeAt(arr, idx)
  chapter.setConfig(withRhythmRows(config, cell, rows))
  return () => {
    chapter.setConfig(config)
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
  const chapter = editor.get('chapter')
  const config = chapter.config
  const cell = editor.cursor.cell
  const rows = config.rhythm[cell]
  const row = editor.cursor.row

  chapter.setConfig(withRhythmRows(config, cell, replaceAt(rows, row, tick)))
  return () => chapter.setConfig(config)
}

export function eraseRhythmTick(editor: RhythmEditHost): UndoOp {
  return writeRhythmTick(editor, '')
}

function withRhythmRows(
  config: Config,
  cell: number,
  rows: RhythmTick[]
): Config {
  return {
    ...config,
    rhythm: replaceAt(config.rhythm, cell, rows),
  }
}

function insertAt<T>(arr: T[], idx: number, item: T): T[] {
  return [...arr.slice(0, idx), item, ...arr.slice(idx)]
}

function removeAt<T>(arr: T[], idx: number): T[] {
  return [...arr.slice(0, idx), ...arr.slice(idx + 1)]
}

function replaceAt<T>(arr: T[], idx: number, item: T): T[] {
  return arr.map((old, i) => (i === idx ? item : old))
}
