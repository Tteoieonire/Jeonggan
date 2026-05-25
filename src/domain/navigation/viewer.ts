import Cursor, { Level } from './cursor'
import {
  CHILD_OF,
  type ElementOf,
  type MusicBase,
  PARENT_OF,
} from '../score'
import type { UndoOp } from '../editing/undo'
import { inRange, wrappedIdx } from '../utils'

export {
  CHILD_OF,
  type Cell,
  type Col,
  type Config,
  type ElementOf,
  type Entry,
  type Gak,
  type MusicBase,
  Chapter,
  PARENT_OF,
  type Row,
  _make,
} from '../score'
export { idOp, mergeActions, type UndoOp } from '../editing/undo'

export const enum SNAP {
  FRONT = 0,
  BACK = -1,
}

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

  step(level: 'col' | 'row' | 'cell', delta: 1 | -1 = +1): boolean {
    const parentLevel = PARENT_OF[level]
    let numSiblings = this.get(parentLevel).data.length
    let destPos = this.cursor[level] + delta
    if (inRange(destPos, numSiblings)) {
      const snap = delta > 0 ? SNAP.FRONT : SNAP.BACK
      this.move(level, destPos, snap)
      return true
    }
    return parentLevel !== 'chapter' && this.step(parentLevel, delta)
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
