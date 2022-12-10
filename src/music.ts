import { instrument, InstrumentName, Player } from 'soundfont-player'

import Cursor, { Level } from './cursor'
import {
  Note,
  pitchToScaleIdx,
  renderNote,
  scaleIdxToPitch,
  Sori,
} from './renderer'
import { MainEntry, ModifierEntry } from './symbols'
import { clamp, clone, getID, inRange, sleep, wrappedIdx } from './utils'

const idOp: UndoOp = () => {}
const enum SNAP {
  FRONT = 0,
  BACK = -1,
}

export type Config = {
  name: string
  tempo: number
  measure: number
  padding: number
  hideRhythm: boolean
  scale: number[]
  rhythm: string[]
}

export type Gak = {
  title: string
  chapterID: number
  chapterIndex: number
  gakIndex: number
  measure: number
  padding: number
} & (
  | { rhythm: true; content: Array<string> }
  | { rhythm: false; content: Array<Cell | undefined> }
)

export type Col = { main?: MainEntry; modifier?: ModifierEntry }
export type Row = (Col | undefined)[]
export type Cell = (Row | undefined)[]

export class Chapter extends Array<Cell | undefined> {
  config: Config
  constructor(config: Config, cells?: (Cell | undefined)[]) {
    cells = cells || [undefined]
    super(...cells)
    this.config = config
  }

  static get [Symbol.species]() {
    // Prevents weird behaviors when using native Array methods
    return Array
  }

  setConfig(config: Config) {
    this.config = config
  }

  asGaks(chapterIndex: number): Gak[] {
    const ID = getID(this)
    let gaks: Gak[] = []
    const measure = this.config.measure
    if (!this.config.hideRhythm) {
      gaks.push({
        title: this.config.name,
        chapterID: ID,
        chapterIndex,
        gakIndex: -1,
        rhythm: true,
        content: this.config.rhythm,
        measure,
        padding: 0,
      })
    }

    const numGaks = Math.ceil(this.length / measure)
    for (let i = 0; i < numGaks; i++) {
      const sliced = this.slice(i * measure, (i + 1) * measure)
      gaks.push({
        title: this.config.name,
        chapterID: ID,
        chapterIndex,
        gakIndex: i,
        rhythm: false,
        content: sliced,
        measure,
        padding: this.config.padding,
      })
    }
    return gaks
  }
}

export class Music extends Array<Chapter> {
  private _editor?: MusicEditor

  constructor(chapters?: Chapter[]) {
    chapters = chapters || []
    super(...chapters)
  }

  static get [Symbol.species]() {
    // Prevents weird behaviors when using native Array methods
    return Array
  }

  asGaks() {
    return this.flatMap((chapter, i) => chapter.asGaks(i))
  }

  getViewer() {
    return new MusicViewer(this)
  }

  getEditor() {
    if (this._editor == null) this._editor = new MusicEditor(this)
    return this._editor
  }
}

