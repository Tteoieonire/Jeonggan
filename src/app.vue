<template>
  <div>
    <menupanel
      :rhythmMode="cursor.rhythmMode"
      :playerMode="player.mode"
      :undoable="undoable"
      :redoable="redoable"
      @addchapter="addchapter"
      @play="play"
      @open="open"
      @save="save"
      @undo="undo"
      @redo="redo"
      id="menubar"
    ></menupanel>
    <keypanel
      :tickIdx="tickIdx"
      :cursor="cursor"
      :sigimShow="sigimShow"
      :scale="scale"
      :octave="octave"
      @write="write"
      @erase="erase"
      @shapechange="shapechange"
      @octavechange="octavechange"
      @tickchange="tickchange"
      id="keypanel"
    ></keypanel>
    <canvaspanel
      tabIndex="0"
      :aria-label="canvasLabel"
      :cursor="cursor"
      :view="view"
      @move="move"
      @moveRhythm="moveRhythm"
      @openconfig="openconfig"
      id="workspace"
    ></canvaspanel>
    <configmodal
      v-if="configchapter"
      :config="configchapter.config"
      @configchange="configchange"
      @deletechapter="deletechapter"
    ></configmodal>
    <initmodal :title="title" @init="init"></initmodal>
    <globalmodal :title="title" @rename="rename"></globalmodal>
  </div>
</template>

<script>
import { saveAs } from 'file-saver'

import keypanel from './components/keypanel.vue'
import menupanel from './components/menupanel.vue'
import canvaspanel from './components/canvaspanel.vue'

import initmodal from './components/initmodal.vue'
import globalmodal from './components/globalmodal.vue'
import configmodal from './components/configmodal.vue'

import Cursor from './cursor.js'
import Music from './music.js'
import Chapter from './chapter.js'
import Player from './player.js'
import IME from './ime.js'
import { RHYTHM_OBJ, YUL_OBJ, REST_OBJ } from './constants.js'
import { querySymbol } from './components/keypads/sympad.vue'
import { serializeMusic, deserializeMusic } from './serializer.js'

/**
 * Controller
 */
const INIT_CONFIG = {
  name: '초장',
  tempo: 60,
  measure: 6,
  rhythm: ['떵', null, '따닥', '쿵', '더러러러', '따'],
  hideRhythm: false,
  scale: [0, 2, 5, 7, 9],
  padding: 0
}
const MAX_HISTORY = 100

