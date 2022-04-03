<template>
  <div id="keypress">
    <menupanel
      :rhythmMode="editor.cursor.rhythmMode"
      :playing="player?.playing"
      :undoable="undoable"
      :redoable="redoable"
      @addchapter="addchapter"
      @play="play"
      @open="open"
      @save="save"
      @exportMidi="exportMidi"
      @undo="undo"
      @redo="redo"
      id="menubar"
    ></menupanel>
    <keypanel
      v-if="!player"
      :tickIdx="tickIdx"
      :rhythmMode="editor.cursor.rhythmMode"
      :sigimShow="sigimShow"
      :trillShow="trillShow"
      :scale="config.scale"
      :octave="octave"
      :trill="trill"
      @write="write"
      @erase="erase"
      @shapechange="shapechange"
      @octavechange="octavechange"
      @tickchange="tickchange"
      @trillchange="trillchange"
      id="keypanel"
    ></keypanel>
    <canvaspanel
      tabIndex="0"
      :aria-label="canvasLabel"
      :cursor="player?.cursor || editor.cursor"
      :gaks="gaks"
      @move="move"
      @moveRhythm="moveRhythm"
      id="workspace"
    ></canvaspanel>
  </div>
  <configmodal
    :config="config"
    @configchange="configchange"
    @deletechapter="deletechapter"
  ></configmodal>
  <initmodal :title="title" @init="create"></initmodal>
  <globalmodal
    :title="title"
    :instrument="instrument"
    @rename="rename"
  ></globalmodal>
</template>

<script lang="ts">
import { saveAs } from 'file-saver'
import { writeMidi } from 'midi-file'
import { defineComponent } from 'vue'
import { InstrumentName } from 'soundfont-player'

import keypanel from './components/keypanel.vue'
import menupanel from './components/menupanel.vue'
import canvaspanel from './components/canvaspanel.vue'

import initmodal from './components/initmodal.vue'
import globalmodal from './components/globalmodal.vue'
import configmodal from './components/configmodal.vue'

import Cursor, { CoordLevel } from './cursor'
import {
  Config,
  Chapter,
  Music,
  MusicEditor,
  MusicPlayer,
  UndoOp,
} from './music'
import IME from './ime'
import { querySymbol, TrillState } from './symbols'
import { RHYTHM_OBJ, YUL_OBJ, REST_OBJ } from './constants'
import { serializeMusic, deserializeMusic } from './serializer'
import { EntryOf } from './symbols'
import { convertToMidi } from './converter'
import { inRange, wrappedIdx } from './utils'

/**
 * Controller
 */
const INIT_CONFIG: Config = {
  name: '초장',
  tempo: 60,
  measure: 6,
  rhythm: ['떵', '', '따닥', '쿵', '더러러러', '따'],
  hideRhythm: false,
  scale: [0, 2, 5, 7, 9],
  padding: 0,
}
const MAX_HISTORY = 100
const PITCH2CODE = [
  'KeyG',
  'KeyE',
  'KeyX',
  'KeyU',
  'KeyR',
  'KeyW',
  'KeyB',
  'KeyD',
  'KeyL',
  'KeyS',
  'KeyA',
  'KeyM',
]

type UndoRecord = {
  undo: UndoOp
  redo: () => UndoOp
  oldCursor: Cursor
  newCursor: Cursor
}

