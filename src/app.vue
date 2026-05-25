<template>
  <b-app>
    <menupanel
      :rhythm-mode="editor.cursor.rhythmMode"
      :playing="player?.playing"
      :undoable="undoable"
      :redoable="redoable"
      :pastable="pastable"
      @add-chapter="addchapter"
      @play="play"
      @open="open"
      @save="save"
      @export-midi="exportMidi"
      @cut="cut"
      @copy="copy"
      @paste="paste"
      @undo="undo"
      @redo="redo"
      id="menubar"
    ></menupanel>
    <keypanel
      v-if="!player"
      :tick-idx="tickIdx"
      :rhythm-mode="editor.cursor.rhythmMode"
      :sigim-show="sigimShow"
      :trill-show="trillShow"
      :scale="config.scale"
      :octave="octave"
      :trill="trill"
      @write="write"
      @erase="erase"
      @shape-change="shapechange"
      @octave-change="octavechange"
      @tick-change="tickchange"
      @trill-change="trillchange"
      id="keypanel"
    ></keypanel>
    <div
      id="workspace"
      tabindex="0"
      :aria-label="workspaceLabel"
      aria-describedby="workspace-help canvas-status"
      :aria-keyshortcuts="workspaceKeyShortcuts"
    >
      <b-overlay :show="busy" variant="dark">
        <canvaspanel
          :title="music.title"
          :cursor="player?.cursor || editor.cursor"
          :anchor="player ? undefined : editor.anchor"
          :gaks="gaks"
          @move-to="moveTo"
          @select-to="selectTo"
          @pointer-down="pointerDown"
          @pointer-over="pointerOver"
        ></canvaspanel>
      </b-overlay>
    </div>
    <div id="workspace-help" class="visually-hidden">
      {{ workspaceHelp }}
    </div>
    <div
      id="canvas-status"
      class="visually-hidden"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {{ canvasLabel }}
    </div>
    <configmodal
      :config="config"
      @config-change="configchange"
      @delete-chapter="deletechapter"
      @keydown.stop
    ></configmodal>
    <initmodal :title="music.title" @init="create" @keydown.stop></initmodal>
    <globalmodal
      :title="music.title"
      :instrument="music.instrument"
      @rename="rename"
      @keydown.stop
    ></globalmodal>
    <b-alert
      v-model="loadingFailed"
      class="position-fixed fixed-top me-0"
      style="z-index: 1000"
      variant="warning"
      dismissible
    >
      파일을 열지 못했습니다. 문제가 계속되는 경우
      <b-link href="https://github.com/Tteoieonire/Jeonggan/issues/new/choose"
        >게시판</b-link
      >
      또는 메일(<b-link
        href="mailto:ieay4a@gmail.com?subject=[정간보]%20파일%20열기%20문제%20문의"
        >ieay4a@gmail.com</b-link
      >)로 문의 주세요.
    </b-alert>
  </b-app>
</template>

<script lang="ts">
import { saveAs } from 'file-saver'
import { writeMidi } from 'midi-file'
import { InstrumentName } from 'soundfont-player'
import { defineComponent, nextTick } from 'vue'

import canvaspanel from './components/canvaspanel.vue'
import keypanel from './components/keypanel.vue'
import menupanel from './components/menupanel.vue'

import configmodal from './components/configmodal.vue'
import globalmodal from './components/globalmodal.vue'
import initmodal from './components/initmodal.vue'

import { makeCanvasLabel } from './canvas-label'
import { REST_OBJ, RHYTHM_OBJ, rhythmTickIndex, YUL_OBJ } from './constants'
import Cursor, { CoordLevel } from './cursor'
import { makeMidiDownload, makeYamlDownload } from './download'
import { Music, MusicEditor } from './editor'
import { ActionHistory } from './history'
import { IME } from './ime'
import { convertToMidi } from './midi'
import { MusicPlayer } from './player'
import { deserializeMusic, serializeMusic } from './serializer'
import { EntryOf, querySymbol, TrillState } from './symbols'
import { getID, inRange } from './utils'
import { Chapter, Config, Entry, mergeActions, UndoOp } from './viewer'
import {
  WORKSPACE_HELP,
  WORKSPACE_LABEL,
  workspaceKeyShortcuts as formatWorkspaceKeyShortcuts,
} from './workspace-accessibility'

