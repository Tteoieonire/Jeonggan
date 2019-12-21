<template>
  <div>
    <keypanel
      v-model="rhythm[cursor.cell]"
      :cursor="cursor"
      :sigim_show="sigim_show"
      :scale="scale_sorted"
      :octave="octave"
      @write="write"
      @erase="erase"
      @shapechange="shapechange"
      @octavechange="octavechange"
      id="keypanel"
    ></keypanel>
    <menupanel id="menubar"></menupanel>
    <canvaspanel
      :cursor="cursor"
      :rhythm="rhythm"
      :view="view"
      @move="move"
      @move_rhythm="move_rhythm"
      id="workspace"
    ></canvaspanel>
    <configmodal v-model="setting"></configmodal>
  </div>
</template>

<script>
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
      octave: 2,
      sigim_show: false
    }
  },
  methods: {
    update_sigim_show() {
      // Need optimization for less call
      this.sigim_show = this.music.get('col').main != undefined
    },
    move_rhythm(i) {
      this.music.trim()
      this.cursor.move_rhythm(0, i)
    },
    move(chapter, cell, row, col) {
      this.music.trim()
      this.cursor.move(chapter, cell, row, col)
    },
    write(where, obj) {
      if (this.cursor.blurred) return
      this.$set(this.music.get('col'), where, obj)
      this.update_sigim_show()
    },
    erase() {
      if (this.cursor.blurred) return
      this.music.del('col', 'keep')
      this.sigim_show = false
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
    undo() {
      //
    },
    redo() {
      //
    },
    keypressHandler(e) {
      if (this.cursor.blurred) return
      if (this.cursor.select_mode) return
      if (this.cursor.rhythm_mode) return
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
        case 'Delete':
          this.music.del('col', 'keep')
          break
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
          break
        case 'Semicolon':
          if (this.octave < 4) {
            this.octave += 1
          }
          break
        case 'Comma':
          this.write('main', REST_OBJ)
          break
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
          if (idxPitch !== -1) {
            this.write('main', YUL_OBJ[this.octave][idxPitch])
            break
          }

          if (e.ctrlKey && e.code === 'KeyZ') {
            if (e.shiftKey) {
              this.redo()
            } else {
              this.undo()
            }
          }
      }
      e.preventDefault()
    }
  },
  computed: {
    scale_sorted() {
      return this.setting.scale.map(Number).sort((a, b) => a - b)
    },
    view() {
      return this.music.view()
    }
  },
  created() {
    this.cursor = new Cursor(this.update_sigim_show)

    this.rhythm = new Array(this.setting.measure)
    this.rhythm[0] = RHYTHM_OBJ[1]

    this.music = new Music(this.cursor)
    this.music.addchapter({
      name: '초장',
      scale: this.scale_sorted,
      measure: this.setting.measure
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
