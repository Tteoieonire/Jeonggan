import Cursor, { Level } from './cursor'
import { type ElementOf, type MusicBase, PARENT_OF } from '../score'
import type { UndoOp } from '../editing/undo'
import {
  nextCursorForEnd,
  nextCursorForHome,
  nextCursorForLeftRight,
  nextCursorForMove,
  nextCursorForMoveClamp,
  nextCursorForRhythmMove,
  nextCursorForStep,
  nextCursorForStepChapter,
  nextCursorForUpDown,
  SNAP,
  toCursorState,
} from './state'

export {
  CHILD_OF,
  type Cell,
  type Col,
  type Config,
  type ElementOf,
  type Entry,
  type EntryCell,
  type EntryRange,
  type EntryRow,
  type Gak,
  type MusicBase,
  Chapter,
  PARENT_OF,
  type Row,
} from '../score'
export {
  nextCursorForEnd,
  nextCursorForHome,
  nextCursorForLeftRight,
  nextCursorForMove,
  nextCursorForMoveClamp,
  nextCursorForRhythmMove,
  nextCursorForStep,
  nextCursorForStepChapter,
  nextCursorForUpDown,
  SNAP,
  toCursorState,
  type CursorState,
  type ViewerState,
} from './state'
export { idOp, mergeActions, type UndoOp } from '../editing/undo'

export class MusicViewer {
  readonly cursor: Cursor
  constructor(public readonly music: MusicBase, cursor?: Cursor) {
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
    this.cursor.moveTo(nextCursorForMove(this, what, where, snap))
    return () => this.cursor.moveTo(oldPos)
  }
  moveRhythm(what: keyof typeof PARENT_OF, where: number): UndoOp {
    const oldPos = this.cursor.clone()
    this.cursor.moveTo(nextCursorForRhythmMove(this, what, where))
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
    const next = nextCursorForMoveClamp(this, what, where, snap)
    this.cursor.moveTo(next.cursor)
    return next.inRange
  }

  step(level: 'col' | 'row' | 'cell', delta: 1 | -1 = +1): boolean {
    const next = nextCursorForStep(this, level, delta)
    this.cursor.moveTo(next.cursor)
    return next.inRange
  }
  stepCol(delta: 1 | -1 = +1): boolean {
    return this.step('col', delta)
  }

  stepChapter(delta: 1 | -1 = +1): boolean {
    const next = nextCursorForStepChapter(this, delta)
    this.cursor.moveTo(next.cursor)
    return next.inRange
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
    this.cursor.moveTo(nextCursorForHome(this))
  }
  moveEnd() {
    this.cursor.moveTo(nextCursorForEnd(this))
  }
  moveUpDown(direction: 'up' | 'down'): void {
    this.cursor.moveTo(nextCursorForUpDown(this, direction))
  }
  moveLeftRight(direction: 'left' | 'right'): void {
    this.cursor.moveTo(nextCursorForLeftRight(this, direction))
  }
}
