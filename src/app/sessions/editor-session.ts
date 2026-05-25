import type { InstrumentName } from 'soundfont-player'

import {
  executeEditorCommand,
  executeEditorKeyboardCommand,
  type EditorCommand,
} from '../commands'
import { createEditorHistory, type EditorHistory } from './editor-history'
import { rhythmTickIndex, YUL_OBJ } from '../../domain/constants'
import Cursor, { CoordLevel } from '../../domain/navigation/cursor'
import { Music } from '../../domain/music'
import { MusicEditor } from '../../domain/editing/music-editor'
import type { EntryOf, TrillState } from '../../domain/symbols'
import { Config, UndoOp } from '../../domain/navigation/viewer'
import {
  makeCanvasLabel,
  moveCanvasCursor,
  selectCanvasRange,
  startCanvasDrag,
} from '../../features/canvas'
import { canPaste, type ClipboardData } from '../../features/clipboard'
import { IME } from '../../features/ime'
import {
  getKeyboardCommand,
  type KeyboardCommand,
  type KeyboardContext,
  type KeyboardInput,
} from '../../features/keyboard'
import { resolveOctaveChange, applyModifierTrill } from '../../features/keypad'

const INIT_CONFIG: Config = {
  name: '초장',
  tempo: 60,
  measure: [6],
  rhythm: [['떵'], [''], ['기덕'], ['쿵'], ['더러러러'], ['더']],
  hideRhythm: false,
  scale: [0, 2, 5, 7, 9],
  padding: 0,
}

export type EditorSessionHooks = {
  requestFocus?: () => void
}

export class EditorSession {
  music!: Music
  editor!: MusicEditor
  config!: Config
  sigimShow = false
  octave = 0
  trill: TrillState = {}
  tickIdx = -1
  ime = new IME()
  history!: EditorHistory
  clipboard: ClipboardData | undefined
  private dragging = false

  constructor(private readonly hooks: EditorSessionHooks = {}) {
    this.create('새 곡')
  }

  create(title = ''): void {
    const music = new Music(title)
    music.data.push(music.score.chapter(INIT_CONFIG))
    this.replaceMusic(music)

    this.editor.cursor.move(0, 0, 0, 0)
    this.write('main', YUL_OBJ[3][0])
    this.editor.add('cell')
    this.editor.stepCol(-1)
  }

  load(music: Music): void {
    this.replaceMusic(music)
  }

  rename(title: string, instrument: InstrumentName): void {
    this.music.title = title
    this.music.instrument = instrument
  }

  get undoable(): boolean {
    return this.history.undoable
  }

  canUndo(playerActive: boolean): boolean {
    return !playerActive && this.undoable
  }

  get redoable(): boolean {
    return this.history.redoable
  }

  canRedo(playerActive: boolean): boolean {
    return !playerActive && this.redoable
  }

  get pastable(): boolean {
    return canPaste(
      this.clipboard,
      this.editor.isSelecting,
      this.editor.anchor,
      this.editor.cursor
    )
  }

  get gaks() {
    return this.music.asGaks()
  }

  get trillShow(): TrillState {
    return {
      before: this.trill && this.trill.before != null,
      after: this.trill && this.trill.after != null,
    }
  }

  canvasLabel(playerActive: boolean): string {
    if (playerActive) return makeCanvasLabel({ playing: true })
    return makeCanvasLabel({
      cursor: this.editor.cursor,
      config: this.config,
      numRows: this.editor.get('cell').data.length,
      numCols: this.editor.get('row').data.length,
      col: this.editor.get('col'),
    })
  }

  moveTo(coord: Cursor): void {
    moveCanvasCursor(this.editor, coord)
  }

  selectTo(coord: Cursor): void {
    selectCanvasRange(this.editor, coord)
  }

  get isDragging(): boolean {
    return this.dragging
  }

  pointerDown(coord: Cursor): void {
    this.dragging = startCanvasDrag(this.editor, coord)
  }

  pointerOver(coord: Cursor): void {
    if (this.dragging) this.selectTo(coord)
  }

  pointerUp(): void {
    this.dragging = false
  }

  discardSelection(): void {
    this.editor.discardSelection()
  }

  execute(command: EditorCommand): void {
    executeEditorCommand(this, command)
  }

  write<K extends keyof EntryOf>(
    where: K,
    obj?: EntryOf[K],
    resetIME = true
  ): void {
    this.execute({
      type: 'writeEntry',
      where,
      entry: obj,
      resetIme: resetIME,
    })
  }

