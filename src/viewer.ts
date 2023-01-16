import { InstrumentName } from 'soundfont-player'
import { RHYTHM_OBJ } from './constants'
import Cursor, { Level } from './cursor'
import { MainEntry, ModifierEntry } from './symbols'
import { getID, inRange, WithID, wrappedIdx } from './utils'

export type UndoOp = () => void
export const idOp: UndoOp = () => {}

export function mergeActions(...actions: (() => UndoOp)[]): () => UndoOp {
  return () => {
    const undos = actions.map(f => f())
    undos.reverse()
    return () => undos.forEach(f => f())
  }
}

export const enum SNAP {
  FRONT = 0,
  BACK = -1,
}

export type Config = Readonly<{
  name: string
  tempo: number
  measure: number[]
  padding: number
  hideRhythm: boolean
  scale: number[]
  rhythm: (typeof RHYTHM_OBJ[number] | '')[][]
}>

export type Gak = {
  title: string
  chapterID: number
  chapterIndex: number
  gakIndex: number
  isLast: boolean
  measure: number[]
  padding: number
} & ({ rhythm: true; content: string[][] } | { rhythm: false; content: Cell[] })

export type Entry = { main?: MainEntry; modifier?: ModifierEntry }
export type Col = WithID<Entry>
export type Row = WithID<Col[]>
export type Cell = WithID<Row[]>

export const PARENT_OF: {
  col: 'row'
  row: 'cell'
  cell: 'chapter'
  chapter: 'music'
} = {
  col: 'row',
  row: 'cell',
  cell: 'chapter',
  chapter: 'music',
}
export const CHILD_OF: {
  row: 'col'
  cell: 'row'
  chapter: 'cell'
  music: 'chapter'
} = {
  row: 'col',
  cell: 'row',
  chapter: 'cell',
  music: 'chapter',
}
export type ElementOf = {
  col: Col
  row: Row
  cell: Cell
  chapter: Chapter
  music: MusicBase
}

export function _make<K extends 'col' | 'row' | 'cell'>(what: K): ElementOf[K] {
  const col: Col = { id: getID(), data: {} }
  if (what === 'col') return col as any
  const row: Row = { id: getID(), data: [col] }
  if (what === 'row') return row as any
  const cell: Cell = { id: getID(), data: [row] }
  return cell as any
}

export class Chapter {
  id: number
  config: Config
  data: Cell[]
  constructor(config: Config, cells?: Cell[]) {
    this.id = getID()
    this.config = config
    this.data = cells || [_make('cell')]
  }

  setConfig(config: Config): void {
    this.config = config
  }

  asGaks(chapterIndex: number): Gak[] {
    let gaks: Gak[] = []
    if (!this.config.hideRhythm) {
      gaks.push({
        title: this.config.name,
        chapterID: this.id,
        chapterIndex,
        gakIndex: -1,
        rhythm: true,
        content: this.config.rhythm,
        measure: this.config.measure,
        padding: 0,
        isLast: false,
      })
    }

    const gakLength = this.config.rhythm.length
    const numGaks = Math.ceil(this.data.length / gakLength)
    for (let i = 0; i < numGaks; i++) {
      const sliced = this.data.slice(i * gakLength, (i + 1) * gakLength)
      gaks.push({
        title: this.config.name,
        chapterID: this.id,
        chapterIndex,
        gakIndex: i,
        rhythm: false,
        content: sliced,
        measure: this.config.measure,
        padding: this.config.padding,
        isLast: i === numGaks - 1,
      })
    }
    return gaks
  }
}

export type MusicBase = { data: Chapter[]; instrument: InstrumentName }

export class MusicViewer {
  music: MusicBase
  cursor: Cursor
  constructor(music: MusicBase, cursor?: Cursor) {
    this.music = music
    this.cursor = cursor || new Cursor(false, 0, 0, 0, 0)
  }

  clone() {
    return new MusicViewer(this.music, this.cursor.clone())
  }

  /* Operations */
  get<K extends Level>(what: K): ElementOf[K] {
    const music = this.music
    if (what === 'music') return music as any

    const chapter = music.data[this.cursor.chapter]
    if (what === 'chapter') return chapter as any

    const cell = chapter.data[this.cursor.cell]
    if (what === 'cell') return cell as any

    const row = cell.data[this.cursor.row]
    if (what === 'row') return row as any

    const col = row.data[this.cursor.col]
    return col as any
  }

