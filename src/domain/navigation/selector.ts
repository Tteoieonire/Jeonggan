import Cursor from './cursor'
import { inRange } from '../utils'
import {
  Cell,
  Entry,
  EntryRange,
  EntryRow,
  idOp,
  type MusicBase,
  MusicViewer,
  PARENT_OF,
  SNAP,
  UndoOp,
} from './viewer'

export function debone(cells: Cell[]): EntryRange {
  return cells.map(cell =>
    cell.data.map(row => {
      const entries = row.data.map(col => col.data) as EntryRow
      if (row.breath) entries.breath = true
      return entries
    })
  )
}

export class MusicSelector<
  TMusic extends MusicBase = MusicBase
> extends MusicViewer {
  declare readonly music: TMusic
  anchor?: Cursor

  constructor(music: TMusic, cursor?: Cursor, anchor?: Cursor) {
    super(music, cursor)
    this.anchor = anchor
  }

  clone(): MusicSelector<TMusic> {
    return new MusicSelector(
      this.music,
      this.cursor.clone(),
      this.anchor?.clone()
    )
  }

  get isSelecting(): boolean {
    return this.anchor != null && !this.anchor.isEqualTo(this.cursor)
  }

  createSelection() {
    if (this.cursor.rhythmMode) return
    this.move('cell', this.cursor.cell, SNAP.FRONT)
    this.anchor = this.cursor.clone()
    this.move('cell', this.cursor.cell, SNAP.BACK)
  }

  discardSelection() {
    this.anchor = undefined
  }

  normalizeSelection() {
    if (this.anchor == null) return
    if (this.anchor.isLessThan(this.cursor)) {
      this.anchor = new Cursor(
        false,
        this.anchor.chapter,
        this.anchor.cell,
        0,
        0
      )
      this.move('row', -1, SNAP.BACK)
    } else {
      const chapter = this.cursor.chapter
      const cell = this.cursor.cell
      this.cursor.moveTo(this.anchor)
      this.move('row', -1, SNAP.BACK)
      this.anchor = this.cursor.clone()
      this.cursor.move(chapter, cell, 0, 0)
    }
  }

  selectAll() {
    if (this.cursor.rhythmMode) return
    if (this.anchor == null) this.anchor = this.cursor.clone()
    if (this.cursor.isLessThan(this.anchor, 'cell')) {
      const cursor = this.cursor.clone()
      this.cursor.moveTo(this.anchor)
      this.anchor = cursor
    }

    const gakLength = this.get('chapter').config.rhythm.length
    const head = this.cursor.cell - this._jeong(this.cursor.cell)
    if (
      this.anchor.chapter !== this.cursor.chapter ||
      this.anchor.cell < head ||
      this.cursor.cell - this.anchor.cell === gakLength - 1
    ) {
      this.move('chapter', 0, SNAP.FRONT)
      this.anchor = this.cursor.clone()
      this.move('chapter', -1, SNAP.BACK)
    } else {
      this.moveClamp('cell', head, SNAP.FRONT)
      this.anchor = this.cursor.clone()
      this.moveClamp('cell', head + gakLength - 1, SNAP.BACK)
    }
  }

  move(
    what: keyof typeof PARENT_OF,
    where: number,
    snap: SNAP = SNAP.FRONT
  ): UndoOp {
    if (this.anchor?.rhythmMode === true) return idOp
    return super.move(what, where, snap)
  }

  moveRhythm(what: 'chapter' | 'cell' | 'row', where: number): UndoOp {
    if (this.anchor?.rhythmMode === false) return idOp
    return super.moveRhythm(what, where)
  }

  moveUpDown(direction: 'up' | 'down'): void {
    if (this.isSelecting) {
      const snap = direction === 'up' ? SNAP.FRONT : SNAP.BACK
      this.move('cell', this.cursor.cell, snap)
    }
    super.moveUpDown(direction)
    this.normalizeSelection()
  }

  moveLeftRight(direction: 'left' | 'right'): void {
    if (this.isSelecting) {
      const snap = direction === 'left' ? SNAP.FRONT : SNAP.BACK
      this.move('row', this.cursor.row, snap)
    }
    super.moveLeftRight(direction)
    this.normalizeSelection()
  }

  protected getDelimiter(direction: 1 | -1 = +1): keyof typeof PARENT_OF {
    if (inRange(this.cursor.col + direction, this.get('row').data)) return 'col'
    if (inRange(this.cursor.row + direction, this.get('cell').data))
      return 'row'
    if (inRange(this.cursor.cell + direction, this.get('chapter').data))
      return 'cell'
    return 'chapter'
  }

  copyEntry(): Entry {
    if (this.isSelecting) throw Error('Selection found')
    return this.get('col').data
  }

  copyRange(): EntryRange {
    if (this.anchor == null) throw Error('No selected found')
    const [first, last] = this.anchor.isLessThan(this.cursor)
      ? [this.anchor, this.cursor]
      : [this.cursor, this.anchor]
    return this.music.data
      .slice(first.chapter, last.chapter + 1)
      .flatMap(function (chapter, index): EntryRange {
        const cells = chapter.data
        const start = index === 0 ? first.cell : 0
        const end =
          first.chapter + index === last.chapter ? last.cell + 1 : cells.length
        return debone(cells.slice(start, end))
      })
  }

  copy(): ['Entry', Entry] | ['Range', EntryRange] {
    return this.isSelecting
      ? ['Range', this.copyRange()]
      : ['Entry', this.copyEntry()]
  }
}
