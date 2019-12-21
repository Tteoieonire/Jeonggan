class Cursor { // exists only one...nothing but container
  constructor(after_move) {
    this.blurred = true
    this.after_move = after_move

    this.select_mode = false
    this.rhythm_mode = false
    this.chapter = undefined
    this.cell = undefined
    this.row = undefined
    this.col = undefined
  }

  move(chapter, cell, row, col) {
    this.blurred = false

    this.select_mode = false
    this.rhythm_mode = false
    this.chapter = chapter
    this.cell = cell
    this.row = row
    this.col = col

    this.after_move()
  }

  move_rhythm(chapter, cell) {
    this.blurred = false

    this.select_mode = false
    this.rhythm_mode = true
    this.chapter = chapter // unused for now
    this.cell = cell
    this.row = undefined
    this.col = undefined
  }
}

export default Cursor