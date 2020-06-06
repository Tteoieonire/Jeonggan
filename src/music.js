import Chapter from './chapter.js'
import { render } from './renderer.js'
import { wrappedIdx, inRange, moveToMostAligned } from './utils.js'

class Music {
  // 내용은 신경x 형식만 관리!
  constructor(cursor, chapters) {
    this.cursor = cursor
    this.chapters = chapters || []
  }

  view() {
    const maxMeasure = Math.max(...this.chapters.map(chapter => chapter.config.measure))
    const gaks = [].concat(...this.chapters.map((chapter, i) => chapter.view(i)))
    return {gaks, maxMeasure}
  }

  render() {
    let bgn = this.cursor.blurred ? 0 : this.cursor.chapter
    let rendered = this.chapters.slice(bgn).reduce(
      function(acc, chapter) {
        let elapsed = acc.pop()
        let compiled = chapter.compile(elapsed)
        elapsed = compiled.pop()
        let rendered = render(compiled, chapter.config.scale)
        return acc.concat(rendered, [elapsed])
      },
      [0]
    )
    rendered.pop()
    return rendered
  }

  nextCol() {
    if (this.get('chapter').nextCol()) return true
    if (!inRange(1 + this.cursor.chapter, this.chapters)) return false
    this.set('chapter', 1 + this.cursor.chapter)
    return true
  }

  /* Operations */
  get(what) {
    // ensure exist @ every focus & cache col?
    // This one makes sure you DO get something valid.
    if (this.cursor.blurred) {
      throw Error('Unable to get' + what + ' in Music')
    }
    const el = this.chapters[this.cursor.chapter]
    if (what === 'chapter') return el
    return el.get(what)
  }

  set(what, where, magnet = 0) {
    if (what === 'chapter') {
      where = wrappedIdx(where, this.chapters.length)
      this.cursor.move(where, 0, 0, 0)
      this.get('chapter').focus(magnet, magnet, magnet)
    } else {
      this.get('chapter').set(what, where, magnet)
    }
  }

  trim() {
    if (this.cursor.blurred) return
    this.get('chapter').trim()
  }

  trimLast(cruel) {
    if (this.cursor.blurred) return
    this.get('chapter').trimLast(cruel)
  }

  trimChapter() {
    // if (this.get('chapter').isEmpty()) {
    //   this.del('chapter') // what TODO
    // } else
    this.trimLast(true)
  }

  /* Add & Delete */
  addchapter(config) {
    let dest_chapter = this.chapters.length
    if (!this.cursor.blurred) {
      dest_chapter = 1 + this.cursor.chapter
    }
    if (!config) {
      config = _clone(this.get('chapter').config)
      config.name = '새 장'
      config.rhythm = null
      config.padding = 0 // -1?
    }

    const cells = new Array(2)
    const chapter = new Chapter(this.cursor, config, cells)

    this.chapters.splice(dest_chapter, 0, chapter)
    this.cursor.move(dest_chapter, 0, 0, 0)
  }

  delchapter(i) {
    const curchapter = this.cursor.chapter
    if (curchapter === i) {
      this.cursor.blur()
    }
    let deleted = this.chapters.splice(i, 1)[0]
    if (this.chapters.length === 0) {
      this.addchapter(_clone(deleted.config))
    }
    if (curchapter > i) {
      this.cursor.chapter -= 1
    } else if (curchapter === i) {
      if (i >= this.chapters.length) i--
      this.set('chapter', i)
    }
    return deleted
  }

  add(what) {
    if (what === 'chapter') {
      this.addchapter()
    } else {
      this.get('chapter').add(what)
    }
  }

  del(what, method = '') {
    if (what === 'chapter') {
      return this.delchapter(this.cursor.chapter)
    } else {
      return this.get('chapter').del(what, method)
    }
  }

  /* keyboard move */
  moveUpDown(delta) {
    // up - down +
    try {
      this.get('chapter').moveUpDown(delta)
    } catch (e) {
      if (!(e instanceof RangeError)) throw e

      // let destPos = this.cursor.chapter + delta
      // if (inRange(destPos, this.chapters)) {
      //   const magnet = delta > 0 ? 0 : -1
      //   this.set('chapter', destPos, magnet)
      // } // else do nothing
    }
  }

  moveLeftRight(delta) {
    // left - right +
    let chapter = this.get('chapter')
    let config = chapter.config
    try {
      chapter.moveLeftRight(delta)
    } catch (e) {
      if (!(e instanceof RangeError)) throw e

      // set chapter
      let destPos = this.cursor.chapter - delta
      if (!inRange(destPos, this.chapters)) return // do nothing

      const srcY = (this.cursor.cell + config.padding) % config.measure
      const srcRow = this.cursor.row
      const srcDivision = this.get('cell').length
      this.set('chapter', destPos, -1) // TODO: adds an extra cell at the end!
      // also TODO: sometimes I lose focus and get stuck

      // set cell
      chapter = this.get('chapter')
      config = chapter.config
      if (delta < 0) {
        destPos = srcY - config.padding
      } else {
        let tail = (chapter.cells.length + config.padding) % config.measure
        destPos = chapter.cells.length - tail + srcY
      }
      if (destPos >= chapter.cells.length) {
        destPos = chapter.cells.length - 1
        this.set('cell', destPos, -1)
        return
      }
      if (destPos < 0) destPos = 0
      this.set('cell', destPos)

      // set row
      const destDivision = this.get('cell').length
      destPos = moveToMostAligned(srcRow, srcDivision, destDivision)
      this.set('row', destPos, delta > 0 ? 0 : -1)
    }
  }

  backspace() {
    // chapter-break는 문자 취급하자(...?)
    // row-break랑 cell-break도..??
    let old = this.del('col', 'unsafe')

    // 커서 처리
    if (this.cursor.col > 0) {
      this.set('col', this.cursor.col - 1, -1)
    } else if (this.cursor.row > 0) {
      this.set('row', this.cursor.row - 1, -1)
    } else if (this.cursor.cell > 0) {
      this.set('cell', this.cursor.cell - 1, -1)
    } else if (this.cursor.chapter > 0) {
      this.set('chapter', this.cursor.chapter - 1, -1)
    }
    return old
  }

  rowbreak() {
    let row = this.get('row')
    if (this.cursor.col + 1 < row.length) {
      row = row.splice(this.cursor.col + 1)
    } else {
      row = new Array(1)
    }
    this.get('cell').splice(1 + this.cursor.row, 0, row)
    this.set('row', 1 + this.cursor.row)
  }

  cellbreak() {
    let cell = this.get('cell')
    if (this.cursor.row + 1 < cell.length) {
      cell = cell.splice(this.cursor.row + 1)
    } else {
      cell = []
    }

    let row = this.get('row')
    let cols_after = new Array(1)
    if (this.cursor.col + 1 < row.length) {
      cols_after = row.splice(this.cursor.col + 1)
    }

    cell.unshift(cols_after)
    this.get('cells').splice(1 + this.cursor.cell, 0, cell)
    this.set('cell', 1 + this.cursor.cell)
  }

  chapterbreak() {
    //
  }
}

function _clone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

export default Music
