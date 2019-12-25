<template>
  <div>
    <keypanel
      v-model="rhythm[cursor.cell]"
      :cursor="cursor"
      :sigimShow="sigimShow"
      :scale="scaleSorted"
      :octave="octave"
      @write="write"
      @erase="erase"
      @shapechange="shapechange"
      @octavechange="octavechange"
      id="keypanel"
    ></keypanel>
    <menupanel
      :rhythmMode="cursor.rhythmMode"
      :playStatus="playStatus"
      @addchapter="addchapter"
      @play="play"
      id="menubar"
    ></menupanel>
    <canvaspanel
      :cursor="cursor"
      :rhythm="rhythm"
      :view="view"
      @move="move"
      @moveRhythm="moveRhythm"
      id="workspace"
    ></canvaspanel>
    <configmodal v-model="setting"></configmodal>
  </div>
</template>

<script>
import Soundfont from 'soundfont-player'

import keypanel from './components/keypanel.vue'
import menupanel from './components/menupanel.vue'
import canvaspanel from './components/canvaspanel.vue'
import configmodal from './components/configmodal.vue'

import Cursor from './cursor.js'
import Music from './music.js'
import { RHYTHM_OBJ, YUL_OBJ, REST_OBJ } from './constants.js'

/**
 * Controller
 */
export default {
  data() {
    return {
      setting: {
        title: '만파정식',
        scale: ['0', '2', '4', '9', '7'], // use scale_sorted instead
        measure: 12
      },
      cursor: undefined,
      rhythm: undefined,
      music: undefined,
      sigimShow: false,
      octave: 2,
      audioContext: null,
      playStatus: null // {playing: true/false, player}
    }
  },
  methods: {
    updateSigimShow() {
      // Need optimization for less call
      const main = this.music.get('col').main
      this.sigimShow =
        main &&
        main.pitch != null &&
        (typeof main.pitch === 'number' || main.pitch.length === 1)
    },
    moveRhythm(i) {
      this.music.trim()
      this.cursor.moveRhythm(0, i)
    },
    move(chapter, cell, row, col) {
      this.music.trim()
      this.cursor.move(chapter, cell, row, col)
    },
    write(where, obj) {
      if (this.cursor.blurred) return
      this.$set(this.music.get('col'), where, obj)
      this.updateSigimShow()
    },
    erase() {
      if (this.cursor.blurred) return
      this.music.del('col', 'keep')
      this.sigimShow = false
    },
    shapechange(what, delta) {
      if (this.cursor.blurred) return
      if (delta === +1) {
        this.music.add(what)
      } else {
        this.music.del(what)
      }
    },
    octavechange(delta) {
      this.octave += delta
    },
    addchapter() {
      this.music.addchapter()
    },
    play(command) {
      /*
      TODO:
      - 시간에 맞춰 쓰던 커서 움직이기
      */
      if (command === 'stop') {
        this.playStatus.player.stop()
        this.playStatus = null
        this.cursor.stopPlay()
      } else if (command === 'pause') {
        this.playStatus.playing = false
        this.playStatus.player.stop()
      } else if (this.playStatus) {
        this.playStatus.playing = true
        //this.playStatus.player.play()
      } else {
        let compiled = this.music.compile()
        this.audioContext = this.audioContext || new AudioContext()
        Soundfont.instrument(this.audioContext, 'cello').then(player => {
          this.playStatus = { player, playing: true }
          this.cursor.startPlay()
          player.schedule(0, compiled)
        })
      }
    },
    undo() {
      //
    },
    redo() {
      //
    },
    keypressRhythm(e) {
      if (e.code === 'ArrowUp') {
        if (this.cursor.cell > 0) {
          this.cursor.cell -= 1
        }
        e.preventDefault()
      } else if (e.code === 'ArrowDown') {
        if (this.cursor.cell < this.rhythm.length - 1) {
          this.cursor.cell += 1
        }
        e.preventDefault()
      }
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
          this.music.add('col')
          break
        case 'Backspace':
          this.music.backspace()
          break
        case 'Minus':
        case 'NumpadSubtract':
        case 'Delete': // ?
          this.erase()
          return
        case 'Enter':
        case 'NumpadEnter':
          if (e.ctrlKey) {
            this.music.chapterbreak()
          } else if (e.shiftKey) {
            this.music.rowbreak()
          } else {
            this.music.cellbreak()
          }
          break
        case 'Slash':
          if (this.octave > 0) {
            this.octave -= 1
          }
          return
        case 'Semicolon':
          if (this.octave < 4) {
            this.octave += 1
          }
          return
        case 'Comma':
          this.write('main', REST_OBJ)
          return
        default:
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
          }
          break
      }
      e.preventDefault()
    }
  },
  computed: {
    scaleSorted() {
      return this.setting.scale.map(Number).sort((a, b) => a - b)
    },
    view() {
      return this.music.view()
    }
  },
  created() {
    this.cursor = new Cursor(this.updateSigimShow)

    this.rhythm = new Array(this.setting.measure)
    this.rhythm[0] = RHYTHM_OBJ[1]

    this.music = new Music(this.cursor)
    this.music.addchapter({
      name: '초장',
      scale: this.scaleSorted,
      measure: this.setting.measure,
      tempo: this.setting.tempo,
      padding: 0 // -1 for align to prev
    })
    this.move(0, 0, 0, 0)
    this.write('main', YUL_OBJ[this.octave][0])

    document.addEventListener('keydown', this.keypressHandler)
  },
  components: {
    keypanel,
    menupanel,
    canvaspanel,
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
