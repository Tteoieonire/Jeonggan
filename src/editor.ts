import { InstrumentName } from 'soundfont-player'
import Cursor from './cursor'
import { MusicPlayer } from './player'
import { getID, inRange } from './utils'
import {
  Cell,
  Chapter,
  CHILD_OF,
  Config,
  ElementOf,
  Entry,
  idOp,
  MusicBase,
  MusicViewer,
  PARENT_OF,
  SNAP,
  UndoOp,
  _make,
} from './viewer'

function debone(cells: Cell[]): Entry[][][] {
  return cells.map(cell => cell.data.map(row => row.data.map(col => col.data)))
}

export class Music implements MusicBase {
  private _editor?: MusicEditor
  data: Chapter[]

  constructor(
    public title: string,
    chapters?: Chapter[],
    public instrument: InstrumentName = 'acoustic_grand_piano'
  ) {
    this.data = chapters || []
  }

  asGaks() {
    return this.data.flatMap((chapter, i) => chapter.asGaks(i))
  }

  getViewer() {
    return new MusicViewer(this)
  }

  getPlayer() {
    return new MusicPlayer(this)
  }

  getEditor() {
    if (this._editor == null) this._editor = new MusicEditor(this)
    return this._editor
  }
}
export class MusicSelector extends MusicViewer {
  anchor?: Cursor

