class Cursor {
  constructor(afterMove) {
    this.blur()
    this.afterMove = afterMove
  }

  blur() {
    this.blurred = true
    this.rhythmMode = false
    this.chapter = undefined
    this.cell = undefined
    this.row = undefined
    this.col = undefined
  }

  move(chapter, cell, row, col) {
    this.blurred = false
    this.rhythmMode = false

    // payload
    this.chapter = chapter
    this.cell = cell
    this.row = row
    this.col = col

    this.afterMove && this.afterMove()
  }

  moveRhythm(chapter, cell) {
    this.blurred = false
    this.rhythmMode = true

    // payload
    this.chapter = chapter // unused for now
    this.cell = cell
    this.row = undefined
    this.col = undefined
  }
}

export default Cursor