export default defineComponent({
  data() {
    return {
      title: '',
      instrument: 'acoustic_grand_piano' as InstrumentName,
      music: undefined as unknown as Music,
      editor: undefined as unknown as MusicEditor,
      player: undefined as undefined | MusicPlayer,
      config: undefined as unknown as Config,
      sigimShow: false, // need update
      octave: 2,
      trill: {} as TrillState,
      tickIdx: -1,
      ime: new IME(),
      undoHistory: [] as Array<UndoRecord>,
      undoTravel: 0,
    }
  },
  methods: {
    create(title = '') {
      this.title = title
      const chapters = [new Chapter(INIT_CONFIG)]
      this.music = new Music(chapters)
      this.editor = this.music.getEditor()
      this.move(0, 0, 0, 0)
      this.write('main', YUL_OBJ[this.octave][0])
      this.editor.add('cell')
      this.init()
    },
    load(title: string, chapters: Chapter[], instrument: InstrumentName) {
      this.title = title
      this.instrument = instrument
      this.music = new Music(chapters)
      this.editor = this.music.getEditor()
      this.init()
    },
    init() {
      this.player = undefined
      this.undoHistory = []
      this.undoTravel = 0
      this.updateChapter()
      this.updateSympad()

      this.editor.cursor.on('afterColChange', () => {
        this.updateSympad()
        this.ime.reset()
      })
      this.editor.cursor.on('afterCellChange', () => this.updateRhythm())
      this.editor.cursor.on('afterChapterChange', () => this.updateChapter())
      this.editor.cursor.on('beforeCellChange', () => {
        if (!this.editor.cursor.rhythmMode) this.editor.trim()
      })
    },
    updateSympad() {
      if (this.editor.cursor.rhythmMode) return
      const el = this.editor.get('col')
      this.sigimShow =
        !!el.main?.pitch &&
        (typeof el.main.pitch === 'number' || el.main.pitch.length === 1)
      this.trill = {}
      if (el.modifier && el.modifier.trill) {
        this.trill = el.modifier.trill
      }
    },
    updateRhythm() {
      if (this.editor.cursor.rhythmMode)
        this.tickIdx = RHYTHM_OBJ.indexOf(
          this.config.rhythm[this.editor.cursor.cell]
        )
    },
    updateChapter() {
      this.config = this.editor.get('chapter').config
    },
    move(chapter: number, cell: number, row: number, col: number) {
      if (this.player != null) return
      this.editor.cursor.move(chapter, cell, row, col)
    },
    moveRhythm(chapter: number, cell: number) {
      if (this.player != null) return
      chapter = wrappedIdx(chapter, this.editor.getLength('music'))
      cell = wrappedIdx(cell, this.config.rhythm.length)
      this.editor.cursor.moveRhythm(chapter, cell)
      this.updateRhythm()
    },
    write<K extends keyof EntryOf>(
      where: K,
      obj?: EntryOf[K],
      resetIME = true
    ) {
      this.doWithBackup(() => {
        const el = { main: this.editor.get('col').main, [where]: obj }
        return this.editor.write('col', el)
      })
      if (resetIME) this.ime.reset()
    },
    erase() {
      this.doWithBackup(() => this.editor.erase())
      this.ime.reset()
    },
    writeIME(key: string, shiftKey: boolean) {
      if (shiftKey && !this.sigimShow) return
      const where = shiftKey ? 'modifier' : 'main'
      const obj = this.ime.update(key, shiftKey)
      this.write(where, obj, false)
    },
    shapechange(what: CoordLevel, delta: -1 | 1) {
      if (delta === +1) {
        this.doWithBackup(() => this.editor.add(what))
      } else {
        this.doWithBackup(() => this.editor.del(what))
      }
    },
    octavechange(delta: -1 | 1) {
      if (this.octave + delta < 0 || this.octave + delta > 4) return
      this.octave += delta
    },
    tickchange(tickIdx: number) {
      const oldtick = this.tickIdx
      this.doWithBackup(() => {
        this.tickIdx = tickIdx
        this.config.rhythm.splice(
          this.editor.cursor.cell,
          1,
          RHYTHM_OBJ[this.tickIdx]
        )
        return () => {
          this.tickIdx = oldtick
          this.config.rhythm.splice(
            this.editor.cursor.cell,
            1,
            RHYTHM_OBJ[this.tickIdx]
          )
        }
      })
    },
    trillchange(trill: TrillState) {
      let query = this.editor.get('col').modifier?.query
      if (query == null) return
      query = query.replace(/~/g, '')
      query = (trill.before ? '~' : '') + query + (trill.after ? '~' : '')
      this.write('modifier', querySymbol('modifier', query))
    },
    configchange(config: Config) {
      this.editor.get('chapter').setConfig(config)
      this.config = config
    },
    addchapter() {
      this.doWithBackup(() => this.editor.add('chapter'))
    },
    deletechapter() {
      this.doWithBackup(() => this.editor.del('chapter'))
    },
    async play(command: 'stop' | 'pause' | 'resume') {
      if (command === 'stop') {
        this.player?.stop()
        this.player = undefined
      } else if (command === 'pause') {
        this.player?.stop()
      } else if (command === 'resume') {
        this.player = this.player || this.editor.asPlayer()
        await this.player.play(this.instrument)
      }
      if (this.player?.finished) this.player = undefined
    },
    rename(title: string, instrument: InstrumentName) {
      this.title = title
      this.instrument = instrument
    },
    open(file: any) {
      // TODO: maybe warn user?
      const reader = new FileReader()
      reader.addEventListener('load', e => {
        const result = e.target?.result
        if (typeof result !== 'string') return
        const data = deserializeMusic(result) // TODO: handle error
        this.load(data.title, data.chapters, data.instrument)
      })
      reader.readAsText(file)
    },
    save() {
      const data = serializeMusic(this.title, this.music, this.instrument)
      const blob = new Blob([data], { type: 'text/x-yaml' })
      let filename =
        this.title.replace('\\s+', '-').replace('\\W+', '') + '.yaml'
      saveAs(blob, filename)
    },
    exportMidi() {
      const data = writeMidi(convertToMidi(this.music.getViewer()), {
        running: true,
      })
      const blob = new Blob([Uint8Array.from(data)], {
        type: 'audio/midi',
      })
      let filename =
        this.title.replace('\\s+', '-').replace('\\W+', '') + '.mid'
      saveAs(blob, filename)
    },
    doWithBackup(op: () => UndoOp) {
      /** op: a function that does the (re)-operation.
              takes zero args and returns undo function
       */
      this.undoHistory = this.undoHistory.slice(0, this.undoTravel)

      const oldCursor = this.editor.cursor.clone()
      const undo = op()
      const newCursor = this.editor.cursor.clone()
      this.updateSympad()
      this.undoHistory.push({ undo, redo: op, oldCursor, newCursor })
      this.undoTravel += 1

      if (this.undoTravel > MAX_HISTORY) {
        this.undoHistory = this.undoHistory.slice(-MAX_HISTORY)
        this.undoTravel = MAX_HISTORY
      }
    },
    undo() {
      this.ime.reset()
      if (this.undoTravel === 0) return
      this.undoTravel -= 1
      const { undo, newCursor } = this.undoHistory[this.undoTravel]
      this.editor.cursor.moveTo(newCursor)
      undo()
      this.updateSympad()
    },
    redo() {
      this.ime.reset()
      if (this.undoTravel >= this.undoHistory.length) return
      const { redo, oldCursor } = this.undoHistory[this.undoTravel]
      this.editor.cursor.moveTo(oldCursor)
      redo()
      this.updateSympad()
      this.undoTravel += 1
    },
    keypressNavHandler(e: KeyboardEvent) {
      if (this.player) return
      const isRhythm = this.editor.cursor.rhythmMode
      switch (e.code) {
        /* Navigation */
        case 'ArrowUp':
          this.editor.moveUpDown('up')
          break
        case 'ArrowDown':
          this.editor.moveUpDown('down')
          break
        case 'ArrowLeft':
          this.editor.moveLeftRight('left')
          break
        case 'ArrowRight':
          this.editor.moveLeftRight('right')
          break
        /* Editing */
        case 'Space':
          if (isRhythm) return
          this.doWithBackup(() => this.editor.colbreak())
          break
        case 'Enter':
        case 'NumpadEnter':
          if (isRhythm) return // TODO
          if (e.shiftKey) {
            this.doWithBackup(() => this.editor.rowbreak())
          } else if (e.ctrlKey) {
            this.doWithBackup(() => this.editor.chapterbreak())
          } else {
            this.doWithBackup(() => this.editor.cellbreak())
          }
          break
        default:
          return
      }
      e.preventDefault()
    },
    keypressRhythmHandler(e: KeyboardEvent) {
      switch (e.code) {
        case 'Backspace':
        case 'Delete':
          this.tickchange(-1)
          break
        default:
          const prefix = e.code.slice(0, -1)
          if (prefix === 'Digit' || prefix === 'Numpad') {
            const idx = +e.code.slice(-1) - 1
            if (hasNoModifierKey(e) && inRange(idx, RHYTHM_OBJ.length)) {
              this.tickchange(idx)
              break
            }
          }
          return
      }
      e.preventDefault()
    },
    keypressHandler(e: KeyboardEvent) {
      if (this.player) return
      if (this.editor.cursor.rhythmMode) return this.keypressRhythmHandler(e)

      switch (e.code) {
        case 'Home':
          e.ctrlKey ? this.editor.move('chapter', 0, 0) : this.editor.moveHome()
          break
        case 'End':
          e.ctrlKey
            ? this.editor.move('chapter', -1, -1)
            : this.editor.moveEnd()
          break
        /* Editing */
        case 'Backspace':
          if (this.ime.isComposing()) {
            const where = this.ime.grace ? 'modifier' : 'main'
            const obj = this.ime.backspace()
            this.write(where, obj, false)
          } else {
            this.doWithBackup(() => this.editor.backspace())
          }
          break
        case 'Minus':
        case 'NumpadSubtract':
          if (hasShiftKeyOnly(e)) {
            this.write('modifier', undefined)
          } else if (hasNoModifierKey(e)) {
            this.erase()
          }
          return
        case 'Delete':
          this.doWithBackup(() => this.editor.deletekey())
          return
        case 'Slash':
          this.octavechange(-1)
          break
        case 'Semicolon':
          this.octavechange(+1)
          return
        case 'Comma':
          this.write('main', REST_OBJ)
          return
        case 'Equal':
          if (e.ctrlKey || e.altKey || e.metaKey) return
          if (!this.sigimShow) return
          this.writeIME(e.code, true)
          break
        case 'Backquote':
        case 'KeyH':
        case 'KeyI':
          if (!hasShiftKeyOnly(e)) return
          if (!this.sigimShow) return
          this.writeIME(e.code, true)
          break
        default:
          const prefix = e.code.slice(0, -1)
          if (prefix === 'Digit' || prefix === 'Numpad') {
            if (!(hasNoModifierKey(e) || hasShiftKeyOnly(e))) return
            this.writeIME(e.code.slice(-1), e.shiftKey)
            break
          }

          let idxPitch = PITCH2CODE.indexOf(e.code)
          if (idxPitch !== -1) {
            if (!(hasNoModifierKey(e) || hasShiftKeyOnly(e))) return
            let octave = this.octave + (e.shiftKey ? 1 : 0) // TODO: maybe upto editor settings
            this.write('main', YUL_OBJ[octave][idxPitch])
            break
          }

          if (e.ctrlKey && e.code === 'KeyZ') {
            if (e.shiftKey) this.redo()
            else this.undo()
            break
          }
          return
      }
      e.preventDefault()
    },
  },
  computed: {
    gaks() {
      return (this as any).music.asGaks() // ??
    },
    undoable(): boolean {
      return this.player == null && this.undoTravel > 0
    },
    redoable(): boolean {
      return this.player == null && this.undoTravel < this.undoHistory.length
    },
    trillShow(): TrillState {
      return {
        before: this.trill && this.trill.before != null,
        after: this.trill && this.trill.after != null,
      }
    },
    canvasLabel(): string {
      if (this.player) return ''
      const chapterName = this.config.name
      if (this.editor.cursor.rhythmMode) {
        return (
          `${chapterName} 장단 ${this.editor.cursor.cell + 1}번째 정간, ` +
          this.config.rhythm[this.editor.cursor.cell]
        )
      }

      let pos = this.editor.cursor.cell
      const gak = Math.floor((pos + this.config.padding) / this.config.measure)
      if (gak > 0) pos = (pos + this.config.padding) % this.config.measure

      const numRows = this.editor.getLength('cell')
      const numCols = this.editor.getLength('row')
      const col = this.editor.get('col')
      const main = col.main?.label ?? '빈칸'
      const modifier = col.modifier?.label ?? ''
      return (
        `${chapterName} ${gak + 1}각 ${pos + 1}번째 정간, ` +
        `${numRows}행 중 ${this.editor.cursor.row + 1}행, ` +
        `${numCols}열 중 ${this.editor.cursor.col + 1}열, ` +
        `${main} ${modifier}`
      )
    },
  },
  created() {
    this.create('새 곡')
  },
  mounted() {
    document
      .getElementById('keypress')
      ?.addEventListener('keydown', this.keypressHandler)
    document
      .getElementById('workspace')
      ?.addEventListener('keydown', this.keypressNavHandler)
  },
  components: {
    keypanel,
    menupanel,
    canvaspanel,

    initmodal,
    globalmodal,
    configmodal,
  },
})

function hasNoModifierKey(e: KeyboardEvent) {
  return !(e.ctrlKey || e.shiftKey || e.altKey || e.metaKey)
}
function hasShiftKeyOnly(e: KeyboardEvent) {
  return !e.ctrlKey && e.shiftKey && !e.altKey && !e.metaKey
}
</script>

<style>
#keypanel {
  position: fixed;
  bottom: 0;
  background: black;
  z-index: 10;
}

#menubar {
  position: fixed;
  top: 0;
  background: black;
  z-index: 9;
}

#workspace {
  overflow: hidden;
  background: white;
  padding: 1rem;
  margin: 4rem 2rem 2rem 2rem;
}
</style>
