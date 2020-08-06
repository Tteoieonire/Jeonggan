class Cursor {
  constructor(afterMove) {
    this.blur()
    this.rhythmMode = false
    this.playMode = false
    this.eventlisteners = {} // before/after chapter/cell/col change
  }

  blur() {
    this.blurred = true
    this.chapter = undefined
    this.cell = undefined
    this.row = undefined
    this.col = undefined
  }

  checkChanges(newRhythmMode, newChapter, newCell, newRow, newCol) {
    let changes = {}
    changes.rhythmMode = this.blurred || this.rhythmMode !== newRhythmMode
    changes.chapter = this.blurred || this.chapter !== newChapter
    changes.cell =
      changes.rhythmMode || changes.chapter || this.cell !== newCell
    changes.row = changes.cell || this.row !== newRow
    changes.col = changes.row || this.col !== newCol
    return changes
  }

  on(change, f) {
    this.eventlisteners[change] = f
  }

  dispatchEvents(changes, time = 'before') {
    if (this.playMode) return
    ;[ // bottom up
      changes.col && time + 'ColChange',
      changes.row && time + 'RowChange',
      changes.cell && time + 'CellChange',
      changes.chapter && time + 'ChapterChange',
      changes.rhythmMode && time + 'RhythmModeChange'
    ]
      .map(event => this.eventlisteners[event])
      .forEach(f => f && f())
  }

  _move(newRhythmMode, newChapter, newCell, newRow, newCol) {
    const changes = this.checkChanges(...arguments)
    this.dispatchEvents(changes, 'before')

    this.blurred = false
    this.rhythmMode = newRhythmMode
    this.chapter = newChapter
    this.cell = newCell
    this.row = newRow
    this.col = newCol
    this.dispatchEvents(changes, 'after')
  }

  move(chapter, cell, row, col) {
    this._move(false, chapter, cell, row, col)
  }

  moveRhythm(chapter, cell) {
    this._move(true, chapter, cell)
  }

  startPlay() { // trimLast(true)??
    this.playMode = true
    this.prevPos = [this.chapter, this.cell, this.row, this.col]
  }

  stopPlay() {
    this.playMode = false
    this.move(...this.prevPos)
    this.prevPos = undefined
  }

  clone() {
    let ghost = new Cursor()
    ghost.blurred = this.blurred
    ghost.rhythmMode = this.rhythmMode
    ghost.playMode = this.playMode
    ghost.chapter = this.chapter
    ghost.cell = this.cell
    ghost.row = this.row
    ghost.col = this.col
    ghost.prevPos = this.prevPos
    return ghost
  }

  loadFrom(other) {
    if (other.blurred) this.blur()
    if (other.playMode) {
      this.playMode = other.playMode
      this.prevPos = other.prevPos
    }
    this._move(other.rhythmMode, other.chapter, other.cell, other.row, other.col)
  }

  log() {
    console.log('blurred', this.blurred)
    console.log('rhythmMode', this.rhythmMode)
    console.log('playMode', this.playMode)
    console.log('chapter', this.chapter)
    console.log('cell', this.cell)
    console.log('row', this.row)
    console.log('col', this.col)
  }
}

export default Cursor
