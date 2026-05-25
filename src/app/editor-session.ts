import type { InstrumentName } from 'soundfont-player'

import {
  REST_OBJ,
  RHYTHM_OBJ,
  rhythmTickIndex,
  YUL_OBJ,
} from '../domain/constants'
import Cursor, { CoordLevel } from '../domain/cursor'
import { Music, MusicEditor } from '../domain/editor'
import type { EntryOf, TrillState } from '../domain/symbols'
import { Chapter, Config, UndoOp } from '../domain/viewer'
import {
  moveCanvasCursor,
  selectCanvasRange,
  startCanvasDrag,
} from '../features/canvas-selection'
import { canPaste, type ClipboardData } from '../features/clipboard'
import { getEntryWriteUndo } from '../features/entry-write'
import { ActionHistory } from '../features/history'
import { IME } from '../features/ime'
import { resolveImeWrite } from '../features/ime-write'
import {
  getKeyboardCommand,
  type KeyboardCommand,
  type KeyboardContext,
  type KeyboardInput,
} from '../features/keyboard'
import { getKeyboardEditUndo } from '../features/keyboard-edit'
import { executeKeyboardNavigation } from '../features/keyboard-navigation'
import { resolveOctaveChange } from '../features/octave'
import { applyModifierTrill } from '../features/trill'

const INIT_CONFIG: Config = {
  name: '초장',
  tempo: 60,
  measure: [6],
  rhythm: [['떵'], [''], ['기덕'], ['쿵'], ['더러러러'], ['더']],
  hideRhythm: false,
  scale: [0, 2, 5, 7, 9],
  padding: 0,
}
const MAX_HISTORY = 100