  constructor(public music: Music, cursor?: Cursor, anchor?: Cursor) {
    super(music, cursor)
    this.anchor = anchor
  }
  clone(): MusicSelector {
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
      this.anchor.move(this.anchor.chapter, this.anchor.cell, 0, 0)
      this.move('row', -1, SNAP.BACK)
    } else {
      const chapter = this.cursor.chapter
      const cell = this.cursor.cell
      this.cursor.moveTo(this.anchor)
      this.move('row', -1, SNAP.BACK)
      this.anchor.moveTo(this.cursor)
      this.cursor.move(chapter, cell, 0, 0)
    }
  }

  selectAll() {
    if (this.cursor.rhythmMode) return
    this.normalizeSelection()
    if (this.anchor == null) this.anchor = this.cursor.clone()

    const gakLength = this.get('chapter').config.rhythm.length
    const head = this.cursor.cell - this._jeong(this.cursor.cell)
    if (
      this.anchor.chapter !== this.cursor.chapter ||
      this.anchor.cell < head ||
      this.cursor.cell - this.anchor.cell === gakLength - 1
    ) {
      // select all chapters
      this.move('chapter', 0, SNAP.FRONT)
      this.anchor = this.cursor.clone()
      this.move('chapter', -1, SNAP.BACK)
    } else {
      // select current gak
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
      // no rhythm
      const snap = direction === 'up' ? SNAP.FRONT : SNAP.BACK
      this.move('cell', this.cursor.cell, snap)
    }
    super.moveUpDown(direction)
    this.normalizeSelection()
  }
  moveLeftRight(direction: 'left' | 'right'): void {
    if (this.isSelecting) {
      // no rhythm
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
  copyRange(): Entry[][][] {
    if (this.anchor == null) throw Error('No selected found')
    const [first, last] = this.anchor.isLessThan(this.cursor)
      ? [this.anchor, this.cursor]
      : [this.cursor, this.anchor]
    return this.music.data
      .slice(first.chapter, last.chapter + 1)
      .flatMap(function (chapter, index): Entry[][][] {
        const cells = chapter.data
        const start = index === 0 ? first.cell : 0
        const end =
          first.chapter + index === last.chapter ? last.cell + 1 : cells.length
        return debone(cells.slice(start, end))
      })
  }
  copy(): ['Entry', Entry] | ['Range', Entry[][][]] {
    return this.isSelecting
      ? ['Range', this.copyRange()]
      : ['Entry', this.copyEntry()]
  }
}

export class MusicEditor extends MusicSelector {
  /* Button action */
  add<T extends keyof typeof PARENT_OF>(what: T, obj?: ElementOf[T]): UndoOp {
    if (this.cursor.rhythmMode && what === 'row') return this.addRhythmRow()
    const destPos = this.cursor[what] + 1
    if (obj == null) {
      if (what === 'chapter') {
        const config = newConfigFrom(this.get('chapter').config)
        obj = new Chapter(config) as any
      } else {
        obj = _make(what) as any
      }
    }
    this.get(PARENT_OF[what]).data.splice(destPos, 0, obj as any)
    const undo = this.move(what, destPos)
    return () => {
      undo()
      this.get(PARENT_OF[what]).data.splice(destPos, 1)
    }
  }
  addRhythmRow(): UndoOp {
    const rows = this.get('chapter').config.rhythm[this.cursor.cell]
    rows.splice(this.cursor.row + 1, 0, '')
    this.moveRhythm('row', this.cursor.row + 1)
    return () => {
      this.moveRhythm('row', this.cursor.row - 1)
      const rows = this.get('chapter').config.rhythm[this.cursor.cell]
      rows.splice(this.cursor.row + 1, 1)
    }
  }

  del(what: keyof typeof PARENT_OF): UndoOp {
    if (this.cursor.rhythmMode && what === 'row') return this.delRhythmRow()
    const arr = this.get(PARENT_OF[what]).data
    const idx = this.cursor[what]
    if (arr.length === 1) return this.erase(what)

    const undo =
      idx === arr.length - 1
        ? this.move(what, idx - 1, SNAP.BACK)
        : what === 'col'
        ? idOp
        : this.move(CHILD_OF[what], 0)
    const old = arr.splice(idx, 1)[0]
    return () => {
      this.get(PARENT_OF[what]).data.splice(idx, 0, old as any)
      undo()
    }
  }
  delRhythmRow() {
    const arr = this.get('chapter').config.rhythm[this.cursor.cell]
    const idx = this.cursor.row

    let undo = idOp
    const keep = arr.length === 1
    if (keep) arr.push('')
    else undo = this.moveRhythm('row', Math.min(idx, arr.length - 2))

    const old = arr.splice(idx, 1)[0]
    return () => {
      const arr = this.get('chapter').config.rhythm[this.cursor.cell]
      arr.splice(idx, keep ? 1 : 0, old)
      undo()
    }
  }

  write<T extends keyof typeof PARENT_OF>(what: T, obj: ElementOf[T]): UndoOp {
    const arr = this.get(PARENT_OF[what]).data
    const idx = this.cursor[what]
    const old = arr.splice(idx, 1, obj as any)[0]
    return () => {
      this.get(PARENT_OF[what]).data.splice(idx, 1, old as any)
    }
  }

  erase(what: keyof typeof PARENT_OF = 'col'): UndoOp {
    if (what !== 'chapter') return this.write(what, _make(what))

    const cells = this.get('chapter').data
    const old = cells.splice(0, cells.length, _make('cell'))
    return () => {
      this.get('chapter').data.splice(0, 1, ...old)
    }
  }

  /* Complex actions */
  private merge(): UndoOp {
    const what = this.getDelimiter()
    const preyPos = this.cursor[what] + 1
    const parentLevel = PARENT_OF[what]
    const parent = this.get(parentLevel).data
    if (!inRange(preyPos, parent)) return idOp

    const prey = parent.splice(preyPos, 1)[0] as any
    let undo: UndoOp = idOp
    if (what !== 'col') {
      this.get(what).data.push(...prey.data)
      undo = this.merge()
    }
    return () => {
      undo()
      const parent = this.get(parentLevel).data
      if (what !== 'col')
        this.get(what).data.splice(-prey.data.length, prey.data.length)
      parent.splice(preyPos, 0, prey)
    }
  }

  /* Keyboard actions */
  backspace(): UndoOp {
    if (this.get('col').data.main != null) return this.erase()

    if (!(this.stepCol(-1) || this.stepChapter(-1))) return idOp
    const undo = this.merge()
    return () => {
      undo()
      this.stepCol(+1) || this.stepChapter(+1)
    }
  }

  deletekey(): UndoOp {
    if (this.get('col').data.main != null) return this.erase()

    for (const level of ['col', 'row', 'cell'] as const) {
      const arr = this.get(PARENT_OF[level]).data
      if (inRange(this.cursor[level] + 1, arr.length)) return this.del(level)
      if (this.cursor[level] > 0) return this.backspace()
    }

    return this.del('chapter')
  }

  /* Selection actions */
  cutEntry(): [Entry, UndoOp] {
    if (this.isSelecting) throw Error('Selection found')
    const col = this.get('col')
    const old = col.data
    col.data = {}
    return [
      old,
      () => {
        this.get('col').data = old
      },
    ]
  }
  cutRange(): [Entry[][][], UndoOp] {
    if (this.anchor == null) throw Error('No selected found')
    this.move('row', 0)
    const oldCursor = this.cursor.clone()
    const [first, last] = this.anchor.isLessThan(oldCursor)
      ? [this.anchor, oldCursor]
      : [oldCursor, this.anchor]
    this.cursor.moveTo(first)

    const entries: Entry[][][] = []
    const undos: UndoOp[] = []
    while (true) {
      const cells = this.get('chapter').data
      const start = this.cursor.chapter === first.chapter ? first.cell : 0
      const end =
        this.cursor.chapter === last.chapter ? last.cell + 1 : cells.length

      const old = cells.splice(start, end - start)
      entries.push(...debone(old))
      cells.splice(start, 0, ...old.map(() => _make('cell')))
      undos.push(() =>
        this.get('chapter').data.splice(start, end - start, ...old)
      )

      if (this.cursor.chapter === last.chapter) break
      undos.push(this.move('chapter', this.cursor.chapter + 1))
    }
    undos.reverse()

    this.cursor.moveTo(oldCursor)
    return [entries, () => undos.forEach(op => op())]
  }

  pasteEntry(entry: Entry): UndoOp {
    if (this.isSelecting) {
      if (
        this.anchor?.chapter === this.cursor.chapter &&
        this.anchor.cell === this.cursor.cell
      )
        return this.pasteRange([[[entry]]])
      throw Error('Multi-cell selection found')
    }
    const col = this.get('col')
    const old = col.data
    col.data = entry
    return () => {
      this.get('col').data = old
    }
  }
  pasteRange(range: Entry[][][]): UndoOp {
    if (this.anchor == null) this.createSelection()
    else if (this.anchor.isLessThan(this.cursor))
      this.cursor.moveTo(this.anchor)
    else this.anchor.moveTo(this.cursor)

    const undos: UndoOp[] = []
    undos.push(this.move('row', 0, SNAP.FRONT))
    for (const [i, entries] of range.entries()) {
      const cell: Cell = {
        id: getID(),
        data: entries.map(row => ({
          id: getID(),
          data: row.map(col => ({ id: getID(), data: col })),
        })),
      }
      undos.push(this.write('cell', cell))
      if (i === range.length - 1) break

      if (inRange(this.cursor.cell + 1, this.get('chapter').data.length)) {
        undos.push(this.move('cell', this.cursor.cell + 1))
      } else if (inRange(this.cursor.chapter + 1, this.music.data.length)) {
        undos.push(this.move('chapter', this.cursor.chapter + 1))
        undos.push(this.move('cell', 0))
      } else {
        undos.push(this.add('cell'))
      }
    }
    undos.push(this.move('row', -1, SNAP.BACK))
    undos.reverse()
    return () => undos.forEach(op => op())
  }
}

function newConfigFrom(config: Config): Config {
  return {
    ...config,
    name: '새 장',
    rhythm: JSON.parse(JSON.stringify(config.rhythm)),
    hideRhythm: true,
    padding: 0,
  }
}
