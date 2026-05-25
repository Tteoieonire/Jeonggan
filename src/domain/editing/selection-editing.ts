import Cursor, { type Level } from '../navigation/cursor'
import { debone } from '../navigation/selector'
import type { ScoreFactory } from '../score'
import { inRange } from '../utils'
import {
  type ElementOf,
  type Entry,
  type MusicBase,
  PARENT_OF,
  SNAP,
  type UndoOp,
} from '../navigation/viewer'

type SelectionRangeWalker = {
  anchor?: Cursor
  cursor: Cursor
  stepCol(delta?: 1 | -1): boolean
  stepChapter(delta?: 1 | -1): boolean
}

export type SelectionEditHost = SelectionRangeWalker & {
  music: MusicBase
  score: ScoreFactory
  isSelecting: boolean
  clone(): SelectionRangeWalker
  get<K extends Level>(what: K): ElementOf[K]
  move(what: keyof typeof PARENT_OF, where: number, snap?: SNAP): UndoOp
  add<T extends keyof typeof PARENT_OF>(what: T, obj?: ElementOf[T]): UndoOp
  write<T extends keyof typeof PARENT_OF>(what: T, obj: ElementOf[T]): UndoOp
  createSelection(): void
  discardSelection(): void
  normalizeSelection(): void
  backspace(): UndoOp
}

export function isEmptyCell(
  editor: SelectionEditHost,
  position: Cursor
): boolean {
  const chapter = editor.music.data[position.chapter]
  const cell = chapter.data[position.cell]
  if (cell.data.length > 1) return false
  const row = cell.data[0]
  if (row.data.length > 1) return false
  const col = row.data[0]
  return col.data.main == null
}

export function isEmptyRange(editor: SelectionEditHost): boolean {
  const selector = editor.clone()
  if (selector.anchor == null) return false
  if (selector.cursor.isLessThan(selector.anchor))
    Cursor.swap(selector.cursor, selector.anchor)
  while (selector.anchor.isLessThan(selector.cursor)) {
    if (!isEmptyCell(editor, selector.cursor)) return false
    selector.stepCol(-1) || selector.stepChapter(-1)
  }
  return isEmptyCell(editor, selector.cursor)
}

export function delRange(editor: SelectionEditHost): UndoOp {
  if (editor.anchor == null) throw Error('No selected found')
  if (editor.cursor.isLessThan(editor.anchor))
    Cursor.swap(editor.cursor, editor.anchor)

  const undos: UndoOp[] = []
  while (editor.anchor.isLessThan(editor.cursor, 'cell'))
    undos.push(editor.backspace())
  undos.reverse()

  editor.discardSelection()
  return () => undos.forEach(op => op())
}

export function cutEntry(editor: SelectionEditHost): [Entry, UndoOp] {
  if (editor.isSelecting) throw Error('Selection found')
  const col = editor.get('col')
  const old = col.data
  col.data = {}
  return [
    old,
    () => {
      editor.get('col').data = old
    },
  ]
}

export function cutRange(editor: SelectionEditHost): [Entry[][][], UndoOp] {
  if (editor.anchor == null) throw Error('No selected found')
  editor.anchor.move(editor.anchor.chapter, editor.anchor.cell, 0, 0)
  editor.move('row', 0)

  const oldCursor = editor.cursor.clone()
  const [first, last] = editor.anchor.isLessThan(oldCursor, 'cell')
    ? [editor.anchor, oldCursor]
    : [oldCursor, editor.anchor]
  editor.cursor.moveTo(first)

  const entries: Entry[][][] = []
  const undos: UndoOp[] = []
  while (true) {
    const cells = editor.get('chapter').data
    const start = editor.cursor.chapter === first.chapter ? first.cell : 0
    const end =
      editor.cursor.chapter === last.chapter ? last.cell + 1 : cells.length

    const old = cells.splice(start, end - start)
    entries.push(...debone(old))
    cells.splice(start, 0, ...old.map(() => editor.score.cell()))
    undos.push(() =>
      editor.get('chapter').data.splice(start, end - start, ...old)
    )

    if (editor.cursor.chapter === last.chapter) break
    undos.push(editor.move('chapter', editor.cursor.chapter + 1))
  }
  undos.reverse()

  editor.cursor.moveTo(oldCursor)
  editor.normalizeSelection()
  return [entries, () => undos.forEach(op => op())]
}

export function pasteEntry(editor: SelectionEditHost, entry: Entry): UndoOp {
  if (editor.isSelecting) {
    if (
      editor.anchor?.chapter === editor.cursor.chapter &&
      editor.anchor.cell === editor.cursor.cell
    )
      return pasteRange(editor, [[[entry]]])
    throw Error('Multi-cell selection found')
  }
  const col = editor.get('col')
  const old = col.data
  col.data = entry
  return () => {
    editor.get('col').data = old
  }
}

export function pasteRange(
  editor: SelectionEditHost,
  range: Entry[][][]
): UndoOp {
  if (editor.anchor == null) editor.createSelection()
  else if (editor.anchor.isLessThan(editor.cursor))
    editor.cursor.moveTo(editor.anchor)
  else editor.anchor.moveTo(editor.cursor)

  const undos: UndoOp[] = []
  undos.push(editor.move('row', 0, SNAP.FRONT))
  for (const [i, entries] of range.entries()) {
    const cell = editor.score.cellFromEntries(entries)
    undos.push(editor.write('cell', cell))
    if (i === range.length - 1) break

    if (inRange(editor.cursor.cell + 1, editor.get('chapter').data.length)) {
      undos.push(editor.move('cell', editor.cursor.cell + 1))
    } else if (inRange(editor.cursor.chapter + 1, editor.music.data.length)) {
      undos.push(editor.move('chapter', editor.cursor.chapter + 1))
      undos.push(editor.move('cell', 0))
    } else {
      undos.push(editor.add('cell'))
    }
  }
  undos.push(editor.move('row', -1, SNAP.BACK))
  undos.reverse()
  return () => undos.forEach(op => op())
}
