export type Level = 'music' | 'chapter' | 'cell' | 'row' | 'col'
export type CoordLevel = 'chapter' | 'cell' | 'row' | 'col'

type Coord<T> = { [level in CoordLevel]: T } & { rhythmMode: boolean }
type Position = Coord<number>

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

class Cursor implements Position {
  rhythmMode: boolean
  chapter: number
  cell: number
  row: number
  col: number

  eventlisteners: Partial<Record<Event, Handler>>
  constructor(
    rhythmMode: boolean,
    chapter: number,
    cell: number,
    row: number,
    col: number
  ) {
    this.rhythmMode = rhythmMode
    this.chapter = chapter
    this.cell = cell
    this.row = row
    this.col = col
    this.eventlisteners = {}
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
    this.rhythmMode = newPos.rhythmMode
    this.chapter = newPos.chapter
    this.cell = newPos.cell
    this.row = newPos.row
    this.col = newPos.col
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

  moveRhythm(chapter: number, cell: number) {
    this._move({ rhythmMode: true, chapter, cell, row: 0, col: 0 })
  }

  moveTo(other: Cursor) {
    this._move(other)
  }
}

export default Cursor
