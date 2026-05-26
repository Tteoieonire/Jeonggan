import Cursor from '../navigation/cursor'
import {
  entryWithModifiers,
  getEntryModifiers,
  type Col,
  type Entry,
  type MusicBase,
} from '../score'
import { querySymbol } from '../symbols'
import { idOp, type UndoOp } from './undo'

type DurationMarkEditHost = {
  anchor?: Cursor
  cursor: Cursor
  music: MusicBase
  isSelecting: boolean
}

const LONG_MARK = querySymbol('modifier', '덧길이표', 'text')
const HALF_MARK = querySymbol('modifier', '반길이표', 'text')

export type PairedDurationMark = 'long-short' | 'half-long'

export function canApplyPairedDurationMark(
  editor: DurationMarkEditHost
): boolean {
  return getSelectedDurationPair(editor) != null
}

export function getActivePairedDurationMark(
  editor: DurationMarkEditHost
): PairedDurationMark | undefined {
  const pair = getSelectedDurationPair(editor)
  if (pair == null) return undefined

  const [first, second] = pair.map(position => colAt(editor.music, position))
  const firstDurationMark = getDurationMark(first.data)
  const secondDurationMark = getDurationMark(second.data)

  if (
    firstDurationMark?.text === LONG_MARK.text &&
    secondDurationMark?.text === HALF_MARK.text
  )
    return 'long-short'
  if (
    firstDurationMark?.text === HALF_MARK.text &&
    secondDurationMark?.text === LONG_MARK.text
  )
    return 'half-long'
  return undefined
}

export function applyLongShortDurationMark(
  editor: DurationMarkEditHost
): UndoOp {
  return applyDurationMarkPair(editor, 'long-short', LONG_MARK, HALF_MARK)
}

export function applyHalfLongDurationMark(
  editor: DurationMarkEditHost
): UndoOp {
  return applyDurationMarkPair(editor, 'half-long', HALF_MARK, LONG_MARK)
}

function applyDurationMarkPair(
  editor: DurationMarkEditHost,
  target: PairedDurationMark,
  firstMark: typeof LONG_MARK | typeof HALF_MARK,
  secondMark: typeof LONG_MARK | typeof HALF_MARK
): UndoOp {
  const pair = getSelectedDurationPair(editor)
  if (pair == null) return idOp

  const [first, second] = pair.map(position => colAt(editor.music, position))
  const oldFirst = first.data
  const oldSecond = second.data

  if (getActivePairedDurationMark(editor) === target) {
    first.data = withoutDurationMark(oldFirst)
    second.data = withoutDurationMark(oldSecond)
  } else {
    first.data = withDurationMark(oldFirst, firstMark)
    second.data = withDurationMark(oldSecond, secondMark)
  }

  return () => {
    first.data = oldFirst
    second.data = oldSecond
  }
}

function getSelectedDurationPair(
  editor: DurationMarkEditHost
): [Cursor, Cursor] | undefined {
  if (
    !editor.isSelecting ||
    editor.anchor == null ||
    editor.anchor.rhythmMode ||
    editor.cursor.rhythmMode
  )
    return undefined

  const positions = collectSelectedColPositions(editor)
  if (positions.length !== 2) return undefined

  const [first, second] = positions
  if (!hasSameBaseDuration(editor.music, first, second)) return undefined

  return [first, second]
}

function collectSelectedColPositions(editor: DurationMarkEditHost): Cursor[] {
  const [first, last] = editor.anchor!.isLessThan(editor.cursor)
    ? [editor.anchor!, editor.cursor]
    : [editor.cursor, editor.anchor!]

  const cursor = first.clone()
  const positions: Cursor[] = []
  while (true) {
    positions.push(cursor.clone())
    if (cursor.isEqualTo(last)) return positions
    if (!stepCol(editor.music, cursor)) return []
  }
}

function stepCol(music: MusicBase, cursor: Cursor): boolean {
  const chapter = music.data[cursor.chapter]
  const cell = chapter.data[cursor.cell]
  const row = cell.data[cursor.row]

  if (cursor.col + 1 < row.data.length) {
    cursor.move(cursor.chapter, cursor.cell, cursor.row, cursor.col + 1)
    return true
  }
  if (cursor.row + 1 < cell.data.length) {
    cursor.move(cursor.chapter, cursor.cell, cursor.row + 1, 0)
    return true
  }
  if (cursor.cell + 1 < chapter.data.length) {
    cursor.move(cursor.chapter, cursor.cell + 1, 0, 0)
    return true
  }
  if (cursor.chapter + 1 < music.data.length) {
    cursor.move(cursor.chapter + 1, 0, 0, 0)
    return true
  }
  return false
}

function hasSameBaseDuration(
  music: MusicBase,
  first: Cursor,
  second: Cursor
): boolean {
  return (
    Math.abs(baseDuration(music, first) - baseDuration(music, second)) < 1e-9
  )
}

function baseDuration(music: MusicBase, position: Cursor): number {
  const chapter = music.data[position.chapter]
  const cell = chapter.data[position.cell]
  const row = cell.data[position.row]
  return 1 / (cell.data.length * row.data.length)
}

function colAt(music: MusicBase, position: Cursor): Col {
  return music.data[position.chapter].data[position.cell].data[position.row]
    .data[position.col]
}

function withDurationMark(
  entry: Entry,
  durationMark: typeof LONG_MARK | typeof HALF_MARK
): Entry {
  const modifiers = getEntryModifiers(entry).filter(
    modifier => modifier.durationRatio == null
  )
  return entryWithModifiers(entry.main, [...modifiers, durationMark])
}

function withoutDurationMark(entry: Entry): Entry {
  return entryWithModifiers(
    entry.main,
    getEntryModifiers(entry).filter(modifier => modifier.durationRatio == null)
  )
}

function getDurationMark(entry: Entry) {
  return getEntryModifiers(entry).find(
    modifier => modifier.durationRatio != null
  )
}
