import { wrappedIdx, moveToMostAligned, inRange } from './utils.js'

class Chapter {
  constructor(cursor, config, cells) {
    this.cursor = cursor
    this.config = config
    this.cells = cells || []
  }
  /* all arrays, never length 0
  * 장 = [정간, ...]
  * 정간 = [행, ...] | undefined
  * 행 = [분박, ...]
  * 분박 = {main, modifier} | >>undefined<<
    - main, modifier = {text, pitch}
    - pitch null -> 쉼표
    - pitch 0 이상 정수 -> 음
    - pitch 문자열 -> 상대
  */

  view(lastPos) {
    const measure = this.config.measure
    const numGaks = Math.ceil(this.cells.length / measure)
    let gaks = []
    for (let i = 0; i < numGaks; i++) {
      let sliced = this.cells.slice(i * measure, (i + 1) * measure)
      gaks.push(sliced)
    }
    return gaks
  }

  compile(time = 0) {
    if (this.cells.length === 0) return [time]
    const cursorBackup = this.cursor
    this.cursor = this.cursor.cloneGhost()
    if (time > 0) this.focus(0, 0, 0)

    let notes = []
    do {
      let cur = this.get('col')
      let duration = this.colDuration()
      if (cur.main && cur.main.pitch) {
        notes.push({
          time,
          duration,
          main: cur.main,
          modifier: cur.modifier
        })
      } else if (notes.length > 0) {
        notes[notes.length - 1].duration += duration
      }
      time += duration
    } while (this.nextCol())

    this.cursor = cursorBackup
    notes.push(time)
    return notes
  }

  colDuration () {
    const fraction = this.get('cell').length * this.get('row').length
    return (60000 / this.config.tempo) / fraction
  } 

  nextCol() {
    let level = 'col'
    while (level !== 'cells') {
      let parent = this.get(parentOf(level))
      if (inRange(1 + this.cursor[level], parent)) {
        this.set(level, 1 + this.cursor[level])
        return true
      }
      level = parentOf(level)
    }
    return false
  }

  isEmpty() {
    return this.cells.every(cell => cell == undefined)
  }

  /* Operations */
  focus(cell, row, col) {
    cell = wrappedIdx(cell, this.cells.length)
    this.cursor.cell = cell
    row = wrappedIdx(row, this.get('cell').length)
    this.cursor.row = row
    col = wrappedIdx(col, this.get('row').length)
    this.cursor.move(this.cursor.chapter, cell, row, col)
  }

  get(what) {
    // ensure exist @ every focus & cache col?
    // This one makes sure you DO get something valid.
    let el = this.cells
    if (what === 'cells') return el

    if (el[this.cursor.cell] == undefined) {
      el.splice(this.cursor.cell, 1, [new Array(1)])
    }
    el = el[this.cursor.cell]
    if (what === 'cell') return el

    if (el[this.cursor.row] == undefined) {
      el.splice(this.cursor.row, 1, new Array(1))
    }
    el = el[this.cursor.row]
    if (what === 'row') return el

    if (el[this.cursor.col] == undefined) {
      el.splice(this.cursor.col, 1, {})
    }
    el = el[this.cursor.col]
    return el
  }

  set(what, where, magnet = 0) {
    if (what === 'cell') {
      this.focus(where, magnet, magnet)
    } else if (what === 'row') {
      this.focus(this.cursor.cell, where, magnet)
    } else {
      this.focus(this.cursor.cell, this.cursor.row, where)
    }
  }

  add(what) {
    const arr = this.get(parentOf(what))
    const destPos = 1 + this.cursor[what]
    arr.splice(destPos, 0, undefined)
    this.set(what, destPos)
  }

  del(what, method = '') {
    if (what === 'cells') throw 'delchapter'
    const arr = this.get(parentOf(what))
    const idx = this.cursor[what]
    if (method === 'keep') {
      return arr.splice(idx, 1, undefined)
    } else if (arr.length === 1) {
      return this.del(parentOf(what), method)
    } else {
      if (idx === arr.length - 1 && method !== 'unsafe') {
        this.set(what, idx - 1, -1)
      }
      return arr.splice(idx, 1)
    }
  }

  trim() {
    if (this.cursor.blurred) return
    const el = this.get('cell')
    if (el.length > 1) return
    if (el[0].length > 1) return
    if (el[0][0] && el[0][0].main) return
    this.cells.splice(this.cursor.cell, 1, undefined)
  }

  /* Methods: desirably a sequence of valid ops */
  del_keep(what) {
    const cell = this.get(parentOf(what))
    if (cell.length === 1) {
      this.del(what, 'keep')
    } else {
      this.del(what)
    }
  }

  moveUpDown(delta) {
    // up - down +
    const magnet = delta > 0 ? 0 : -1

    const srcDivision = this.get('row').length
    const srcCol = this.cursor.col
    let destPos = this.cursor.row + delta
    this.trim()
    if (inRange(destPos, this.get('cell'))) {
      this.set('row', destPos)
    } else {
      destPos = this.cursor.cell + delta
      if (inRange(destPos, this.cells)) {
        this.set('cell', destPos, magnet)
      } else throw RangeError('Out of chapter')
    }
    const destDivision = this.get('row').length
    destPos = moveToMostAligned(srcCol, srcDivision, destDivision)
    this.set('col', destPos)
  }

  moveLeftRight(delta) {
    // left - right +
    let destPos = this.cursor.col + delta
    if (inRange(destPos, this.get('row'))) {
      this.set('col', destPos)
      return
    }
    const magnet = delta > 0 ? 0 : -1
    destPos = this.cursor.cell - delta * this.config.measure
    if (inRange(destPos, this.cells)) {
      this.focus(destPos, magnet, magnet)
    } else throw RangeError('Out of chapter')
  }
}

function parentOf(what) {
  if (what === 'cell') return 'cells'
  if (what === 'row') return 'cell'
  return 'row'
}

function childOf(what) {
  if (what === 'cell') return 'row'
  if (what === 'row') return 'col'
  throw 'what??'
}

export default Chapter

/*
  compile(time = 0) {
    let cells = this.cells
    if (time === 0) {
      // first chapter to start
      cells = cells.slice(this.cursor.cell)
    }
    let duration = (60 * cells.length) / this.config.tempo // s
    let compiled = compileChapter(cells, time, duration, this.config.scale) // lastPitch?
    compiled.push(time + duration) // also return total time time
    return compiled
  }
 */