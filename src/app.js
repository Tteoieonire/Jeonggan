import Vue from 'vue'
import BootstrapVue from 'bootstrap-vue'

import keypad from './components/keypad.vue'
import sigimpad from './components/sigimpad.vue'
import sympad from './components/sympad.vue'
import './index.css'

Vue.use(BootstrapVue)

const RHYTHM = [null, '떵', '쿵', '덕', '따닥', '더러러러', '따']

/**
* User Input (Click) -> Custom Event(write)
*/
// 흐릿한 새 각 클릭으로 각 추가.
var app = new Vue({
  el: '#app',
  data: {
    RHYTHM: RHYTHM,

    setting: {
      id: 0,
      title: '만파정식',
      scale: ['0', '2', '4', '9', '7'], // use scale_sorted instead
      measure: 12
    },
    mode: 'input', // rhythm, input, select?, play?
    rhythm: undefined,

    cursor: { gak: 0, cell: 0, row: 0, col: 0 },
    gaks: []
    /* all arrays, never length 0
    * 각 = [정간, ...].
    * 정간 = [행, ...] | undefined
    * 행 = [분박, ...]
    * 분박 = {main, modifier} | >>undefined<<
      - main, modifier = {text, pitch}
      - pitch null -> 쉼표
      - pitch 0 이상 정수 -> 음
      - pitch 문자열 -> 상대
    */
  },
  methods: {
    get(what) {
      // This one makes sure you DO get something valid.
      var el = this.gaks[this.cursor.gak]
      if (what === 'gak') return el

      if (el[this.cursor.cell] === undefined) { this.$set(el, this.cursor.cell, [new Array(1)]) }
      el = el[this.cursor.cell]
      if (what === 'cell') return el

      if (el[this.cursor.row] === undefined) { this.$set(el, this.cursor.row, new Array(1)) }
      el = el[this.cursor.row]
      if (what === 'row') return el

      if (el[this.cursor.col] === undefined) { this.$set(el, this.cursor.col, {}) }
      el = el[this.cursor.col]
      return el
    },
    move(gak, cell, row, col) {
      this.trim()
      this.mode = 'input'
      this.cursor = { gak, cell, row, col }
    },
    trim() {
      if (this.mode !== 'input') return

      var el = this.get('cell')
      if (el.length > 1) return
      if (el[0].length > 1) return
      if (el[0][0] && el[0][0].main) return
      this.$set(this.get('gak'), this.cursor.cell, undefined)
    },
    here(gak, cell, row, col) {
      if (this.mode === 'rhythm') return false
      if (gak !== this.cursor.gak) return false
      if (cell !== this.cursor.cell) return false
      if (row === undefined) return true
      if (row !== this.cursor.row) return false
      return (col === this.cursor.col)
    },
    padpress(where, obj) {
      var el = this.get()
      this.$set(el, where, obj)
    },
    erase() {
      var row = this.get('row')
      this.$set(row, this.cursor.col, undefined)
    },
    addgak() {
      var gak = new Array(this.setting.measure)
      if (this.mode !== 'input') {
        this.gaks.push(gak)
      } else {
        this.gaks.splice(1 + this.cursor.gak, 0, gak)
      }
    },
    delgak(i) {
      this.gaks.splice(i, 1)
      if (this.gaks.length === 0) {
        this.addgak()
      } else if (this.mode === 'input' &&
        this.cursor.gak >= this.gaks.length) {
        this.$set(this.cursor, 'gak', this.gaks.length - 1)
        this.$set(this.cursor, 'row', 0)
        this.$set(this.cursor, 'col', 0)
      }
    },
    addrow() {
      var cell = this.get('cell')
      cell.splice(1 + this.cursor.row, 0, new Array(1))
      this.$set(this.cursor, 'row', 1 + this.cursor.row)
      this.$set(this.cursor, 'col', 0)
    },
    delrow() {
      var cell = this.get('cell')
      if (cell.length === 1) {
        cell.splice(0, 1, new Array(1))
      } else {
        cell.splice(this.cursor.row, 1)
        if (this.cursor.row === cell.length) {
          this.$set(this.cursor, 'row', this.cursor.row - 1)
        }
      }
      if (this.get('row').length <= this.cursor.col) {
        this.$set(this.cursor, 'col', this.get('row').length - 1)
      }
    },
    addcol() {
      var row = this.get('row')
      row.splice(1 + this.cursor.col, 0, undefined)
      this.$set(this.cursor, 'col', 1 + this.cursor.col)
    },
    delcol() {
      var row = this.get('row')
      if (row.length === 1) {
        row.splice(0, 1, undefined)
      } else {
        row.splice(this.cursor.col, 1)
        if (this.cursor.col === row.length) {
          this.$set(this.cursor, 'col', this.cursor.col - 1)
        }
      }
    },

    // 장단
    move_rhythm(i) {
      this.trim()
      this.mode = 'rhythm'
      this.cursor = i
    }
  },
  computed: {
    scale_sorted() {
      console.log(this.setting.scale)
      return this.setting.scale.map(Number).sort((a, b) => a - b)
    },
    sigim_show() {
      return this.get().main !== undefined
    }
  },
  created() {
    this.addgak()
    this.move(0, 0, 0, 0)
    this.padpress('main', { text: '&#22826;', pitch: 26 })

    this.rhythm = new Array(this.setting.measure)
    this.rhythm[0] = '떵'
  },
  components: {
    keypad, sigimpad, sympad
  }
})