  erase(): void {
    this.execute({ type: 'erase' })
  }

  changeShape(what: CoordLevel, delta: -1 | 1): void {
    this.execute({ type: 'changeShape', level: what, delta })
  }

  changeOctave(delta: -1 | 1): void {
    if (this.octave + delta < -3 || this.octave + delta > 3) return
    this.octave += delta
  }

  changeTick(tickIdx: number): void {
    this.execute({ type: 'writeRhythmTick', tickIdx })
  }

  changeTrill(trill: TrillState): void {
    const modifier = applyModifierTrill(
      this.editor.get('col').data?.modifier,
      trill
    )
    if (modifier != null) this.write('modifier', modifier)
  }

  changeConfig(config: Config, isVisibleChange: boolean): void {
    if (!isVisibleChange) {
      this.editor.get('chapter').setConfig(config)
      this.config = config
      return
    }
    this.doWithHistory(() => {
      const old = this.config
      this.editor.get('chapter').setConfig(config)
      this.config = config
      return () => {
        this.editor.get('chapter').setConfig(old)
        this.config = old
      }
    })
  }

  addChapter(): void {
    this.doWithHistory(() => {
      this.editor.discardSelection()
      return this.editor.add('chapter')
    })
  }

  deleteChapter(): void {
    this.doWithHistory(() => {
      this.editor.discardSelection()
      const undo = this.editor.del('chapter')
      this.updateChapter()
      return () => {
        undo()
        this.updateChapter()
      }
    })
  }

  cut(): void {
    this.execute({ type: 'cut' })
  }

  copy(): void {
    this.execute({ type: 'copy' })
  }

  paste(): void {
    this.execute({ type: 'paste' })
  }

  undo(): void {
    this.execute({ type: 'undo' })
  }

  redo(): void {
    this.execute({ type: 'redo' })
  }

  doWithHistory(op: () => UndoOp): void {
    this.history.do(op)
  }

  keyboardContext(playerActive: boolean): KeyboardContext {
    return {
      playerActive,
      isSelecting: this.editor.isSelecting,
      rhythmMode: this.editor.cursor.rhythmMode,
      sigimShow: this.sigimShow,
      tickIdx: this.tickIdx,
      imeComposing: this.ime.isComposing(),
      imeGrace: this.ime.grace,
    }
  }

  getKeyboardCommand(
    input: KeyboardInput,
    playerActive: boolean
  ): KeyboardCommand {
    return getKeyboardCommand(input, this.keyboardContext(playerActive))
  }

  executeKeyboardCommand(command: KeyboardCommand): void {
    executeEditorKeyboardCommand(this, command)
  }

  writeOctave(delta: 1 | -1): void {
    const main = this.editor.get('col').data.main
    const change = resolveOctaveChange(main, this.octave, delta)
    if (change.type === 'none') return
    this.octave = change.octave
    if (change.type === 'writeMain') this.write('main', change.main)
  }

  private replaceMusic(music: Music): void {
    this.music = music
    this.editor = this.music.getEditor()
    this.history = createEditorHistory(this.editor, () => {
      this.updateChapter()
      this.updateSympad()
      this.updateRhythm()
      this.hooks.requestFocus?.()
    })
    this.dragging = false
    this.updateChapter()
    this.updateRhythm()
    this.updateSympad()
    this.ime.reset()

    this.editor.cursor.on('afterColChange', () => {
      this.updateSympad()
      this.ime.reset()
      this.hooks.requestFocus?.()
    })
    this.editor.cursor.on('afterRowChange', () => this.updateRhythm())
    this.editor.cursor.on('afterChapterChange', () => this.updateChapter())
  }

  private updateSympad(): void {
    if (this.editor.cursor.rhythmMode) return
    const el = this.editor.get('col')
    this.sigimShow =
      !!el.data?.main &&
      ('pitch' in el.data.main || el.data.main.pitches.length === 1)
    this.trill = {}
    if (el.data?.modifier && el.data.modifier.trill) {
      this.trill = el.data.modifier.trill
    }
  }

  private updateRhythm(): void {
    if (this.editor.cursor.rhythmMode) {
      this.tickIdx = rhythmTickIndex(this.editor.currentRhythmTick())
    }
  }

  private updateChapter(): void {
    this.config = this.editor.get('chapter').config
  }
}