  move(
    what: keyof typeof PARENT_OF,
    where: number,
    snap: SNAP = SNAP.FRONT
  ): UndoOp {
    const oldPos = this.cursor.clone()
    const viewer = this.clone()
    viewer.cursor.rhythmMode = false
    viewer.cursor[what] = wrappedIdx(
      where,
      viewer.get(PARENT_OF[what]).data.length
    )
    while (what !== 'col') {
      what = CHILD_OF[what]
      viewer.cursor[what] = wrappedIdx(
        snap,
        viewer.get(PARENT_OF[what]).data.length
      )
    }
    this.cursor.moveTo(viewer.cursor)
    return () => this.cursor.moveTo(oldPos)
  }
  moveRhythm(what: keyof typeof PARENT_OF, where: number): UndoOp {
    const oldPos = this.cursor.clone()
    const viewer = this.clone()
    viewer.cursor.rhythmMode = true
    viewer.cursor[what] = where
    while (what !== 'col') {
      what = CHILD_OF[what]
      viewer.cursor[what] = 0
    }
    this.cursor.moveTo(viewer.cursor)
    return () => this.cursor.moveTo(oldPos)
  }

  /**
   * Moves the cursor with clamping. Returns whether `where` was in the range.
   */
  protected moveClamp(
    what: keyof typeof PARENT_OF,
    where: number,
    snap: SNAP = SNAP.FRONT
  ): boolean {
    if (where < 0) {
      this.move(what, 0, SNAP.FRONT)
      return false
    } else if (where >= this.get(PARENT_OF[what]).data.length) {
      where = -1
      snap = SNAP.BACK
      this.move(what, -1, SNAP.BACK)
      return false
    }
    this.move(what, where, snap)
    return true
  }

  step(level: Level, delta: 1 | -1 = +1): boolean {
    if (level === 'music') return false
    if (level === 'chapter') return this.stepChapter(delta)

    const parentLevel = PARENT_OF[level]
    let numSiblings = this.get(parentLevel).data.length
    let destPos = this.cursor[level] + delta
    if (inRange(destPos, numSiblings)) {
      const snap = delta > 0 ? SNAP.FRONT : SNAP.BACK
      this.move(level, destPos, snap)
      return true
    }
    return this.step(parentLevel, delta)
  }

  stepCol(delta: 1 | -1 = +1): boolean {
    return this.step('col', delta)
  }

  stepChapter(delta: 1 | -1 = +1): boolean {
    const destPos = this.cursor.chapter + delta
    if (!inRange(destPos, this.music.data)) return false
    const snap = delta > 0 ? SNAP.FRONT : SNAP.BACK
    this.move('chapter', destPos, snap)
    return true
  }

  colDuration(ticksPerCell = 0) {
    const tempo = this.music.data[this.cursor.chapter].config.tempo
    if (!ticksPerCell) ticksPerCell = 60000 / tempo // milliseconds
    const numRows = this.get('cell').data.length
    const numCols = this.get('row').data.length
    return ticksPerCell / (numRows * numCols)
  }