export default {
  data() {
    return {
      title: '',
      cursor: undefined,
      music: undefined,
      scale: undefined, //need update
      rhythm: undefined, // need update
      sigimShow: false, // need update
      configchapter: undefined, // what??
      octave: 2,
      tickIdx: 0,
      ime: new IME(querySymbol),
      player: new Player(),
      undoHistory: [],
      undoTravel: 0
    }
  },
  methods: {
    init(title = '') {
      this.title = title
      this.cursor = new Cursor()
      this.music = new Music(this.cursor)
      this.music.addchapter(new Chapter(this.cursor, INIT_CONFIG))
      this.player.music = this.music

      this.move(0, 0, 0, 0)
      this.write('main', YUL_OBJ[this.octave][0])
      this.music.add('cell')
      this.updateChapter()
      this.updateSigimShow()

      this.cursor.on('afterColChange', () => {
        this.updateSigimShow()
        this.ime.reset()
      })
      this.cursor.on('afterChapterChange', () => this.updateChapter())
      this.cursor.on('beforeCellChange', () => this.music.trim())
    },
    updateSigimShow() {
      if (this.cursor.blurred || this.cursor.rhythmMode) return
      const main = this.music.get('col').main
      this.sigimShow =
        main &&
        main.pitch &&
        (typeof main.pitch === 'number' || main.pitch.length === 1)
    },
    updateChapter() {
      if (this.cursor.blurred) return
      let config = this.music.get('chapter').config
      this.rhythm = config && config.rhythm
      this.scale = config && config.scale
    },
    moveRhythm(chapter, cell) {
      if (this.cursor.playMode) return
      this.cursor.moveRhythm(chapter, cell)
      this.$nextTick(() => {
        this.tickIdx = RHYTHM_OBJ.indexOf(this.rhythm[cell])
      })
    },
    move(chapter, cell, row, col) {
      if (this.cursor.playMode) return
      this.cursor.move(chapter, cell, row, col)
    },
    write(where, obj, resetIME = true) {
      if (this.cursor.blurred) return
      this.doWithBackup(
        () => {
          const el = this.music.get('col')
          const old = el[where]
          this.$set(el, where, obj)
          this.updateSigimShow()
          return old
        },
        old => {
          this.$set(this.music.get('col'), where, old)
          this.updateSigimShow()
        }
      )
      if (resetIME) this.ime.reset()
    },
    erase() {
      if (this.cursor.blurred) return
      this.doWithBackup(
        () => {
          this.sigimShow = false
          return this.music.erase()
        },
        old => this.music.get('row').splice(this.cursor.col, 1, old)
      )
      this.ime.reset()
    },
    writeIME(key, shiftKey) {
      if (shiftKey && !this.sigimShow) return
      const where = shiftKey ? 'modifier' : 'main'
      const obj = this.ime.update(key, shiftKey)
      this.write(where, obj, false)
    },
    shapechange(what, delta) {
      if (this.cursor.blurred) return
      if (delta === +1) {
        this.doWithBackup(
          () => this.music.add(what),
          _ => {
            this.music.del(what)
            this.updateSigimShow()
          }
        )
      } else {
        this.doWithBackup(
          () => {
            const f = this.music.del(what)
            this.updateSigimShow()
            return f
          },
          f => f()
        )
      }
    },
    octavechange(delta) {
      if (this.octave + delta < 0 || this.octave + delta > 4) return
      const el = !this.cursor.blurred && this.music.get('col')
      const old = el && el.main
      if (old && typeof old.pitch === 'number') {
        this.doWithBackup(
          () => {
            this.octave += delta
            const obj = YUL_OBJ[this.octave][old.pitch % 12]
            this.$set(this.music.get('col'), 'main', obj)
          },
          _ => {
            this.octave -= delta
            this.$set(this.music.get('col'), 'main', old)
          }
        )
      } else this.octave += delta
    },
    tickchange(tickIdx) {
      this.doWithBackup(
        () => {
          let oldtick = this.tickIdx
          this.tickIdx = tickIdx
          this.rhythm.splice(this.cursor.cell, 1, RHYTHM_OBJ[tickIdx])
          return oldtick
        },
        oldtick => {
          this.tickIdx = oldtick
          this.rhythm.splice(this.cursor.cell, 1, RHYTHM_OBJ[oldtick])
        }
      )
    },
    openconfig(chapter) {
      this.configchapter = this.music.chapters[chapter]
    },
    configchange(config) {
      this.rhythm = config.rhythm
      this.scale = config.scale
      this.$set(this.configchapter, 'config', config)
    },
    addchapter() {
      this.doWithBackup(
        () => this.music.addchapter(),
        _ => this.music.delchapter()
      )
    },
    deletechapter() {
      const chapter = this.music.chapters.indexOf(this.configchapter)
      if (chapter === -1) return
      this.doWithBackup(
        () => this.music.delchapter(chapter),
        old => {
          this.cursor.chapter = chapter - 1
          this.music.addchapter(old)
          // restore cursor
        }
      )
    },
    play(command) {
      if (command === 'stop') {
        this.player.stop()
      } else if (command === 'pause') {
        this.player.pause()
      } else {
        this.player.resume()
      }
    },
    rename(title) {
      this.title = title
    },
    load(title, chapters) {
      this.cursor.blur()
      this.title = title
      this.music.chapters = chapters.map(config => {
        const chapter = new Chapter(this.cursor, config, config.content)
        return chapter
      })
      this.cursor.move(0, 0, 0, 0)
      this.undoHistory = []
      this.undoTravel = 0
    },
    open(file) {
      // TODO: maybe warn user?
      const reader = new FileReader()
      reader.addEventListener('load', e => {
        const result = e.target.result
        const data = deserializeMusic(result) // TODO: handle error
        this.load(data.title, data.chapters)
      })
      reader.readAsText(file);
    },
    save() {
      const data = serializeMusic(this.title, this.music)
      const blob = new Blob([data], {type: 'text/x-yaml'})
      let filename = this.title.replace('\\s+', '-').replace('\\W+', '') + '.yml'
      saveAs(blob, filename)
    },
    doWithBackup(redo, undo) {
      /** redo: a function that does the (re)-operation.
              takes zero args and returns data needed for `undo`
          undo: a function that reverses the operation.
              takes one arg which is return value of `redo`
              and returns nothing
       */
      this.undoHistory = this.undoHistory.slice(0, this.undoTravel)
      const oldCursor = this.cursor.clone()
      const data = redo()
      const newCursor = this.cursor.clone()
      this.undoHistory.push({
        undo,
        redo,
        data,
        oldCursor,
        newCursor
      })
      this.undoTravel += 1
    },
    undo() {
      this.ime.reset()
      if (this.undoTravel === 0) return
      this.undoTravel -= 1
      let op = this.undoHistory[this.undoTravel]
      this.cursor.loadFrom(op.newCursor)
      op.undo(op.data)
      this.cursor.loadFrom(op.oldCursor)
    },
    redo() {
      this.ime.reset()
      if (this.undoTravel >= this.undoHistory.length) return
      let op = this.undoHistory[this.undoTravel]
      this.cursor.loadFrom(op.oldCursor)
      op.redo() // assert return value == op.data
      this.cursor.loadFrom(op.newCursor)
      this.undoTravel += 1
    },
    keypressRhythm(e) {
      let measure = this.rhythm.length
      if (e.code === 'Backspace' || e.code === 'Delete') {
        this.tickchange(0)
      } else if (e.code === 'ArrowUp') {
        if (this.cursor.cell === 0) this.cursor.cell = measure
        this.moveRhythm(this.cursor.chapter, this.cursor.cell - 1)
      } else if (e.code === 'ArrowDown') {
        if (this.cursor.cell === measure - 1) this.cursor.cell = -1
        this.moveRhythm(this.cursor.chapter, this.cursor.cell + 1)
      } else if (e.code === 'ArrowLeft') {
        if (this.tickIdx === 0) this.tickIdx = RHYTHM_OBJ.length
        this.tickchange(this.tickIdx - 1)
      } else if (e.code === 'ArrowRight') {
        if (this.tickIdx === RHYTHM_OBJ.length - 1) this.tickIdx = -1
        this.tickchange(this.tickIdx + 1)
      } else return
      e.preventDefault()
    },
    keypressHandler(e) {
      if (this.cursor.blurred) return
      if (this.cursor.select_mode) return
      if (this.cursor.rhythmMode) return this.keypressRhythm(e)
      switch (e.code) {
        case 'ArrowUp':
          this.music.moveUpDown(-1)
          break
        case 'ArrowDown':
          this.music.moveUpDown(+1)
          break
        case 'ArrowLeft':
          this.music.moveLeftRight(-1)
          break
        case 'ArrowRight':
          this.music.moveLeftRight(+1)
          break
        case 'Home':
          if (e.ctrlKey) {
            this.music.set('chapter', 0)
          } else {
            let remainder = this.cursor.cell % this.music.get('chapter').config.measure
            this.music.set('cell', this.cursor.cell - remainder, 0)
          }
          break
        case 'End':
          if (e.ctrlKey) {
            this.music.set('chapter', -1, -1)
          } else {
            let measure = this.music.get('chapter').config.measure
            let remainder = this.cursor.cell % measure
            let dest = this.cursor.cell + measure - 1 - remainder
            this.music.set('cell', Math.min(dest, this.music.get('cells').length - 1), -1)
          }
          break
        /* Editing */
        case 'Space':
          this.doWithBackup(
            () => this.music.add('col'),
            _ => this.music.backspace()
          )
          break
        case 'Backspace':
          if (this.ime.isComposing()) {
            let where = this.ime.grace ? 'modifier' : 'main'
            let obj = this.ime.backspace()
            this.write(where, obj, false)
          } else if (this.music.get('col').main) {
            this.erase()
          } else {
            this.doWithBackup(
              () => this.music.backspace(),
              f => f()
            )
          }
          break
        case 'Minus':
        case 'NumpadSubtract':
          if (e.shiftKey) {
            this.write('modifier', undefined)
          } else if (!hasModifierKey(e)) {
            this.erase()
          }
          return
        case 'Delete': // ?
          if (this.music.get('col').main) {
            this.erase()
          } else {
            this.doWithBackup(
              () => this.music.deletekey(),
              f => f()
            )
          }
          return
        case 'Enter':
        case 'NumpadEnter':
          if (e.ctrlKey) {
            this.doWithBackup(
              () => this.music.chapterbreak(),
              _ => this.music.backspace()
            )
          } else if (e.shiftKey) {
            this.doWithBackup(
              () => this.music.rowbreak(),
              _ => this.music.backspace()
            )
          } else {
            this.doWithBackup(
              () => this.music.cellbreak(),
              _ => this.music.backspace()
            )
          }
          break
        case 'Slash':
          this.octavechange(-1)
          break
        case 'Semicolon':
          this.octavechange(+1)
          return
        case 'Comma':
          this.write('main', REST_OBJ)
          return
        case 'Backquote':
        case 'Equal':
        case 'KeyH':
        case 'KeyI':
          if (!e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return
          if (!this.sigimShow) return
          this.writeIME(e.code, true)
          break
        default:
          const prefix = e.code.slice(0, -1)
          if (prefix === 'Digit' || prefix === 'Numpad') {
            this.writeIME(e.code.slice(-1), e.shiftKey)
            break
          }

          const pitch2code = [
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
            'KeyM'
          ]
          let idxPitch = pitch2code.indexOf(e.code)
          if (idxPitch !== -1 && !hasModifierKey(e)) {
            this.write('main', YUL_OBJ[this.octave][idxPitch])
            return
          }

          if (e.ctrlKey && e.code === 'KeyZ') {
            if (e.shiftKey) this.redo()
            else this.undo()
            break
          }
          return
      }
      e.preventDefault()
    }
  },
  computed: {
    view() {
      return this.music.view()
    },
    undoable() {
      return this.undoTravel > 0
    },
    redoable() {
      return this.undoTravel < this.undoHistory.length
    },
    canvasLabel() {
      if (this.cursor.blurred) return '??'
      const config = this.music.chapters[this.cursor.chapter].config
      const chapterName = config.name
      if (this.cursor.rhythmMode) {
        return chapterName + ' 장단 ' + (this.cursor.cell + 1) + '번째 정간 ' + this.rhythm[this.cursor.cell]
      }

      const gak = Math.floor((this.cursor.cell + config.padding) / config.measure)
      let pos = this.cursor.cell
      if (gak > 0) pos = (pos + config.padding) % config.measure

      const cell = this.music.get('cell')
      const row = cell[this.cursor.row]
      const col = row[this.cursor.col]
      const main = col && col.main ? col.main.label : '빈칸'
      const modifier = col && col.modifier ? col.modifier.label : ''
      return (chapterName + ' ' + (gak + 1) + '각 ' + (pos + 1) + '번째 정간, '
        + cell.length + '행 중 ' + (this.cursor.row + 1) + '행, '
        + row.length + '칸 중 ' + (this.cursor.col + 1) + '칸, '
        + main + ' ' + modifier)
    },
  },
  created() {
    this.init('수연장지곡')
  },
  mounted() {
    document
      .getElementById('workspace')
      .addEventListener('keydown', this.keypressHandler)
  },
  components: {
    keypanel,
    menupanel,
    canvaspanel,

    initmodal,
    globalmodal,
    configmodal
  }
}

function hasModifierKey(e) {
  return e.ctrlKey || e.shiftKey || e.altKey || e.metaKey
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
