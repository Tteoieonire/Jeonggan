class Cursor {
  constructor(afterMove) {
    this.blur()
    this.rhythmMode = false
    this.playMode = false
    this.afterMove = afterMove
  }

  blur() {
    this.blurred = true
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

  startPlay() {
    this.playMode = true
    this.prevPos = [this.chapter, this.cell, this.row, this.col, this.afterMove]
    this.afterMove = null
  }

  stopPlay() {
    this.playMode = false
    this.afterMove = this.prevPos.pop()
    this.move(...this.prevPos)
    this.prevPos = undefined
  }

  cloneGhost() {
    let ghost = new Cursor() // but no aftermove
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
}

export default Cursor