  protected _gak(cell: number) {
    const config = this.music.data[this.cursor.chapter].config
    return Math.floor((cell + config.padding) / config.rhythm.length)
  }
  protected _jeong(cell: number) {
    const config = this.music.data[this.cursor.chapter].config
    return (cell + config.padding) % config.rhythm.length
  }
  moveHome() {
    const jeong = this._jeong(this.cursor.cell)
    this.move('cell', this.cursor.cell - jeong, SNAP.FRONT)
  }
  moveEnd() {
    const measure = this.music.data[this.cursor.chapter].config.rhythm.length
    const jeong = this._jeong(this.cursor.cell)
    this.move('cell', this.cursor.cell - jeong + (measure - 1), SNAP.BACK)
  }
  moveUpDown(direction: 'up' | 'down'): void {
    const delta = direction === 'down' ? +1 : -1
    const snap = direction === 'down' ? SNAP.FRONT : SNAP.BACK
    if (this.cursor.rhythmMode) {
      const rhythm = this.get('chapter').config.rhythm
      if (inRange(this.cursor.row + delta, rhythm[this.cursor.cell].length)) {
        this.moveRhythm('row', this.cursor.row + delta)
      } else if (inRange(this.cursor.cell + delta, rhythm.length)) {
        this.moveRhythm('cell', this.cursor.cell + delta)
        this.moveRhythm(
          'row',
          direction === 'down' ? 0 : rhythm[this.cursor.cell].length - 1
        )
      }
      return
    }

    const src = (this.cursor.col + 0.49) / this.get('row').data.length

    if (!this.moveClamp('row', this.cursor.row + delta, snap))
      if (!this.moveClamp('cell', this.cursor.cell + delta, snap))
        this.moveClamp('chapter', this.cursor.chapter + delta, snap)

    this.move('col', Math.floor(src * this.get('row').data.length))
  }
  moveLeftRight(direction: 'left' | 'right'): void {
    let chapter = this.music.data[this.cursor.chapter]
    let config = chapter.config
    let delta = direction === 'right' ? +1 : -1
    const snap = direction === 'right' ? SNAP.FRONT : SNAP.BACK

    if (this.cursor.rhythmMode) return this._moveLeftRightRhythm(direction)
    if (this.moveClamp('col', this.cursor.col + delta)) return

    delta = direction === 'left' ? +1 : -1
    let destPos = this.cursor.cell + delta * config.rhythm.length
    if (inRange(destPos, this.get('chapter').data.length)) {
      const src = (this.cursor.row + 0.49) / this.get('cell').data.length
      this.move('cell', destPos)
      this.move('row', Math.floor(src * this.get('cell').data.length), snap)
      return
    }

    if (inRange(this._gak(destPos), this._gak(chapter.data.length - 1) + 1)) {
      this.moveClamp('cell', destPos, snap)
    } else if (!config.hideRhythm && direction === 'right') {
      const src = (this.cursor.row + 0.49) / this.get('cell').data.length
      this.moveRhythm('cell', this.cursor.cell + config.padding)
      const row = Math.floor(src * config.rhythm[this.cursor.cell].length)
      this.moveRhythm('row', row)
    } else {
      this._moveLeftRightChapter(direction)
    }
  }
  private _moveLeftRightRhythm(direction: 'left' | 'right'): void {
    let chapter = this.music.data[this.cursor.chapter]
    const rhythm = chapter.config.rhythm
    const src = (this.cursor.row + 0.49) / rhythm[this.cursor.cell].length
    if (direction === 'left') {
      if (this.moveClamp('cell', this.cursor.cell - chapter.config.padding))
        this.move('row', Math.floor(src * this.get('cell').data.length))
      this.move('col', -1)
    } else if (this.cursor.chapter > 0) {
      const srcJeong = this.cursor.cell
      this.move('chapter', this.cursor.chapter - 1)
      const lastCell = this.music.data[this.cursor.chapter].data.length - 1

      if (this.moveClamp('cell', lastCell - this._jeong(lastCell) + srcJeong))
        this.move('row', Math.floor(src * this.get('cell').data.length))
      this.move('col', 0)
    }
  }
  private _moveLeftRightChapter(direction: 'left' | 'right'): void {
    const delta = direction === 'left' ? +1 : -1
    let snap = direction === 'left' ? SNAP.FRONT : SNAP.BACK

    const srcJeong = this._jeong(this.cursor.cell)
    const src = (this.cursor.row + 0.49) / this.get('cell').data.length

    // set chapter
    if (!inRange(this.cursor.chapter + delta, this.music.data.length)) return
    this.move('chapter', this.cursor.chapter + delta, snap)
    const chapter = this.music.data[this.cursor.chapter]
    const config = chapter.config

    // set cell
    if (!config.hideRhythm && direction === 'left') {
      this.moveRhythm('cell', srcJeong)
      const row = Math.floor(src * config.rhythm[srcJeong].length)
      this.moveRhythm('row', row)
      return
    }
    const head = chapter.data.length - 1 - this._jeong(chapter.data.length - 1)
    const destPos = srcJeong + (direction === 'left' ? -config.padding : head)
    if (!this.moveClamp('cell', destPos, snap)) return

    // set row
    snap = direction === 'right' ? SNAP.FRONT : SNAP.BACK
    this.move('row', Math.floor(src * this.get('cell').data.length), snap)
  }
}
