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
      :breath-marked="breathMarked"
      @write="write"
      @erase="erase"
      @shape-change="shapechange"
      @octave-change="octavechange"
      @tick-change="tickchange"
      @trill-change="trillchange"
      @breath-mark-toggle="toggleBreathMark"
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
import type { InstrumentName } from 'soundfont-player'
import { defineComponent, nextTick } from 'vue'

import canvaspanel from './components/canvas/canvaspanel.vue'
import keypanel from './components/keypad/keypanel.vue'
import menupanel from './components/menu/menupanel.vue'

import configmodal from './components/modals/configmodal.vue'
import globalmodal from './components/modals/globalmodal.vue'
import initmodal from './components/modals/initmodal.vue'

import { bindEditorDocumentEvents } from './app/browser'
import { EditorSession, FileSession, PlaybackSession } from './app/sessions'
import Cursor, { CoordLevel } from './domain/navigation/cursor'
import { Music } from './domain/music'
import { MusicEditor } from './domain/editing/music-editor'
import { EntryOf, TrillState } from './domain/symbols'
import { Config } from './domain/navigation/viewer'
import {
  WORKSPACE_HELP,
  WORKSPACE_LABEL,
  workspaceKeyShortcuts as formatWorkspaceKeyShortcuts,
} from './features/canvas'

export default defineComponent({
  data() {
    return {
      session: undefined as unknown as EditorSession,
      playback: undefined as unknown as PlaybackSession,
      files: undefined as unknown as FileSession,
      removeDocumentListeners: undefined as undefined | (() => void),
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
      this.playback.reset()
      this.files.reset()
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
      this.session.changeShape(what, delta)
    },
    octavechange(delta: -1 | 1) {
      this.session.changeOctave(delta)
    },
    tickchange(tickIdx: number) {
      this.session.changeTick(tickIdx)
    },
    trillchange(trill: TrillState) {
      this.session.changeTrill(trill)
    },
    toggleBreathMark() {
      this.session.toggleBreathMark()
    },
    configchange(config: Config, isVisibleChange: boolean) {
      this.session.changeConfig(config, isVisibleChange)
    },
    addchapter() {
      this.session.addChapter()
    },
    deletechapter() {
      this.session.deleteChapter()
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
      await this.playback.play(command, this.editor)
    },
    rename(title: string, instrument: InstrumentName) {
      this.session.rename(title, instrument)
    },
    async open(file: any) {
      await this.files.open(file, music => this.load(music))
    },
    save() {
      this.files.save(this.music)
    },
    async exportMidi() {
      this.files.exportMidi(this.music)
    },
    undo() {
      this.session.undo()
    },
    redo() {
      this.session.redo()
    },

    /* Event Handlers */
    pointerDown(coord: Cursor) {
      if (this.player != null) return
      this.session.pointerDown(coord)
    },
    pointerOver(coord: Cursor) {
      if (this.player != null) return
      this.session.pointerOver(coord)
    },
    pointerUp() {
      this.session.pointerUp()
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
    breathMarked(): boolean {
      return this.session.breathMarked
    },
    tickIdx(): number {
      return this.session.tickIdx
    },
    player() {
      return this.playback.player
    },
    busy(): boolean {
      return this.files.busy || this.playback.busy
    },
    loadingFailed: {
      get(): boolean {
        return this.files.loadingFailed
      },
      set(value: boolean) {
        this.files.loadingFailed = value
      },
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
      return this.session.gaks
    },
    undoable(): boolean {
      return this.session.canUndo(this.player != null)
    },
    redoable(): boolean {
      return this.session.canRedo(this.player != null)
    },
    pastable(): boolean {
      return this.session.pastable
    },
    trillShow(): TrillState {
      return this.session.trillShow
    },
    canvasLabel(): string {
      return this.session.canvasLabel(this.player != null)
    },
  },
  created() {
    this.session = new EditorSession({
      requestFocus: () => this.updateFocus(),
    })
    this.playback = new PlaybackSession()
    this.files = new FileSession({
      waitUntilBusyVisible: () => nextTick(),
    })
  },
  mounted() {
    this.removeDocumentListeners = bindEditorDocumentEvents(document, {
      pointerUp: () => this.pointerUp(),
      keydown: event => this.keypressHandler(event),
    })
  },
  unmounted() {
    this.removeDocumentListeners?.()
    this.removeDocumentListeners = undefined
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
