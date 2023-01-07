<template>
  <div id="keypress">
    <menupanel
      :rhythmMode="editor.cursor.rhythmMode"
      :playing="player?.playing"
      :undoable="undoable"
      :redoable="redoable"
      :pastable="pastable"
      @addchapter="addchapter"
      @play="play"
      @open="open"
      @save="save"
      @exportMidi="exportMidi"
      @cut="cut"
      @copy="copy"
      @paste="paste"
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
      :anchor="player ? undefined : editor.anchor"
      :gaks="gaks"
      @moveTo="moveTo"
      @selectTo="selectTo"
      @click="discardSelection"
      id="workspace"
    ></canvaspanel>
  </div>
  <configmodal
    :config="config"
    @configchange="configchange"
    @deletechapter="deletechapter"
  ></configmodal>
  <initmodal :title="music.title" @init="create"></initmodal>
  <globalmodal
    :title="music.title"
    :instrument="music.instrument"
    @rename="rename"
  ></globalmodal>
</template>

<script lang="ts">
import { saveAs } from 'file-saver'
import { writeMidi } from 'midi-file'
import { InstrumentName } from 'soundfont-player'
import { defineComponent } from 'vue'

import canvaspanel from './components/canvaspanel.vue'
import keypanel from './components/keypanel.vue'
import menupanel from './components/menupanel.vue'

import configmodal from './components/configmodal.vue'
import globalmodal from './components/globalmodal.vue'
import initmodal from './components/initmodal.vue'

import { REST_OBJ, RHYTHM_OBJ, YUL_OBJ } from './constants'
import Cursor, { CoordLevel } from './cursor'
import { Music, MusicEditor } from './editor'
import { IME } from './ime'
import { convertToMidi } from './midi'
import { MusicPlayer } from './player'
import { deserializeMusic, serializeMusic } from './serializer'
import { EntryOf, querySymbol, TrillState } from './symbols'
import { getID, inRange, wrappedIdx } from './utils'
import { Chapter, Config, Entry, UndoOp } from './viewer'

/**
 * Controller
 */
const INIT_CONFIG: Config = {
  name: '초장',
  tempo: 60,
  measure: 6,
  rhythm: [['떵'], [''], ['따닥'], ['쿵'], ['더러러러'], ['따']],
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
  oldAnchor?: Cursor
  newAnchor?: Cursor
}

