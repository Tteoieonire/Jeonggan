<template>
  <div>
    <menupanel
      :rhythmMode="cursor.rhythmMode"
      :playerMode="player.mode"
      @addchapter="addchapter"
      @play="play"
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
    <exchangemodal :title="title" :music="music" @exchange="exchange"></exchangemodal>
  </div>
</template>

<script>
import keypanel from './components/keypanel.vue'
import menupanel from './components/menupanel.vue'
import canvaspanel from './components/canvaspanel.vue'
import configmodal from './components/configmodal.vue'
import exchangemodal from './components/exchangemodal.vue'

import Cursor from './cursor.js'
import Music from './music.js'
import Chapter from './chapter.js'
import Player from './player.js'
import IME from './ime.js'
import { RHYTHM_OBJ, YUL_OBJ, REST_OBJ } from './constants.js'
import { querySymbol } from './components/keypads/sympad.vue'

/**
 * Controller
 */
const INIT_TITLE = '수연장지곡'
const INIT_CONFIG = {
  name: '초장',
  tempo: 60,
  measure: 6,
  rhythm: ['떵', null, '따닥', '쿵', '더러러러', '따'],
  scale: [0, 2, 5, 7, 9],
  padding: 0 //?
}
const MAX_HISTORY = 30

export default {
  data() {
    return {
      title: INIT_TITLE,
      cursor: undefined,
      music: undefined,
      scale: undefined, //need update
      rhythm: undefined, // need update
      sigimShow: false, // need update
      configchapter: undefined, // what??
      octave: 2,
      tickIdx: 0,
      ime: new IME(querySymbol),
      player: null,
      undoHistory: [],
      undoTravel: 0
    }
  },
  methods: {
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
      const el = this.music.get('col')
      this.doWithBackup(
        () => {
          const old = el[where]
          this.$set(el, where, obj)
          this.updateSigimShow()
          return old
        },
        old => {
          this.$set(el, where, old) // TODO: 과연 el이 유효할까?
          this.updateSigimShow()
        }
      )
      if (resetIME) this.ime.reset()
    },
    erase() {
      if (this.cursor.blurred) return
      this.doWithBackup(
        () => {
          let old = this.music.del('col', 'keep')
          this.sigimShow = false
        },
        old => this.music.get('row').splice(this.cursor.col, 1, old)
      )
      this.ime.reset()
    },
    writeIME(key, shiftKey) {
      const where = shiftKey ? 'modifier' : 'main'
      const obj = this.ime.update(key, shiftKey)
      this.write(where, obj, false)
    },
    shapechange(what, delta) {
      if (this.cursor.blurred) return
      if (delta === +1) {
        this.doWithBackup(
          () => this.music.add(what),
          _ => this.music.del(what)
        )
      } else {
        this.doWithBackup(
          () => this.music.del(what),
          old => this.music.add(what, old)
        )
      }
    },
    octavechange(delta) {
      this.octave += delta
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
          this.move(chapter, 0, 0, 0)
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
    exchange(title, chapters) {
      this.cursor.blur()
      this.title = title
      this.music.chapters = chapters.map(config => {
        const chapter = new Chapter(this.cursor, config, config.content)
        return chapter
      })
      this.cursor.move(0, 0, 0, 0)
      this.undoHistory = []
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
      // TODO: for now I assume all ops are recorded
      this.ime.reset() // and this is part of it
      if (this.undoTravel === 0) return
      this.undoTravel -= 1
      let op = this.undoHistory[this.undoTravel]
      this.cursor.loadFrom(op.newCursor)
      op.undo(op.data)
      // assert this.cursor is at op.oldCursor
    },
    redo() {
      this.ime.reset() // but this must be evidence that redo isn't possible anymore
      if (this.undoTravel >= this.undoHistory.length) return
      let op = this.undoHistory[this.undoTravel]
      this.cursor.loadFrom(op.oldCursor)
      op.redo() // assert return value == op.data
      // assert this.cursor is at op.newCursor
      this.undoTravel += 1
    },
    keypressRhythm(e) {
      let measure = this.rhythm.length
      if (e.code === 'ArrowUp') {
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
        /* Editing */
        case 'Space':
          this.doWithBackup(
            () => this.music.add('col'),
            _ => this.music.del('col')
          )
          break
        case 'Backspace':
          if (this.ime.isComposing()) {
            let where = this.ime.grace ? 'modifier' : 'main'
            let obj = this.ime.backspace()
            this.write(where, obj, false)
          } else {
            let tobreak = null
            if (this.cursor.col > 0) tobreak = 'col'
            else if (this.cursor.row > 0) tobreak = 'row'
            else if (this.cursor.cell > 0) tobreak = 'cell'
            else if (this.cursor.chapter > 0) tobreak = 'chapter'
            this.doWithBackup(
              () => this.music.backspace(),
              old => {
                console.log('how to undo backspace? I got', old)
                //
              }
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
          this.erase()
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
          if (this.octave > 0) {
            this.octave -= 1
          }
          break
        case 'Semicolon':
          if (this.octave < 4) {
            this.octave += 1
          }
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
            if (e.shiftKey) {
              this.redo()
            } else {
              this.undo()
            }
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
    }
  },
  created() {
    this.cursor = new Cursor()
    this.music = new Music(this.cursor)
    this.music.addchapter(new Chapter(this.cursor, INIT_CONFIG))

    this.cursor.on('afterColChange', () => {
      this.updateSigimShow()
      this.ime.reset()
    }) // focus as well
    this.cursor.on('afterCellChange', () => this.music.trimLast())
    this.cursor.on('afterChapterChange', this.updateChapter)
    this.cursor.on('beforeCellChange', () => this.music.trim())
    this.cursor.on('beforeChapterChange', () => this.music.trimChapter())

    this.move(0, 0, 0, 0)
    this.write('main', YUL_OBJ[this.octave][0])
    this.updateChapter()

    this.player = new Player(this.music)
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
    configmodal,
    exchangemodal
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
