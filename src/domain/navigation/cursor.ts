import type { CursorState } from './state'

export type Level = 'music' | 'chapter' | 'cell' | 'row' | 'col'
export type CoordLevel = 'chapter' | 'cell' | 'row' | 'col'

type Coord<T> = { [level in CoordLevel]: T } & { rhythmMode: boolean }
type Position = CursorState

type Time = 'before' | 'after'
type Event = `${Time}${Capitalize<keyof Position>}Change`
type Handler = () => void

function checkChanges(curPos: Position, newPos: Position): Coord<boolean> {
  const rhythmMode = curPos.rhythmMode !== newPos.rhythmMode
  const chapter = curPos.chapter !== newPos.chapter
  const cell = rhythmMode || chapter || curPos.cell !== newPos.cell
  const row = cell || curPos.row !== newPos.row
  const col = row || curPos.col !== newPos.col
  return { rhythmMode, chapter, cell, row, col }
}

function toPosition(position: Position): Position {
  return Object.freeze({
    rhythmMode: position.rhythmMode,
    chapter: position.chapter,
    cell: position.cell,
    row: position.row,
    col: position.col,
  })
}

class Cursor implements Position {
  _state: Position

  readonly eventlisteners: Partial<Record<Event, Handler>>
  constructor(
    rhythmMode: boolean,
    chapter: number,
    cell: number,
    row: number,
    col: number
  ) {
    this._state = toPosition({ rhythmMode, chapter, cell, row, col })
    this.eventlisteners = {}
  }

  get rhythmMode(): boolean {
    return this._state.rhythmMode
  }

  get chapter(): number {
    return this._state.chapter
  }

  get cell(): number {
    return this._state.cell
  }

  get row(): number {
    return this._state.row
  }

  get col(): number {
    return this._state.col
  }

  get state(): Position {
    return this._state
  }

  clone() {
    return new Cursor(
      this.rhythmMode,
      this.chapter,
      this.cell,
      this.row,
      this.col
    )
  }

  loadFrom(newPos: Position) {
    this._state = toPosition(newPos)
  }

  checkChanges(newPos: Position): Coord<boolean> {
    return checkChanges(this, newPos)
  }

  on(change: Event, f: Handler) {
    this.eventlisteners[change] = f
  }

  dispatchEvents(changes: Coord<boolean>, time: Time = 'before') {
    const events: Event[] = [
      changes.col && time + 'ColChange',
      changes.row && time + 'RowChange',
      changes.cell && time + 'CellChange',
      changes.chapter && time + 'ChapterChange',
      changes.rhythmMode && time + 'RhythmModeChange',
    ].filter((x): x is Event => x !== false) // bottom up
    events.map(event => this.eventlisteners[event]).forEach(f => f && f())
  }

  _move(newPos: Position) {
    const changes = this.checkChanges(newPos)
    this.dispatchEvents(changes, 'before')
    this.loadFrom(newPos)
    this.dispatchEvents(changes, 'after')
  }

  move(chapter: number, cell: number, row: number, col: number) {
    this._move({ rhythmMode: false, chapter, cell, row, col })
  }

  moveRhythm(chapter: number, cell: number, row: number) {
    this._move({ rhythmMode: true, chapter, cell, row, col: 0 })
  }

  moveTo(other: Position) {
    this._move(other)
  }

  isLessThan(other: Cursor, upto: Level = 'col'): boolean {
    if (this.rhythmMode !== other.rhythmMode)
      throw Error('Cannot compare cursors of different rhythmMode.')

    for (const level of ['chapter', 'cell', 'row', 'col'] as const) {
      if (this[level] !== other[level]) return this[level] < other[level]
      if (level === upto) return false
    }
    return false
  }

  isEqualTo(other: Cursor, upto: Level = 'col'): boolean {
    if (upto === 'music') return true
    return !checkChanges(this, other)[upto]
  }

  isBetween(a: Cursor, b: Cursor, upto: Level = 'col') {
    // Check if min{a, b} <= this <= max{a, b}
    const [min, max] = a.isLessThan(b, upto) ? [a, b] : [b, a]
    return !(this.isLessThan(min, upto) || max.isLessThan(this, upto))
  }

  static swap(a: Cursor, b: Cursor) {
    const tmp = a.clone()
    a.moveTo(b)
    b.moveTo(tmp)
  }
}

export default Cursor