const PARENT_OF: {
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
const CHILD_OF: {
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
type ElementOf = {
  col: Col
  row: Row
  cell: Cell
  chapter: Chapter
  music: Music
}
export type UndoOp = () => void

export class MusicViewer {
  music: Music
  cursor: Cursor
  constructor(music: Music, cursor?: Cursor) {
    this.music = music
    this.cursor = cursor || new Cursor(false, 0, 0, 0, 0)
  }

  clone() {
    return new MusicViewer(this.music, this.cursor.clone())
  }

  asPlayer() {
    return new MusicPlayer(this.music, this.cursor.clone())
  }

  /* Operations */
  tryGet<K extends Level>(what: K): ElementOf[K] | null {
    const music = this.music
    if (what === 'music') return music as any

    const chapter = music[this.cursor.chapter]
    if (chapter == null) throw new Error('Invalid chapter index')
    if (what === 'chapter') return chapter as any

    let cell = chapter[this.cursor.cell]
    if (cell == null) return null
    if (what === 'cell') return cell as any

    let row = cell[this.cursor.row]
    if (row == null) return null
    if (what === 'row') return row as any

    let col = row[this.cursor.col]
    if (col == null) return null
    return col as any
  }

  getLength(what: keyof typeof CHILD_OF): number {
    const el = this.tryGet(what)
    return el == null ? 1 : el.length
  }

  move(
    what: keyof typeof PARENT_OF,
    where: number,
    snap: SNAP = SNAP.FRONT
  ): UndoOp {
    const oldPos = this.cursor.clone()
    const viewer = this.clone()
    viewer.cursor.rhythmMode = false
    viewer.cursor[what] = wrappedIdx(where, viewer.getLength(PARENT_OF[what]))
    while (what !== 'col') {
      what = CHILD_OF[what]
      viewer.cursor[what] = wrappedIdx(snap, viewer.getLength(PARENT_OF[what]))
    }
    this.cursor.moveTo(viewer.cursor)
    return () => this.cursor.moveTo(oldPos)
  }

  protected moveRhythm(cell: number): void {
    const chapter = this.cursor.chapter
    cell = clamp(cell, this.music[chapter].config.measure)
    this.cursor.moveRhythm(chapter, cell)
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
    } else if (where >= this.getLength(PARENT_OF[what])) {
      where = -1
      snap = SNAP.BACK
      this.move(what, -1, SNAP.BACK)
      return false
    }
    this.move(what, where, snap)
    return true
  }

  stepCol(delta: 1 | -1 = +1): boolean {
    const _step = (level: Level, delta: 1 | -1): boolean => {
      if (level === 'music' || level === 'chapter') return false

      const parentLevel = PARENT_OF[level]
      let numSiblings = this.getLength(parentLevel)
      let destPos = this.cursor[level] + delta
      if (inRange(destPos, numSiblings)) {
        const snap = delta > 0 ? SNAP.FRONT : SNAP.BACK
        this.move(level, destPos, snap)
        return true
      }
      return _step(parentLevel, delta)
    }
    return _step('col', delta)
  }

  stepChapter(delta: 1 | -1 = +1): boolean {
    const destPos = this.cursor.chapter + delta
    if (!inRange(destPos, this.music)) return false
    const snap = delta > 0 ? SNAP.FRONT : SNAP.BACK
    this.move('chapter', destPos, snap)
    return true
  }

  colDuration(ticksPerCell = 0) {
    const tempo = this.music[this.cursor.chapter].config.tempo
    if (!ticksPerCell) ticksPerCell = 60000 / tempo // milliseconds
    const numRows = this.getLength('cell')
    const numCols = this.getLength('row')
    return ticksPerCell / (numRows * numCols)
  }

  getLastPitch(): number | undefined {
    // TODO: take octave into account!!
    const viewer = this.clone()
    let lastPitch = null
    let distance = 0
    do {
      const pitch = viewer.tryGet('col')?.main?.pitch
      if (typeof pitch === 'number') {
        lastPitch = pitch + 51
        break
      }
      distance++
    } while (viewer.stepCol(-1) || viewer.stepChapter(-1))
    if (lastPitch == null) return undefined
    if (distance === 0) return undefined

    while (viewer.stepCol(+1) || viewer.stepChapter(+1)) {
      distance--
      if (distance === 0) return lastPitch

      const pitch = viewer.tryGet('col')?.main?.pitch
      if (pitch == null) continue
      if (typeof pitch === 'number') break

      const scale = viewer.music[viewer.cursor.chapter].config.scale
      const offset = +pitch[pitch.length - 1] - 3
      const scaleIdx = pitchToScaleIdx(lastPitch, scale)
      lastPitch = scaleIdxToPitch(scaleIdx + offset, scale)
    }
    throw Error('getLastPitch unstable')
  }

  protected _gak(cell: number) {
    const config = this.music[this.cursor.chapter].config
    return Math.floor((cell + config.padding) / config.measure)
  }
  protected _jeong(cell: number) {
    const config = this.music[this.cursor.chapter].config
    return (cell + config.padding) % config.measure
  }
  moveHome() {
    const jeong = this._jeong(this.cursor.cell)
    this.move('cell', this.cursor.cell - jeong, SNAP.FRONT)
  }
  moveEnd() {
    const measure = this.music[this.cursor.chapter].config.measure
    const jeong = this._jeong(this.cursor.cell)
    this.move('cell', this.cursor.cell - jeong + (measure - 1), SNAP.BACK)
  }
  moveUpDown(direction: 'up' | 'down'): void {
    const delta = direction === 'down' ? +1 : -1
    const snap = direction === 'down' ? SNAP.FRONT : SNAP.BACK
    if (this.cursor.rhythmMode) return this.moveRhythm(this.cursor.cell + delta)

    const src = this.cursor.col / this.getLength('row')

    if (!this.moveClamp('row', this.cursor.row + delta, snap))
      if (!this.moveClamp('cell', this.cursor.cell + delta, snap))
        this.moveClamp('chapter', this.cursor.chapter + delta, snap)

    this.move('col', Math.floor(src * this.getLength('row')))
  }
  moveLeftRight(direction: 'left' | 'right'): void {
    let chapter = this.music[this.cursor.chapter]
    let config = chapter.config
    let delta = direction === 'right' ? +1 : -1
    const snap = direction === 'right' ? SNAP.FRONT : SNAP.BACK

    if (this.cursor.rhythmMode) return this._moveLeftRightRhythm(direction)
    if (this.moveClamp('col', this.cursor.col + delta)) return

    delta = direction === 'left' ? +1 : -1
    let destPos = this.cursor.cell + delta * config.measure
    if (inRange(destPos, this.getLength('chapter'))) {
      const src = this.cursor.row / this.getLength('cell')
      this.move('cell', destPos)
      this.move('row', Math.floor(src * this.getLength('cell')), snap)
      return
    }

    if (inRange(this._gak(destPos), this._gak(chapter.length - 1) + 1))
      this.moveClamp('cell', destPos, snap)
    else if (!config.hideRhythm && direction === 'right')
      this.moveRhythm(this.cursor.cell + config.padding)
    else this._moveLeftRightChapter(direction)
  }
  private _moveLeftRightRhythm(direction: 'left' | 'right'): void {
    if (direction === 'left') {
      let chapter = this.music[this.cursor.chapter]
      let config = chapter.config
      this.moveClamp('cell', this.cursor.cell - config.padding, SNAP.BACK)
    } else if (this.cursor.chapter > 0) {
      const srcPos = this.cursor.cell
      this.move('chapter', this.cursor.chapter - 1)

      let chapter = this.music[this.cursor.chapter]
      let config = chapter.config
      const tail = (chapter.length + config.padding) % config.measure
      this.moveClamp('cell', chapter.length - tail + srcPos, SNAP.FRONT)
    }
  }
  private _moveLeftRightChapter(direction: 'left' | 'right'): void {
    const delta = direction === 'left' ? +1 : -1
    let snap = direction === 'left' ? SNAP.FRONT : SNAP.BACK

    const srcJeong = this._jeong(this.cursor.cell)
    const src = this.cursor.row / this.getLength('cell')

    // set chapter
    if (!this.moveClamp('chapter', this.cursor.chapter + delta, snap)) return
    const chapter = this.music[this.cursor.chapter]
    const config = chapter.config

    // set cell
    if (!config.hideRhythm && direction === 'left')
      return this.moveRhythm(srcJeong)
    const head = chapter.length - this._jeong(chapter.length)
    const destPos = srcJeong + (direction === 'left' ? -config.padding : head)
    if (!this.moveClamp('cell', destPos, snap)) return

    // set row
    snap = direction === 'right' ? SNAP.FRONT : SNAP.BACK
    this.move('row', Math.floor(src * this.getLength('cell')), snap)
  }
}

export class MusicPlayer extends MusicViewer {
  protected static _ac = new AudioContext()
  protected static _players: Partial<Record<InstrumentName, Player>> = {}

  protected _player?: Player
  lastPitch?: number
  finished = false

  protected async getPlayer(_instrument: InstrumentName) {
    if (!(_instrument in MusicPlayer._players)) {
      MusicPlayer._players[_instrument] = await instrument(
        MusicPlayer._ac,
        _instrument
      )
    }
    return MusicPlayer._players[_instrument]
  }

  render(sori: Sori) {
    const scale = this.music[this.cursor.chapter].config.scale
    try {
      return renderNote(sori, scale, this.lastPitch)
    } catch (e) {
      this.lastPitch = this.getLastPitch()
      return renderNote(sori, scale, this.lastPitch)
    }
  }

  async play(instrument: InstrumentName) {
    this.stop()
    this.finished = false
    this._player = await this.getPlayer(instrument)
    let notes: Note[]
    let lastPitch: number | undefined = undefined
    do {
      this.lastPitch = lastPitch ?? this.lastPitch
      const cur = this.tryGet('col')
      const duration = this.colDuration()

      if (cur?.main) {
        this._player?.stop()
        if (cur.main.pitch) {
          const sori: Sori = {
            time: 0,
            duration,
            main: cur.main,
            modifier: cur.modifier,
            headDuration: duration,
          }

          ;[notes, lastPitch] = this.render(sori)
          for (const note of notes) {
            if (!this._player) return
            this._player.stop()
            this._player.start('' + note.pitch)
            await sleep(note.duration)
          }
          continue
        }
      }
      await sleep(duration)
    } while (this._player && (this.stepCol() || this.stepChapter()))
    this.stop()
    this.finished = true
  }

  stop() {
    this._player?.stop()
    delete this._player
  }
}

export class MusicSelector extends MusicViewer {
  anchor?: Cursor

  get isSelecting() {
    return this.anchor != null
  }
  createSelection() {
    this.anchor = this.cursor.clone()
    console.log('create selection')
  }
  discardSelection() {
    this.anchor = undefined
    console.log('discard selection')
  }

  async stop() {
    this.playing = false
    const player = await getPlayer()
    player.stop()
  }
}

export class MusicSelector extends MusicViewer {
  anchor?: Cursor

  get isSelecting() {
    return this.anchor != null
  }
  createSelection() {
    this.anchor = this.cursor.clone()
    console.log('create selection')
  }
  discardSelection() {
    this.anchor = undefined
    console.log('discard selection')
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
}

export class MusicEditor extends MusicSelector {
  get<K extends Level>(what: K): ElementOf[K] {
    // This one makes sure you DO get something valid.
    const music = this.music
    if (what === 'music') return music as any

    const chapter = music[this.cursor.chapter]
    if (chapter == null) throw new Error('Invalid chapter index')
    if (what === 'chapter') return chapter as any

    let cell = chapter[this.cursor.cell]
    if (cell == null) {
      cell = [new Array(1)]
      chapter.splice(this.cursor.cell, 1, cell)
    }
    if (what === 'cell') return cell as any

    let row = cell[this.cursor.row]
    if (row == null) {
      row = new Array(1)
      cell.splice(this.cursor.row, 1, row)
    }
    if (what === 'row') return row as any

    let col = row[this.cursor.col]
    if (col == null) {
      col = {}
      row.splice(this.cursor.col, 1, col)
    }
    return col as any
  }

  trim() {
    const el = this.tryGet('cell')
    if (!isEmptyCell(el)) return
    this.get('chapter').splice(this.cursor.cell, 1, undefined)
  }

  /* Button action */
  add<T extends keyof typeof PARENT_OF>(what: T, obj?: ElementOf[T]): UndoOp {
    const destPos = this.cursor[what] + 1
    if (what === 'chapter' && obj == null) {
      const config = newConfigFrom(this.get('chapter').config)
      obj = new Chapter(config) as any
    }
    this.get(PARENT_OF[what]).splice(destPos, 0, obj as any)
    const undo = this.move(what, destPos)
    return () => {
      undo()
      this.get(PARENT_OF[what]).splice(destPos, 1)
    }
  }

  del(what: keyof typeof PARENT_OF): UndoOp {
    const arr = this.get(PARENT_OF[what])
    const idx = this.cursor[what]
    if (arr.length === 1) return this.erase(what)

    const undo =
      idx === arr.length - 1 ? this.move(what, idx - 1, SNAP.BACK) : idOp
    const old = arr.splice(idx, 1)[0]
    return () => {
      this.get(PARENT_OF[what]).splice(idx, 0, old as any)
      undo()
    }
  }

  write<T extends keyof typeof PARENT_OF>(what: T, obj?: ElementOf[T]): UndoOp {
    const arr = this.get(PARENT_OF[what])
    const idx = this.cursor[what]
    const old = arr.splice(idx, 1, obj as any)[0]
    return () => {
      this.get(PARENT_OF[what]).splice(idx, 1, old as any)
    }
  }

  erase(what: keyof typeof PARENT_OF = 'col'): UndoOp {
    if (what !== 'chapter') return this.write(what, undefined)

    const chapter = this.get('chapter')
    const old = chapter.splice(0, chapter.length, undefined)
    return () => {
      this.get('chapter').splice(0, 1, ...old)
    }
  }

  /* Keyboard actions */
  mergeLater(what: keyof typeof PARENT_OF): UndoOp {
    if (what === 'col') return idOp
    const preyPos = this.cursor[what] + 1
    const parentLevel = PARENT_OF[what]
    const parent = this.get(parentLevel)
    if (!inRange(preyPos, parent)) return idOp

    const obj = parent.splice(preyPos, 1)
    const children = obj[0]
    const numChildren = children?.length
    const config = (children as any)?.config
    if (children) this.get(what).push(...(children as any))
    const undo = this.mergeLater(CHILD_OF[what])

    return () => {
      undo()
      const parent = this.get(parentLevel)
      if (numChildren) {
        const el = this.get(what)
        const tail = el.splice(el.length - numChildren, numChildren)
        if (what === 'chapter')
          parent.push(new Chapter(config, tail as any) as any)
        else parent.push(tail as any)
      } else {
        parent.splice(preyPos, 0, undefined)
      }
    }
  }

  getDelimiter(direction: 1 | -1 = +1): keyof typeof PARENT_OF | null {
    if (this.get('col').main) return null
    if (inRange(this.cursor.col + direction, this.get('row'))) return 'col'
    if (inRange(this.cursor.row + direction, this.get('cell'))) return 'row'
    if (inRange(this.cursor.cell + direction, this.get('chapter')))
      return 'cell'
    return 'chapter'
  }

  backspace(): UndoOp {
    const delim = this.getDelimiter(-1)
    if (delim == null) return this.erase()
    this.stepCol(-1) || this.stepChapter(-1)
    const undo = this.mergeLater(delim)
    const old = this.get('row').splice(this.cursor.col + 1, 1)[0]
    return () => {
      this.get('row').splice(this.cursor.col + 1, 0, old)
      undo()
      this.stepCol(+1) || this.stepChapter(+1)
    }
  }

  deletekey(): UndoOp {
    const delim = this.getDelimiter(+1)
    if (delim == null) return this.erase()
    const undo = this.mergeLater(delim)
    const old = this.get('row').splice(this.cursor.col, 1)[0]
    return () => {
      this.get('row').splice(this.cursor.col, 0, old)
      undo()
    }
  }

  colbreak(): UndoOp {
    this.add('col')
    return () => this.backspace()
  }

  rowbreak(): UndoOp {
    const newrow = this.get('row').splice(this.cursor.col + 1)
    newrow.unshift(undefined)
    this.add('row', newrow)
    return () => this.backspace()
  }

  cellbreak(): UndoOp {
    const newrow = this.get('row').splice(this.cursor.col + 1)
    newrow.unshift(undefined)
    const newcell = this.get('cell').splice(this.cursor.row + 1)
    newcell.unshift(newrow)
    this.add('cell', newcell)
    return () => this.backspace()
  }

  chapterbreak(config?: Config): UndoOp {
    const chapter = this.get('chapter')
    if (!config) config = newConfigFrom(chapter.config)

    const newrow = this.get('row').splice(this.cursor.col + 1)
    newrow.unshift(undefined)
    const newcell = this.get('cell').splice(this.cursor.row + 1)
    newcell.unshift(newrow)
    const newcells = chapter.splice(this.cursor.cell + 1)
    newcells.unshift(newcell)
    this.add('chapter', new Chapter(config, newcells))
    return () => this.backspace()
  }
}

function isEmptyCell(cell?: Cell | null) {
  if (!cell) return true
  if (cell.length > 1) return false
  if (!cell[0]) return true
  if (cell[0].length > 1) return false
  if (cell[0][0] && cell[0][0].main) return false
  return true
}

function newConfigFrom(config: Config) {
  config = clone(config)
  config.name = '새 장'
  config.rhythm = config.rhythm.slice()
  config.hideRhythm = true
  config.padding = 0
  return config
}