export default defineComponent({
  data() {
    return {
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
      clipboard: undefined as
        | undefined
        | ['Entry', Entry]
        | ['Range', Entry[][][]],
    }
  },
  methods: {
    create(title = '') {
      const chapters = [new Chapter(INIT_CONFIG)]
      this.music = new Music(title, chapters)
      this.editor = this.music.getEditor()
      this.init()

      this.editor.cursor.move(0, 0, 0, 0)
      this.write('main', YUL_OBJ[this.octave][0])
      this.editor.add('cell')
      this.editor.stepCol(-1)
    },
    load(music: Music) {
      this.music = music
      this.editor = this.music.getEditor()
      this.init()
    },
    init() {
      this.player = undefined
      this.undoHistory = []
      this.undoTravel = 0
      this.updateChapter()
      this.updateSympad()
      this.ime.reset()

      this.editor.cursor.on('afterColChange', () => {
        this.updateSympad()
        this.ime.reset()
      })
      this.editor.cursor.on('afterRowChange', () => this.updateRhythm())
      this.editor.cursor.on('afterChapterChange', () => this.updateChapter())
    },
    updateSympad() {
      if (this.editor.cursor.rhythmMode) return
      const el = this.editor.get('col')
      this.sigimShow =
        !!el.data?.main?.pitch &&
        (typeof el.data.main.pitch === 'number' ||
          el.data.main.pitch.length === 1)
      this.trill = {}
      if (el.data?.modifier && el.data.modifier.trill) {
        this.trill = el.data.modifier.trill
      }
    },
    updateRhythm() {
      if (this.editor.cursor.rhythmMode)
        this.tickIdx = RHYTHM_OBJ.indexOf(
          this.config.rhythm[this.editor.cursor.cell][this.editor.cursor.row]
        )
    },
    updateChapter() {
      this.config = this.editor.get('chapter').config
    },
    moveTo(coord: Cursor) {
      if (this.player != null) return
      this.editor.discardSelection()
      this.editor.cursor.moveTo(coord)
    },
    selectTo(coord: Cursor) {
      if (this.player != null) return
      if (this.editor.cursor.rhythmMode || coord.rhythmMode)
        this.editor.discardSelection()
      else if (!this.editor.isSelecting) this.editor.createSelection()
      this.editor.cursor.moveTo(coord)
      this.editor.normalizeSelection()
    },
    discardSelection() {
      this.editor.discardSelection()
    },
    write<K extends keyof EntryOf>(
      where: K,
      obj?: EntryOf[K],
      resetIME = true
    ) {
      if (this.editor.isSelecting) return
      this.doWithBackup(() => {
        const el = {
          id: getID(),
          data: { main: this.editor.get('col').data?.main, [where]: obj },
        }
        return this.editor.write('col', el)
      })
      if (resetIME) this.ime.reset()
    },
    erase() {
      if (this.editor.isSelecting) return
      this.doWithBackup(() => this.editor.erase())
      this.ime.reset()
    },
    writeIME(key: string, shiftKey: boolean) {
      if (this.editor.isSelecting) return
      if (shiftKey && !this.sigimShow) return
      const where = shiftKey ? 'modifier' : 'main'
      const obj = this.ime.update(key, shiftKey)
      this.write(where, obj, false)
    },
    shapechange(what: CoordLevel, delta: -1 | 1) {
      if (this.editor.isSelecting) return
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
        this.config.rhythm[this.editor.cursor.cell].splice(
          this.editor.cursor.row,
          1,
          RHYTHM_OBJ[this.tickIdx]
        )
        return () => {
          this.tickIdx = oldtick
          this.config.rhythm[this.editor.cursor.cell].splice(
            this.editor.cursor.row,
            1,
            RHYTHM_OBJ[this.tickIdx]
          )
        }
      })
    },
    trillchange(trill: TrillState) {
      let query = this.editor.get('col').data?.modifier?.query
      if (query == null) return
      query = query.replace(/~/g, '')
      query = (trill.before ? '~' : '') + query + (trill.after ? '~' : '')
      this.write('modifier', querySymbol('modifier', query))
    },
    configchange(config: Config, isVisibleChange: boolean) {
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
    },
    addchapter() {
      this.doWithBackup(() => {
        this.editor.discardSelection()
        return this.editor.add('chapter')
      })
    },
    deletechapter() {
      this.doWithBackup(() => {
        this.editor.discardSelection()
        const undo = this.editor.del('chapter')
        this.updateChapter()
        return () => {
          undo()
          this.updateChapter()
        }
      })
    },
    cut() {
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
    },
    copy() {
      this.clipboard = this.editor.copy()
    },
    paste() {
      if (this.clipboard == null) return
      const [mode, content] = this.clipboard
      this.doWithBackup(() =>
        mode === 'Entry'
          ? this.editor.pasteEntry(content)
          : this.editor.pasteRange(content)
      )
    },
    async play(command: 'stop' | 'pause' | 'resume') {
      if (command === 'stop') {
        this.player?.stop()
        this.player = undefined
      } else if (command === 'pause') {
        this.player?.stop()
      } else if (command === 'resume') {
        this.player = this.player || MusicPlayer.fromMusicViewer(this.editor)
        await this.player.play()
      }
      if (this.player?.finished) this.player = undefined
    },
    rename(title: string, instrument: InstrumentName) {
      this.music.title = title
      this.music.instrument = instrument
    },
    open(file: any) {
      // TODO: maybe warn user?
      const reader = new FileReader()
      reader.addEventListener('load', e => {
        const result = e.target?.result
        if (typeof result !== 'string') return
        const music = deserializeMusic(result) // TODO: handle error
        this.load(music)
      })
      reader.readAsText(file)
    },
    save() {
      const data = serializeMusic(this.music)
      const blob = new Blob([data], { type: 'text/x-yaml' })
      let filename =
        this.music.title.replace('\\s+', '-').replace('\\W+', '') + '.yaml'
      saveAs(blob, filename)
    },
    exportMidi() {
      const data = writeMidi(convertToMidi(this.music.getPlayer()), {
        running: true,
      })
      const blob = new Blob([Uint8Array.from(data)], {
        type: 'audio/midi',
      })
      let filename =
        this.music.title.replace('\\s+', '-').replace('\\W+', '') + '.mid'
      saveAs(blob, filename)
    },
    doWithBackup(op: () => UndoOp) {
      /** op: a function that does the (re)-operation.
              takes zero args and returns undo function
       */
      this.undoHistory = this.undoHistory.slice(0, this.undoTravel)

      const oldCursor = this.editor.cursor.clone()
      const oldAnchor = this.editor.anchor?.clone()
      const undo = op()
      const newCursor = this.editor.cursor.clone()
      const newAnchor = this.editor.anchor?.clone()
      this.updateSympad()
      this.undoHistory.push({
        undo,
        redo: op,
        oldCursor,
        newCursor,
        oldAnchor,
        newAnchor,
      })
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
      const { undo, oldCursor, oldAnchor, newCursor, newAnchor } =
        this.undoHistory[this.undoTravel]
      this.editor.anchor = newAnchor
      this.editor.cursor.moveTo(newCursor)
      undo()
      this.editor.anchor = oldAnchor
      this.editor.cursor.moveTo(oldCursor)
      this.updateSympad()
    },
    redo() {
      this.ime.reset()
      if (this.undoTravel >= this.undoHistory.length) return
      const { redo, oldCursor, oldAnchor } = this.undoHistory[this.undoTravel]
      this.editor.anchor = oldAnchor
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
          if (!e.shiftKey) this.editor.discardSelection()
          else if (!this.editor.isSelecting) this.editor.createSelection()

          this.editor.moveUpDown('up')
          break
        case 'ArrowDown':
          if (!e.shiftKey) this.editor.discardSelection()
          else if (!this.editor.isSelecting) this.editor.createSelection()

          this.editor.moveUpDown('down')
          break
        case 'ArrowLeft':
          if (!e.shiftKey) this.editor.discardSelection()
          else if (!this.editor.isSelecting) this.editor.createSelection()

          this.editor.moveLeftRight('left')
          break
        case 'ArrowRight':
          if (!e.shiftKey) this.editor.discardSelection()
          else if (!this.editor.isSelecting) this.editor.createSelection()

          this.editor.moveLeftRight('right')
          break
        /* Editing */
        case 'Space':
          if (isRhythm) {
            const tickIdx = this.tickIdx + (e.shiftKey ? -1 : +1)
            this.tickchange(wrappedIdx(tickIdx, RHYTHM_OBJ.length))
            break
          }
          if (this.editor.isSelecting) return
          this.doWithBackup(() => this.editor.colbreak())
          break
        case 'Enter':
        case 'NumpadEnter':
          if (isRhythm) {
            if (!e.shiftKey) return
            this.doWithBackup(() => {
              const rows = this.config.rhythm[this.editor.cursor.cell]
              rows.splice(this.editor.cursor.row + 1, 0, '')
              this.editor.moveRhythm('row', this.editor.cursor.row + 1)
              return () => {
                this.editor.moveRhythm('row', this.editor.cursor.row - 1)
                const rows = this.config.rhythm[this.editor.cursor.cell]
                rows.splice(this.editor.cursor.row + 1, 1)
              }
            })
            return
          }
          if (this.editor.isSelecting) return
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
          if (this.tickIdx !== -1) {
            this.tickchange(-1)
            break
          }
          const delta = e.code === 'Backspace' ? -1 : 0
          const rows = this.config.rhythm[this.editor.cursor.cell]
          if (!inRange(this.editor.cursor.row + delta, rows.length - 1)) break
          this.doWithBackup(() => {
            const old = rows.splice(this.editor.cursor.row, 1)[0]
            this.editor.moveRhythm('row', this.editor.cursor.row + delta)
            return () => {
              this.editor.moveRhythm('row', this.editor.cursor.row - delta)
              const rows = this.config.rhythm[this.editor.cursor.cell]
              rows.splice(this.editor.cursor.row, 0, old)
            }
          })
          break
        default:
          const prefix = e.code.slice(0, -1)
          if (prefix === 'Digit' || prefix === 'Numpad') {
            const idx = +e.code.slice(-1) - 1
            if (!hasModifierKey(e) && inRange(idx, RHYTHM_OBJ.length)) {
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
        case 'Escape':
          this.editor.discardSelection()
          return
        case 'Home':
          if (!e.shiftKey) this.editor.discardSelection()
          else if (!this.editor.isSelecting) this.editor.createSelection()
          e.ctrlKey ? this.editor.move('chapter', 0, 0) : this.editor.moveHome()
          break
        case 'End':
          if (!e.shiftKey) this.editor.discardSelection()
          else if (!this.editor.isSelecting) this.editor.createSelection()
          e.ctrlKey
            ? this.editor.move('chapter', -1, -1)
            : this.editor.moveEnd()
          break
        /* Editing */
        case 'Backspace':
          if (this.editor.isSelecting) {
            this.doWithBackup(() => this.editor.cutRange()[1])
          } else if (this.ime.isComposing()) {
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
            if (this.editor.isSelecting) return
            this.write('modifier', undefined)
          } else if (!hasModifierKey(e)) {
            if (this.editor.isSelecting) {
              this.doWithBackup(() => this.editor.cutRange()[1])
            } else {
              this.erase()
            }
          }
          return
        case 'Delete':
          if (this.editor.isSelecting) {
            this.doWithBackup(() => this.editor.cutRange()[1])
          } else {
            this.doWithBackup(() => this.editor.deletekey())
          }
          return
        case 'Slash':
          this.octavechange(-1)
          break
        case 'Semicolon':
          this.octavechange(+1)
          return
        case 'Comma':
          if (this.editor.isSelecting) return
          this.write('main', REST_OBJ)
          return
        case 'Equal':
          if (e.ctrlKey || e.altKey || e.metaKey) return
          if (!this.sigimShow) return
          if (this.editor.isSelecting) return
          this.writeIME(e.code, true)
          break
        case 'Backquote':
        case 'KeyH':
        case 'KeyI':
          if (!hasShiftKeyOnly(e)) return
          if (!this.sigimShow) return
          if (this.editor.isSelecting) return
          this.writeIME(e.code, true)
          break
        default:
          const prefix = e.code.slice(0, -1)
          if (prefix === 'Digit' || prefix === 'Numpad') {
            if (this.editor.isSelecting) return
            if (hasModifierKey(e) && !hasShiftKeyOnly(e)) return
            this.writeIME(e.code.slice(-1), e.shiftKey)
            break
          }

          if (e.ctrlKey) {
            if (e.code === 'KeyZ') {
              if (e.shiftKey) this.redo()
              else this.undo()
            } else if (e.code === 'KeyA' && hasCtrlKeyOnly(e)) {
              this.editor.selectAll()
            } else if (e.code === 'KeyX' && hasCtrlKeyOnly(e)) {
              this.cut()
            } else if (e.code === 'KeyC' && hasCtrlKeyOnly(e)) {
              this.copy()
            } else if (e.code === 'KeyV' && hasCtrlKeyOnly(e)) {
              this.paste()
            }
            break
          }

          if (hasModifierKey(e) && !hasShiftKeyOnly(e)) return
          let idxPitch = PITCH2CODE.indexOf(e.code)
          if (idxPitch !== -1) {
            if (this.editor.isSelecting) return
            let octave = this.octave + (e.shiftKey ? 1 : 0) // TODO: maybe upto editor settings
            this.write('main', YUL_OBJ[octave][idxPitch])
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
    pastable(): boolean {
      if (this.clipboard == null) return false
      const mode = this.clipboard[0]
      if (mode === 'Range') return true
      if (!this.editor.isSelecting) return true
      return (
        this.editor.anchor?.chapter === this.editor.cursor.chapter &&
        this.editor.anchor?.cell === this.editor.cursor.cell
      )
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
          this.config.rhythm[this.editor.cursor.cell] +
          `, ${chapterName} 장단 ${this.editor.cursor.cell + 1}번째 정간`
        )
      }

      let pos = this.editor.cursor.cell
      const gak = Math.floor((pos + this.config.padding) / this.config.measure)
      if (gak > 0) pos = (pos + this.config.padding) % this.config.measure

      const numRows = this.editor.get('cell').data.length
      const numCols = this.editor.get('row').data.length
      const col = this.editor.get('col')
      const main = col.data?.main?.label ?? '빈칸'
      const modifier = col.data?.modifier?.label ?? ''
      return (
        `${main} ${modifier}, ` +
        `${chapterName} ${gak + 1}각 ${pos + 1}번째 정간, ` +
        `${numRows}행 중 ${this.editor.cursor.row + 1}행, ` +
        `${numCols}열 중 ${this.editor.cursor.col + 1}열`
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

function hasModifierKey(e: KeyboardEvent) {
  return e.ctrlKey || e.shiftKey || e.altKey || e.metaKey
}
function hasCtrlKeyOnly(e: KeyboardEvent) {
  return e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey
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