/**
 * Controller
 */
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

type HistoryState = {
  cursor: Cursor
  anchor?: Cursor
}

export default defineComponent({
  data() {
    return {
      dragging: false,
      music: undefined as unknown as Music,
      editor: undefined as unknown as MusicEditor,
      player: undefined as undefined | MusicPlayer,
      config: undefined as unknown as Config,
      sigimShow: false, // need update
      octave: 0,
      trill: {} as TrillState,
      tickIdx: -1,
      ime: new IME(),
      history: undefined as unknown as ActionHistory<HistoryState>,
      clipboard: undefined as
        | undefined
        | ['Entry', Entry]
        | ['Range', Entry[][][]],
      busy: false,
      loadingFailed: false,
    }
  },
  methods: {
    create(title = '') {
      const chapters = [new Chapter(INIT_CONFIG)]
      this.music = new Music(title, chapters)
      this.editor = this.music.getEditor()
      this.init()

      this.editor.cursor.move(0, 0, 0, 0)
      this.write('main', YUL_OBJ[3][0])
      this.editor.add('cell')
      this.editor.stepCol(-1)
    },
    load(music: Music) {
      this.music = music
      this.editor = this.music.getEditor()
      this.init()
    },
    init() {
      // keep octave & clipboard
      this.dragging = false
      this.player = undefined
      this.history = this.createHistory()
      this.busy = false
      this.loadingFailed = false
      this.updateChapter()
      this.updateRhythm()
      this.updateSympad()
      this.ime.reset()

      this.editor.cursor.on('afterColChange', () => {
        this.updateSympad()
        this.ime.reset()
        this.updateFocus()
      })
      this.editor.cursor.on('afterRowChange', () => this.updateRhythm())
      this.editor.cursor.on('afterChapterChange', () => this.updateChapter())
    },
    createHistory() {
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
          this.updateFocus()
        },
        MAX_HISTORY
      )
    },
    updateSympad() {
      if (this.editor.cursor.rhythmMode) return
      const el = this.editor.get('col')
      this.sigimShow =
        !!el.data?.main &&
        ('pitch' in el.data.main || el.data.main.pitches.length === 1)
      this.trill = {}
      if (el.data?.modifier && el.data.modifier.trill) {
        this.trill = el.data.modifier.trill
      }
    },
    updateRhythm() {
      if (this.editor.cursor.rhythmMode) {
        this.tickIdx = rhythmTickIndex(this.editor.currentRhythmTick())
      }
    },
    updateChapter() {
      this.config = this.editor.get('chapter').config
    },
    updateFocus() {
      this.$nextTick(() => {
        if ((document.activeElement as any)?.disabled) {
          document.getElementById('workspace')?.focus()
        }
      })
    },

    /* Interactions by buttons */
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
      if (this.editor.cursor.rhythmMode) {
        this.doWithBackup(() => this.editor.eraseRhythmTick())
      } else {
        this.doWithBackup(() => this.editor.erase())
        this.ime.reset()
      }
    },
    shapechange(what: CoordLevel, delta: -1 | 1) {
      if (this.editor.isSelecting) return
      if (delta === +1) this.doWithBackup(() => this.editor.add(what))
      else this.doWithBackup(() => this.editor.del(what))
    },
    octavechange(delta: -1 | 1) {
      if (this.octave + delta < -3 || this.octave + delta > 3) return
      this.octave += delta
    },
    tickchange(tickIdx: number) {
      this.doWithBackup(() => this.editor.writeRhythmTick(RHYTHM_OBJ[tickIdx]))
    },
    trillchange(trill: TrillState) {
      let query = this.editor.get('col').data?.modifier?.query
      if (query == null) return
      query = query.replace(/~/g, '')
      query = (trill.before ? '~' : '') + query + (trill.after ? '~' : '')
      this.write('modifier', querySymbol('modifier', query, 'key'))
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
        this.busy = true
        await this.player.load()
        this.busy = false
        await this.player.play()
      }
      if (this.player?.finished) this.player = undefined
    },
    rename(title: string, instrument: InstrumentName) {
      this.music.title = title
      this.music.instrument = instrument
    },
    async open(file: any) {
      this.busy = true
      await nextTick()
      const reader = new FileReader()
      reader.addEventListener('load', e => {
        const result = e.target?.result
        if (typeof result !== 'string') {
          this.busy = false
          return
        }
        try {
          const music = deserializeMusic(result)
          this.load(music)
        } catch (error) {
          this.loadingFailed = true
        }
        this.busy = false
      })
      reader.readAsText(file)
    },
    save() {
      const data = serializeMusic(this.music)
      const { blob, filename } = makeYamlDownload(this.music.title, data)
      saveAs(blob, filename)
    },
    async exportMidi() {
      const compiled = convertToMidi(this.music.getPlayer())
      const data = Uint8Array.from(writeMidi(compiled, { running: true }))
      const { blob, filename } = makeMidiDownload(this.music.title, data)
      saveAs(blob, filename)
    },
    undo() {
      this.ime.reset()
      this.history.undo()
    },
    redo() {
      this.ime.reset()
      this.history.redo()
    },

    /* Undo/Redo functionality */
    doWithBackup(op: () => UndoOp) {
      this.history.do(op)
    },

    /* Interactions by Keyboards */
    writeIME(key: string, shiftKey: boolean) {
      if (this.editor.isSelecting) return
      if (shiftKey && !this.sigimShow) return
      const where = shiftKey ? 'modifier' : 'main'
      const obj = this.ime.update(key, shiftKey)
      this.write(where, obj, false)
    },
    writeOctave(delta: 1 | -1) {
      const main = this.editor.get('col').data.main
      if (main == null || 'pitches' in main) return this.octavechange(delta)

      const destOctave = main.octave + delta
      if (destOctave < -3 || 3 < destOctave) return
      this.octave = destOctave

      this.write('main', YUL_OBJ[destOctave + 3][main.yul])
    },

    /* Event Handlers */
    pointerDown(coord: Cursor) {
      if (this.editor.anchor?.isEqualTo(coord, 'cell')) {
        this.editor.anchor.moveTo(this.editor.cursor)
        this.editor.cursor.moveTo(coord)
        this.editor.normalizeSelection()
      } else if (!this.editor.cursor.isEqualTo(coord, 'cell')) {
        return // ignore this event
      }
      this.dragging = true
    },
    pointerOver(coord: Cursor) {
      if (this.dragging) this.selectTo(coord)
    },
    pointerUp() {
      this.dragging = false
    },
    keypressHandler(e: KeyboardEvent) {
      if (this.player) return

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
          if (this.editor.isSelecting) return
          if (!e.shiftKey) return
          if (this.editor.cursor.rhythmMode) return
          this.shapechange('col', +1)
          break
        case 'Enter':
        case 'NumpadEnter':
          if (this.editor.isSelecting) return

          if (e.shiftKey) this.shapechange('row', +1)
          else if (this.editor.cursor.rhythmMode) return
          else this.shapechange('cell', +1)
          break
        case 'Escape':
          this.editor.discardSelection()
          return
        case 'Home':
          if (this.editor.cursor.rhythmMode) {
            this.editor.moveRhythm('cell', 0)
            break
          }
          if (!e.shiftKey) this.editor.discardSelection()
          else if (!this.editor.isSelecting) this.editor.createSelection()

          e.ctrlKey ? this.editor.move('chapter', 0, 0) : this.editor.moveHome()
          break
        case 'End':
          if (this.editor.cursor.rhythmMode) {
            const rhythm = this.config.rhythm
            this.editor.moveRhythm('cell', rhythm.length - 1)
            this.editor.moveRhythm('row', rhythm[rhythm.length - 1].length - 1)
            break
          }
          if (!e.shiftKey) this.editor.discardSelection()
          else if (!this.editor.isSelecting) this.editor.createSelection()

          e.ctrlKey
            ? this.editor.move('chapter', -1, -1)
            : this.editor.moveEnd()
          break
        /* Editing */
        case 'Backspace':
          if (this.editor.isSelecting) {
            this.doWithBackup(
              this.editor.isEmptyRange()
                ? mergeActions(
                    () => this.editor.delRange(),
                    () => this.editor.backspace()
                  )
                : () => this.editor.cutRange()[1]
            )
          } else if (this.editor.cursor.rhythmMode) {
            if (this.tickIdx !== -1) this.erase()
            else this.shapechange('row', -1)
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
          if (this.editor.cursor.rhythmMode) return
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
            this.doWithBackup(
              this.editor.isEmptyRange()
                ? mergeActions(
                    () => this.editor.delRange(),
                    () => this.editor.deletekey()
                  )
                : () => this.editor.cutRange()[1]
            )
          } else if (this.editor.cursor.rhythmMode) {
            if (this.tickIdx !== -1) this.erase()
            else this.shapechange('row', -1)
          } else {
            this.doWithBackup(() => this.editor.deletekey())
          }
          return

        /* Lower octave */
        case 'KeyV':
          if (hasCtrlKeyOnly(e)) {
            this.paste()
            break
          }
        // breakthrough
        case 'Slash':
        case 'KeyQ':
        case 'KeyK':
          if (this.editor.cursor.rhythmMode) return
          this.writeOctave(-1)
          break

        /* Raise octave */
        case 'KeyC':
          if (hasCtrlKeyOnly(e)) {
            this.copy()
            break
          }
        // breakthrough
        case 'Semicolon':
        case 'KeyT':
        case 'KeyJ':
          if (this.editor.cursor.rhythmMode) return
          this.writeOctave(+1)
          return

        case 'Comma':
          if (this.editor.cursor.rhythmMode) return
          if (this.editor.isSelecting) return
          this.write('main', REST_OBJ)
          return
        case 'Equal':
          if (this.editor.cursor.rhythmMode) return
          if (e.ctrlKey || e.altKey || e.metaKey) return
          if (!this.sigimShow) return
          if (this.editor.isSelecting) return
          this.writeIME(e.code, true)
          break
        case 'Backquote':
        case 'KeyH':
        case 'KeyI':
          if (this.editor.cursor.rhythmMode) return
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
            const digit = e.code.slice(-1)
            if (this.editor.cursor.rhythmMode) {
              if (e.shiftKey) return
              if (!inRange(+digit - 1, RHYTHM_OBJ.length)) return
              this.tickchange(+digit - 1)
            } else {
              this.writeIME(digit, e.shiftKey)
            }
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
            }
            break
          }

          if (this.editor.cursor.rhythmMode) return
          if (hasModifierKey(e) && !hasShiftKeyOnly(e)) return
          let idxPitch = PITCH2CODE.indexOf(e.code)
          if (idxPitch !== -1) {
            if (this.editor.isSelecting) return
            this.write('main', YUL_OBJ[this.octave + 3][idxPitch])
            break
          }
          return
      }
      e.preventDefault()
    },
  },
  computed: {
    workspaceLabel(): string {
      return WORKSPACE_LABEL
    },
    workspaceHelp(): string {
      return WORKSPACE_HELP
    },
    workspaceKeyShortcuts(): string {
      return formatWorkspaceKeyShortcuts()
    },
    gaks() {
      return this.music.asGaks()
    },
    undoable(): boolean {
      return this.player == null && this.history?.undoable === true
    },
    redoable(): boolean {
      return this.player == null && this.history?.redoable === true
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
      if (this.player) return makeCanvasLabel({ playing: true })
      return makeCanvasLabel({
        cursor: this.editor.cursor,
        config: this.config,
        numRows: this.editor.get('cell').data.length,
        numCols: this.editor.get('row').data.length,
        col: this.editor.get('col'),
      })
    },
  },
  created() {
    this.create('새 곡')
  },
  mounted() {
    document.addEventListener('pointerup', this.pointerUp)
    document.addEventListener('pointercancel', this.pointerUp)
    document.addEventListener('keydown', this.keypressHandler)
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
  position: sticky;
  top: 0;
  background: black;
  z-index: 9;
}

#workspace {
  background: white;
  padding: 4rem 3rem;
  margin: 3rem 0rem;
}
</style>
