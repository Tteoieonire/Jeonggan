import { wrappedIdx, moveToMostAligned, inRange } from './utils.js'

class Chapter {
  constructor(cursor, config, cells) {
    this.cursor = cursor
    this.config = config
    this.cells = cells || new Array(1)
  }

  view(chapterIndex) {
    const measure = this.config.measure
    let padding = this.config.padding
    if (padding >= measure) padding = 0

    let gaks = []
    if (!this.config.hideRhythm) {
      gaks.push({
        rhythm: true,
        content: this.config.rhythm,
        chapterIndex: chapterIndex,
        isFirst: true,
        title: this.config.name,
      })
    }

    const numGaks = Math.ceil((this.cells.length + padding) / measure)
    for (let i = 0; i < numGaks; i++) {
      const bgn = Math.max(0, i * measure - padding)
      const sliced = this.cells.slice(bgn, (i + 1) * measure - padding)
      gaks.push({
        rhythm: false,
        content: sliced,
        chapterIndex: chapterIndex,
        gakIndex: i,
        measure: measure,
        isFirst: this.config.hideRhythm && i === 0,
        title: this.config.name,
        padding: padding,
      })
    }
    return gaks
  }

  convertConfigToMidi() {
    let events = []
    const msPerBeat = 60000 / this.config.tempo
    events.push({
      type: 'setTempo',
      microsecondsPerBeat: (1000 * msPerBeat) | 0,
      deltaTime: 0,
    })
    events.push({
      type: 'timeSignature',
      metronome: this.config.measure,
      numerator: this.config.measure,
      denominator: chooseTimeSignatureDenominator(this.config.measure),
      deltaTime: 0,
    })
    events.push({
      type: 'keySignature',
      key: chooseKeySignature(this.config.scale),
      scale: 0,
      deltaTime: 0,
    })
    return events
  }

  convertToNotes(time = 0, fromBeginning = false, ticksPerCell = 0) {
    if (this.cells.length === 0) return { time, notes: [] }
    const cursorBackup = this.cursor
    this.cursor = this.cursor.clone()
    if (fromBeginning || time > 0) this.focus(0, 0, 0)

    let notes = []
    let ongoing = false
    do {
      let cur = this.get('col')
      let duration = this.colDuration(ticksPerCell)
      if (cur.main) {
        ongoing = !!cur.main.pitch // no ongoing if rest
        if (ongoing) {
          notes.push({
            time,
            duration,
            main: cur.main,
            modifier: cur.modifier,
            head_duration: duration,
          })
        }
      } else if (ongoing) {
        notes[notes.length - 1].duration += duration
      }
      time += duration
    } while (this.stepCol())

    this.cursor = cursorBackup
    return { time, notes }
  }

  colDuration(ticksPerCell = 0) {
    if (!ticksPerCell) ticksPerCell = 60000 / this.config.tempo // milliseconds
    const fraction = this.get('cell').length * this.get('row').length
    return ticksPerCell / fraction
  }

  stepCol(delta = +1) {
    let level = 'col'
    while (level !== 'cells') {
      let parent = this.get(parentOf(level))
      let destPos = this.cursor[level] + delta
      if (inRange(destPos, parent)) {
        this.set(level, destPos, delta > 0 ? 0 : -1)
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
    this.cursor.move(this.cursor.chapter, cell, 0, 0)
    row = wrappedIdx(row, this.get('cell').length)
    this.cursor.move(this.cursor.chapter, cell, row, 0)
    col = wrappedIdx(col, this.get('row').length)
    this.cursor.move(this.cursor.chapter, cell, row, col)
  }

  get(what) {
    // This makes sure you DO get something valid.
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

  add(what, obj, position = 1) {
    const destPos = this.cursor[what] + position
    this.get(parentOf(what)).splice(destPos, 0, obj)
    this.set(what, destPos)
  }

  del(what) {
    // shapechange
    if (what === 'cells') throw 'delchapter'
    const arr = this.get(parentOf(what))
    const idx = this.cursor[what]
    if (arr.length === 1) {
      var old = arr.splice(idx, 1, undefined)[0]
      return () => this.get(parentOf(what)).splice(idx, 1, old)
    }
    if (idx === arr.length - 1) {
      this.set(what, idx - 1, -1)
    }
    old = arr.splice(idx, 1)[0]
    return () => this.get(parentOf(what)).splice(idx, 0, old)
  }

  getDelimiter(direction = +1) {
    if (this.get('col').main) return ''
    if (inRange(this.cursor.col + direction, this.get('row'))) return 'col'
    if (inRange(this.cursor.row + direction, this.get('cell'))) return 'row'
    if (inRange(this.cursor.cell + direction, this.get('cells'))) return 'cell'
    return 'chapter'
  }

  erase() {
    return this.get('row').splice(this.cursor.col, 1, undefined)[0]
  }

  trim() {
    if (this.cursor.blurred) return
    if (this.cursor.rhythmMode) return
    const el = this.get('cell')
    if (!isEmptyCell(el)) return
    this.cells.splice(this.cursor.cell, 1, undefined)
  }

  mergeLater(what) {
    // set(what, ##, -1)
    if (what === 'col') return
    const preyPos = this.cursor[what] + 1
    const parent = this.get(parentOf(what))
    if (!inRange(preyPos, parent)) return
    const childs = parent.splice(preyPos, 1)[0]
    if (childs) this.get(what).push(...childs)
    this.mergeLater(childOf(what))
  }

  /* Methods: desirably a sequence of valid ops */
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
      const srcDivision = this.get('cell').length
      const srcPos = this.cursor.row
      this.set('cell', destPos, magnet)
      const destDivision = this.get('cell').length
      destPos = moveToMostAligned(srcPos, srcDivision, destDivision)
      this.set('row', destPos, magnet)
    } else if (
      this.whichGak(destPos) === this.whichGak(this.cells.length - 1)
    ) {
      this.set('cell', -1, magnet)
    } else throw RangeError('Out of chapter')
  }

  whichGak(cell) {
    return Math.floor((cell + this.config.padding) / this.config.measure)
  }
}

function isEmptyCell(cell) {
  if (!cell) return true
  if (cell.length > 1) return false
  if (cell[0].length > 1) return false
  if (cell[0][0] && cell[0][0].main) return false
  return true
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

function chooseTimeSignatureDenominator(numerator) {
  if (numerator === 12) return 8
  const log = Math.log2((numerator * 4) / 3) | 0
  return Math.pow(2, log)
}

function chooseKeySignature(scale) {
  // [D#, E, F, F#, G, G#, A, A#, B, C, C#, D]
  const needAccidentalInKey = {
    '-6': [0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1],
    '-5': [0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1],
    '-4': [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1],
    '-3': [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0],
    '-2': [0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0],
    '-1': [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0],
    '0': [1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0],
    '1': [1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0],
    '2': [1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0],
    '3': [1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0],
    '4': [0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1],
    '5': [0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1],
  }
  let minAccidentals = 12
  let bestKey = 0
  for (const key in needAccidentalInKey) {
    let numAccidentals = scale
      .map(x => needAccidentalInKey[key][x])
      .reduce((a, b) => a + b)
    if (numAccidentals < minAccidentals) {
      bestKey = +key
      minAccidentals = numAccidentals
    } else if (numAccidentals === minAccidentals) {
      if (Math.abs(+key) < Math.abs(bestKey)) bestKey = +key
    }
  }
  return bestKey
}

export default Chapter
