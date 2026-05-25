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
import type { InstrumentName } from 'soundfont-player'
import { defineComponent, nextTick } from 'vue'

import canvaspanel from './components/canvaspanel.vue'
import keypanel from './components/keypanel.vue'
import menupanel from './components/menupanel.vue'

import configmodal from './components/configmodal.vue'
import globalmodal from './components/globalmodal.vue'
import initmodal from './components/initmodal.vue'

import { EditorSession } from './app/editor-session'
import { makeCanvasLabel } from './features/canvas-label'
import Cursor, { CoordLevel } from './domain/cursor'
import { Music, MusicEditor } from './domain/editor'
import { readMusicFile } from './io/file-open'
import { makeMusicMidiDownload, makeMusicYamlDownload } from './io/music-export'
import { MusicPlayer } from './domain/player'
import { EntryOf, TrillState } from './domain/symbols'
import { Config } from './domain/viewer'
import {
  WORKSPACE_HELP,
  WORKSPACE_LABEL,
  workspaceKeyShortcuts as formatWorkspaceKeyShortcuts,
} from './features/workspace-accessibility'

export default defineComponent({
  data() {
    return {
      dragging: false,
      session: undefined as unknown as EditorSession,
      player: undefined as undefined | MusicPlayer,
      busy: false,
      loadingFailed: false,
    }
  },
  methods: {
    create(title = '') {
      this.session.create(title)
      this.resetEditorUiState()
    },
    load(music: Music) {
      this.session.load(music)
      this.resetEditorUiState()
    },
    resetEditorUiState() {
      this.dragging = false
      this.player = undefined
      this.busy = false
      this.loadingFailed = false
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
      this.session.moveTo(coord)
    },
    selectTo(coord: Cursor) {
      if (this.player != null) return
      this.session.selectTo(coord)
    },
    discardSelection() {
      this.session.discardSelection()
    },
    write<K extends keyof EntryOf>(
      where: K,
      obj?: EntryOf[K],
      resetIME = true
    ) {
      this.session.write(where, obj, resetIME)
    },
    erase() {
      this.session.erase()
    },
    shapechange(what: CoordLevel, delta: -1 | 1) {
      this.session.shapechange(what, delta)
    },
    octavechange(delta: -1 | 1) {
      this.session.octavechange(delta)
    },
    tickchange(tickIdx: number) {
      this.session.tickchange(tickIdx)
    },
    trillchange(trill: TrillState) {
      this.session.trillchange(trill)
    },
    configchange(config: Config, isVisibleChange: boolean) {
      this.session.configchange(config, isVisibleChange)
    },
    addchapter() {
      this.session.addchapter()
    },
    deletechapter() {
      this.session.deletechapter()
    },
    cut() {
      this.session.cut()
    },
    copy() {
      this.session.copy()
    },
    paste() {
      this.session.paste()
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
      this.session.rename(title, instrument)
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
      this.session.undo()
    },
    redo() {
      this.session.redo()
    },

    /* Event Handlers */
    pointerDown(coord: Cursor) {
      this.dragging = this.session.startCanvasDrag(coord)
    },
    pointerOver(coord: Cursor) {
      if (this.dragging) this.selectTo(coord)
    },
    pointerUp() {
      this.dragging = false
    },
    keypressHandler(e: KeyboardEvent) {
      const command = this.session.getKeyboardCommand(e, this.player != null)
      if (command.preventDefault) e.preventDefault()
      this.session.executeKeyboardCommand(command)
    },
  },
  computed: {
    music(): Music {
      return this.session.music
    },
    editor(): MusicEditor {
      return this.session.editor as unknown as MusicEditor
    },
    config(): Config {
      return this.session.config
    },
    sigimShow(): boolean {
      return this.session.sigimShow
    },
    octave(): number {
      return this.session.octave
    },
    trill(): TrillState {
      return this.session.trill
    },
    tickIdx(): number {
      return this.session.tickIdx
    },
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
      return this.player == null && this.session.undoable
    },
    redoable(): boolean {
      return this.player == null && this.session.redoable
    },
    pastable(): boolean {
      return this.session.pastable
    },
    trillShow(): TrillState {
      return this.session.trillShow
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
    this.session = new EditorSession({
      requestFocus: () => this.updateFocus(),
    })
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
