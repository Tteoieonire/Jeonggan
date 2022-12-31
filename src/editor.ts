import { InstrumentName } from 'soundfont-player'
import Cursor from './cursor'
import { MusicPlayer } from './player'
import { getID, inRange } from './utils'
import {
  Alphabet,
  AlphabetOf,
  Cell,
  Chapter,
  CHILD_OF,
  Config,
  ElementOf,
  idOp,
  MusicBase,
  MusicViewer,
  PARENT_OF,
  Row,
  SNAP,
  UndoOp,
  _make,
} from './viewer'

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
    this.anchor = this.cursor.clone()
  }
  discardSelection() {
    this.anchor = undefined
  }
  normalizeSelection() {
    if (this.anchor == null) return
    if (this.anchor.isEqualTo(this.cursor)) return this.discardSelection()
    if (this.anchor.isLessThan(this.cursor)) return
    const tmp = this.anchor
    this.anchor = this.cursor
    this.cursor = tmp
  }

  selectAll() {
    this.discardSelection()
    this.move('chapter', 0)
    this.createSelection()
    this.move('chapter', -1, SNAP.BACK)
  }

  move(
    what: keyof typeof PARENT_OF,
    where: number,
    snap: SNAP = SNAP.FRONT
  ): UndoOp {
    if (this.anchor?.rhythmMode === true) return idOp
    return super.move(what, where, snap)
  }
  protected moveRhythm(cell: number): void {
    if (this.anchor?.rhythmMode === false) return
    super.moveRhythm(cell)
  }

  protected getDelimiter(direction: 1 | -1 = +1): keyof typeof PARENT_OF {
    if (inRange(this.cursor.col + direction, this.get('row').data)) return 'col'
    if (inRange(this.cursor.row + direction, this.get('cell').data))
      return 'row'
    if (inRange(this.cursor.cell + direction, this.get('chapter').data))
      return 'cell'
    return 'chapter'
  }

  copy(): Alphabet[] {
    const clone = this.clone()
    clone.normalizeSelection()
    if (!clone.isSelecting) clone.createSelection()
    const items: Alphabet[] = []
    while (clone.anchor?.isLessThan(clone.cursor)) {
      const cur = clone.get('col').data
      if (cur.main) items.push(['entry', cur])
      const delim = clone.getDelimiter(-1)
      if (delim !== 'chapter') items.push([delim, null])
      else items.push(['chapter', clone.get('chapter').config])
      clone.stepCol(-1) || clone.stepChapter(-1)
    }
    const cur = clone.get('col').data
    if (cur.main) items.push(['entry', cur])
    return items.reverse()
  }
}

export class MusicEditor extends MusicSelector {
  /* Button action */
  add<T extends keyof typeof PARENT_OF>(what: T, obj?: ElementOf[T]): UndoOp {
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

  del(what: keyof typeof PARENT_OF): UndoOp {
    const arr = this.get(PARENT_OF[what]).data
    const idx = this.cursor[what]
    if (arr.length === 1) return this.erase(what)

    const undo =
      idx === arr.length - 1 ? this.move(what, idx - 1, SNAP.BACK) : idOp
    const old = arr.splice(idx, 1)[0]
    return () => {
      this.get(PARENT_OF[what]).data.splice(idx, 0, old as any)
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
  private merge<T extends keyof typeof PARENT_OF>(
    what: T
  ): AlphabetOf[T] | null {
    const preyPos = this.cursor[what] + 1
    const parentLevel = PARENT_OF[what]
    const parent = this.get(parentLevel)
    if (!inRange(preyPos, parent.data)) return null

    if (what === 'chapter') {
      const prey = this.music.data.splice(preyPos, 1)[0]
      this.get('chapter').data.push(...prey.data)
      this.merge('cell')
      return ['chapter', prey.config] as any
    }

    const prey = parent.data.splice(preyPos, 1)[0] as unknown as T
    if (what !== 'col') {
      const children = this.get(what).data as any
      children.push(...(prey as any).data)
      this.merge((CHILD_OF as any)[what])
    }
    return [what, null] as any
  }

  shift(): Alphabet | null {
    const entry = this.get('col').data
    if (entry.main) {
      this.erase()
      return ['entry', entry]
    }
    return this.merge(this.getDelimiter())
  }

  unshift(item: Alphabet): void {
    const [level, data] = item
    if (level === 'entry') this.write('col', { id: getID(), data })
    else if (level !== 'chapter') this[`${level}break`]()
    else this.chapterbreak(data)
  }

  pop(): Alphabet | null {
    const entry = this.get('col').data
    if (entry.main) {
      this.erase()
      return ['entry', entry]
    }
    this.stepCol(-1) || this.stepChapter(-1)
    return this.merge(this.getDelimiter())
  }

  push(item: Alphabet): void {
    const [level, data] = item
    if (level === 'entry') {
      this.write('col', { id: getID(), data })
    } else if (level !== 'chapter') {
      this[`${level}break`]()
    } else {
      this.chapterbreak(data)
    }
  }

  /* Keyboard actions */
  backspace(): UndoOp {
    const old = this.pop()
    if (old == null) return idOp
    return () => this.push(old)
  }

  deletekey(): UndoOp {
    const old = this.shift()
    if (old == null) return idOp
    return () => this.unshift(old)
  }

  colbreak(): UndoOp {
    this.add('col', _make('col'))
    return () => this.merge('col')
  }

  rowbreak(): UndoOp {
    const newrow: Row = {
      id: getID(),
      data: this.get('row').data.splice(this.cursor.col + 1),
    }
    newrow.data.unshift(_make('col'))
    this.add('row', newrow)
    return () => this.merge('row')
  }

  cellbreak(): UndoOp {
    const newrow: Row = {
      id: getID(),
      data: this.get('row').data.splice(this.cursor.col + 1),
    }
    newrow.data.unshift(_make('col'))
    const newcell: Cell = {
      id: getID(),
      data: this.get('cell').data.splice(this.cursor.row + 1),
    }
    newcell.data.unshift(_make('row'))
    this.add('cell', newcell)
    return () => this.merge('cell')
  }

  chapterbreak(config?: Config): UndoOp {
    const chapter = this.get('chapter')
    if (!config) config = newConfigFrom(chapter.config)

    const newrow: Row = {
      id: getID(),
      data: this.get('row').data.splice(this.cursor.col + 1),
    }
    newrow.data.unshift(_make('col'))
    const newcell: Cell = {
      id: getID(),
      data: this.get('cell').data.splice(this.cursor.row + 1),
    }
    newcell.data.unshift(newrow)
    const newcells = chapter.data.splice(this.cursor.cell + 1)
    newcells.unshift(newcell)
    this.add('chapter', new Chapter(config, newcells))
    return () => this.merge('chapter')
  }

  /* Selection actions */
  cut(): Alphabet[] {
    this.normalizeSelection()
    if (!this.isSelecting) this.createSelection()
    const items: Alphabet[] = []
    while (this.anchor?.isLessThan(this.cursor)) {
      const item = this.pop()
      if (item == null) break
      items.push(item)
    }
    const cur = this.get('col').data
    this.erase()
    if (cur.main) items.push(['entry', cur])
    this.discardSelection()
    return items.reverse()
  }

  paste(items: Alphabet[]): Alphabet[] {
    const old = this.cut()
    this.createSelection()
    for (const item of items) this.push(item)
    return old
  }
}

function newConfigFrom(config: Config) {
  const rhythm = config.rhythm.slice()
  return {
    ...config,
    name: '새 장',
    rhythm,
    hideRhythm: true,
    padding: 0,
  }
}
