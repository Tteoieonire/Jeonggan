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
import { InstrumentName } from 'soundfont-player'
import { defineComponent, nextTick } from 'vue'

import canvaspanel from './components/canvaspanel.vue'
import keypanel from './components/keypanel.vue'
import menupanel from './components/menupanel.vue'

import configmodal from './components/configmodal.vue'
import globalmodal from './components/globalmodal.vue'
import initmodal from './components/initmodal.vue'

import { makeCanvasLabel } from './features/canvas-label'
import {
  moveCanvasCursor,
  selectCanvasRange,
  startCanvasDrag,
} from './features/canvas-selection'
import { canPaste, type ClipboardData } from './features/clipboard'
import {
  REST_OBJ,
  RHYTHM_OBJ,
  rhythmTickIndex,
  YUL_OBJ,
} from './domain/constants'
import Cursor, { CoordLevel } from './domain/cursor'
import { Music, MusicEditor } from './domain/editor'
import { readMusicFile } from './io/file-open'
import { ActionHistory } from './features/history'
import { IME } from './features/ime'
import { getKeyboardCommand, type KeyboardCommand } from './features/keyboard'
import { executeKeyboardNavigation } from './features/keyboard-navigation'
import { makeMusicMidiDownload, makeMusicYamlDownload } from './io/music-export'
import { MusicPlayer } from './domain/player'
import { EntryOf, TrillState } from './domain/symbols'
import { applyModifierTrill } from './features/trill'
import { getID } from './domain/utils'
import { Chapter, Config, mergeActions, UndoOp } from './domain/viewer'
import {
  WORKSPACE_HELP,
  WORKSPACE_LABEL,
  workspaceKeyShortcuts as formatWorkspaceKeyShortcuts,
} from './features/workspace-accessibility'

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
      clipboard: undefined as undefined | ClipboardData,
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
      moveCanvasCursor(this.editor, coord)
    },
    selectTo(coord: Cursor) {
      if (this.player != null) return
      selectCanvasRange(this.editor, coord)
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
      const modifier = applyModifierTrill(
        this.editor.get('col').data?.modifier,
        trill
      )
      if (modifier != null) this.write('modifier', modifier)
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
      try {
        const music = await readMusicFile(file)
        if (music != null) this.load(music)
      } catch (error) {
        this.loadingFailed = true
      } finally {
        this.busy = false
      }
    },
    save() {
      const { blob, filename } = makeMusicYamlDownload(this.music)
      saveAs(blob, filename)
    },
    async exportMidi() {
      const { blob, filename } = makeMusicMidiDownload(this.music)
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
      this.dragging = startCanvasDrag(this.editor, coord)
    },
    pointerOver(coord: Cursor) {
      if (this.dragging) this.selectTo(coord)
    },
    pointerUp() {
      this.dragging = false
    },
    keypressHandler(e: KeyboardEvent) {
      const command = getKeyboardCommand(e, {
        playerActive: this.player != null,
        isSelecting: this.editor.isSelecting,
        rhythmMode: this.editor.cursor.rhythmMode,
        sigimShow: this.sigimShow,
        tickIdx: this.tickIdx,
        imeComposing: this.ime.isComposing(),
        imeGrace: this.ime.grace,
      })
      if (command.preventDefault) e.preventDefault()
      this.executeKeyboardCommand(command)
    },
    executeKeyboardCommand(command: KeyboardCommand) {
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
          this.doWithBackup(
            this.editor.isEmptyRange()
              ? mergeActions(
                  () => this.editor.delRange(),
                  () => this.editor.backspace()
                )
              : () => this.editor.cutRange()[1]
          )
          return
        case 'backspace':
          this.doWithBackup(() => this.editor.backspace())
          return
        case 'deleteSelection':
          this.doWithBackup(
            this.editor.isEmptyRange()
              ? mergeActions(
                  () => this.editor.delRange(),
                  () => this.editor.deletekey()
                )
              : () => this.editor.cutRange()[1]
          )
          return
        case 'deleteForward':
          this.doWithBackup(() => this.editor.deletekey())
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
        case 'cutSelection':
          this.doWithBackup(() => this.editor.cutRange()[1])
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
      return canPaste(
        this.clipboard,
        this.editor.isSelecting,
        this.editor.anchor,
        this.editor.cursor
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