type HistoryState = {
  cursor: Cursor
  anchor: Cursor | undefined
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
  history!: ActionHistory<HistoryState>
  clipboard: ClipboardData | undefined
  private dragging = false

  constructor(private readonly hooks: EditorSessionHooks = {}) {
    this.create('새 곡')
  }

  create(title = ''): void {
    this.replaceMusic(new Music(title, [new Chapter(INIT_CONFIG)]))

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

  get redoable(): boolean {
    return this.history.redoable
  }

  get pastable(): boolean {
    return canPaste(
      this.clipboard,
      this.editor.isSelecting,
      this.editor.anchor,
      this.editor.cursor
    )
  }

  get trillShow(): TrillState {
    return {
      before: this.trill && this.trill.before != null,
      after: this.trill && this.trill.after != null,
    }
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

  write<K extends keyof EntryOf>(
    where: K,
    obj?: EntryOf[K],
    resetIME = true
  ): void {
    const op = getEntryWriteUndo(this.editor, where, obj)
    if (op == null) return
    this.doWithBackup(op)
    if (resetIME) this.ime.reset()
  }

  erase(): void {
    if (this.editor.isSelecting) return
    if (this.editor.cursor.rhythmMode) {
      this.doWithBackup(() => this.editor.eraseRhythmTick())
    } else {
      this.doWithBackup(() => this.editor.erase())
      this.ime.reset()
    }
  }

  shapechange(what: CoordLevel, delta: -1 | 1): void {
    if (this.editor.isSelecting) return
    if (delta === +1) this.doWithBackup(() => this.editor.add(what))
    else this.doWithBackup(() => this.editor.del(what))
  }

  octavechange(delta: -1 | 1): void {
    if (this.octave + delta < -3 || this.octave + delta > 3) return
    this.octave += delta
  }

  tickchange(tickIdx: number): void {
    this.doWithBackup(() => this.editor.writeRhythmTick(RHYTHM_OBJ[tickIdx]))
  }

  trillchange(trill: TrillState): void {
    const modifier = applyModifierTrill(
      this.editor.get('col').data?.modifier,
      trill
    )
    if (modifier != null) this.write('modifier', modifier)
  }

  configchange(config: Config, isVisibleChange: boolean): void {
    if (!isVisibleChange) {
      this.editor.get('chapter').setConfig(config)
      this.config = config
      return
    }
    this.doWithBackup(() => {
      const old = this.config
      this.editor.get('chapter').setConfig(config)
      this.config = config
      return () => {
        this.editor.get('chapter').setConfig(old)
        this.config = old
      }
    })
  }

  addchapter(): void {
    this.doWithBackup(() => {
      this.editor.discardSelection()
      return this.editor.add('chapter')
    })
  }

  deletechapter(): void {
    this.doWithBackup(() => {
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
    this.doWithBackup(() => {
      if (this.editor.isSelecting) {
        const [content, undo] = this.editor.cutRange()
        this.clipboard = ['Range', content]
        return undo
      } else {
        const [content, undo] = this.editor.cutEntry()
        this.clipboard = ['Entry', content]
        return undo
      }
    })
  }

  copy(): void {
    this.clipboard = this.editor.copy()
  }

  paste(): void {
    if (this.clipboard == null) return
    const [mode, content] = this.clipboard
    this.doWithBackup(() =>
      mode === 'Entry'
        ? this.editor.pasteEntry(content)
        : this.editor.pasteRange(content)
    )
  }

  undo(): void {
    this.ime.reset()
    this.history.undo()
  }

  redo(): void {
    this.ime.reset()
    this.history.redo()
  }

  doWithBackup(op: () => UndoOp): void {
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
    switch (command.type) {
      case 'ignore':
        return
      case 'moveUpDown':
      case 'moveLeftRight':
      case 'discardSelection':
      case 'home':
      case 'end':
        executeKeyboardNavigation(command, this.editor, this.config)
        return
      case 'shapeChange':
        this.shapechange(command.what, command.delta)
        return
      case 'backspaceSelection':
      case 'backspace':
      case 'deleteSelection':
      case 'deleteForward':
      case 'cutSelection':
        this.doWithBackup(getKeyboardEditUndo(command, this.editor))
        return
      case 'eraseRhythmTick':
        this.erase()
        return
      case 'deleteRhythmRow':
        this.shapechange('row', -1)
        return
      case 'imeBackspace':
        this.write(command.where, this.ime.backspace(), false)
        return
      case 'eraseModifier':
        this.write('modifier', undefined)
        return
      case 'eraseEntry':
        this.erase()
        return
      case 'paste':
        this.paste()
        return
      case 'copy':
        this.copy()
        return
      case 'octave':
        this.writeOctave(command.delta)
        return
      case 'writeRest':
        this.write('main', REST_OBJ)
        return
      case 'writeIme':
        this.writeIME(command.key, command.shiftKey)
        return
      case 'writeRhythmTick':
        this.tickchange(command.tickIdx)
        return
      case 'undo':
        this.undo()
        return
      case 'redo':
        this.redo()
        return
      case 'selectAll':
        this.editor.selectAll()
        return
      case 'cut':
        this.cut()
        return
      case 'writePitch':
        this.write('main', YUL_OBJ[this.octave + 3][command.pitchIdx])
        return
    }
  }

  writeIME(key: string, shiftKey: boolean): void {
    const write = resolveImeWrite(this.ime, {
      key,
      shiftKey,
      isSelecting: this.editor.isSelecting,
      sigimShow: this.sigimShow,
    })
    if (write.type === 'write') this.write(write.where, write.entry, false)
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
    this.history = this.createHistory()
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

  private createHistory(): ActionHistory<HistoryState> {
    return new ActionHistory(
      () => ({
        cursor: this.editor.cursor.clone(),
        anchor: this.editor.anchor?.clone(),
      }),
      state => {
        this.editor.anchor = state.anchor?.clone()
        this.editor.cursor.moveTo(state.cursor)
      },
      () => {
        this.updateSympad()
        this.updateRhythm()
        this.hooks.requestFocus?.()
      },
      MAX_HISTORY
    )
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
