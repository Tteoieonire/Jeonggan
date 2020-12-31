import Chapter from './chapter.js'
import { render } from './renderer.js'
import { wrappedIdx, inRange, moveToMostAligned, clone } from './utils.js'

class Music {
  // 내용은 신경x 형식만 관리!
  constructor(cursor, chapters) {
    this.cursor = cursor
    this.chapters = chapters || []
  }

  view() {
    const maxMeasure = Math.max(
      ...this.chapters.map(chapter => chapter.config.measure)
    )
    const gaks = [].concat(
      ...this.chapters.map((chapter, i) => chapter.view(i))
    )
    return { gaks, maxMeasure }
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

  stepCol(delta = +1) {
    if (this.get('chapter').stepCol(delta)) return true
    let destChapter = this.cursor.chapter + delta
    if (!inRange(destChapter, this.chapters)) return false
    this.set('chapter', destChapter, delta > 0 ? 0 : -1)
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

  /* Add & Delete */
  addchapter(chapter) {
    let destChapter = this.chapters.length
    if (!this.cursor.blurred) {
      destChapter = 1 + this.cursor.chapter
    }
    if (!chapter) {
      chapter = new Chapter(this.cursor, newConfigFrom(this.get('chapter').config))
    }

    this.chapters.splice(destChapter, 0, chapter)
    this.cursor.move(destChapter, 0, 0, 0)
  }

  delchapter(i) {
    const curchapter = this.cursor.chapter
    if (i === undefined) i = curchapter
    if (curchapter === i) this.cursor.blur()

    let deleted = this.chapters.splice(i, 1)[0]
    if (this.chapters.length === 0) {
      let newchapter = new Chapter(this.cursor, clone(deleted.config))
      this.addchapter(newchapter)
    }
    if (curchapter > i) {
      this.cursor.chapter -= 1
    } else if (curchapter === i) {
      if (i >= this.chapters.length) i--
      this.set('chapter', i)
    }
    return deleted
  }

  add(what, obj, position) {
    if (what === 'chapter') {
      this.addchapter(obj)
    } else {
      this.get('chapter').add(what, obj, position)
    }
  }

  del(what) {
    if (what === 'chapter') {
      return this.delchapter(this.cursor.chapter)
    } else {
      return this.get('chapter').del(what)
    }
  }

  erase() {
    this.get('chapter').erase()
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
      this.set('chapter', destPos, delta > 0? -1: 0) // TODO: adds an extra cell at the end!

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

  mergeLater(what) {
    const chapter = this.get('chapter')
    if (what === 'chapter') {
      let deleted = this.chapters.splice(this.cursor.chapter + 1, 1)[0]
      chapter.cells.push(...deleted.cells)
      chapter.mergeLater('cell')
      return deleted.config
    } else {
      chapter.mergeLater(what)
    }
  }

  backspace() {
    /** Returns a function for undo. */
    const chapter = this.get('chapter')
    const delim = chapter.getDelimiter(-1)
    if (!delim) throw 'Function `backspace` encountered non-empty col'
    this.stepCol(-1)
    const old = this.mergeLater(delim)
    this.get('row').splice(this.cursor.col + 1, 1)
    if (delim === 'chapter') {
      return () => this.chapterbreak(old, 'after')
    }
    return () => this[delim + 'break']('after')
  }

  deletekey() {
    /** Returns a function for undo. */
    const chapter = this.get('chapter')
    const delim = chapter.getDelimiter(+1)
    if (!delim) throw 'Function `deletekey` encountered non-empty col'
    const old = this.mergeLater(delim)
    this.get('row').splice(this.cursor.col, 1)
    if (delim === 'chapter') {
      return () => this.chapterbreak(old, 'before')
    }
    return () => this[delim + 'break']('before')
  }

  colbreak(position='after') {
    this.add('col', undefined, position === 'after'? 1: 0)
  }

  rowbreak(position='after') {
    if (position === 'before') this.add('col', undefined, 0)
    let newrow = this.get('row').splice(this.cursor.col + 1)
    if (position === 'after') newrow.unshift(undefined)
    this.add('row', newrow)
  }

  cellbreak(position='after') {
    if (position === 'before') this.add('col', undefined, 0)
    let newrow = this.get('row').splice(this.cursor.col + 1)
    if (position === 'after') newrow.unshift(undefined)

    let newcell = this.get('cell').splice(this.cursor.row + 1)
    newcell.unshift(newrow)

    this.add('cell', newcell)
  }

  chapterbreak(config, position='after') {
    if (position === 'before') this.add('col', undefined, 0)
    let newrow = this.get('row').splice(this.cursor.col + 1)
    if (position === 'after') newrow.unshift(undefined)

    let newcell = this.get('cell').splice(this.cursor.row + 1)
    newcell.unshift(newrow)

    let chapter = this.get('chapter')
    let newcells = chapter.cells.splice(this.cursor.cell + 1)
    newcells.unshift(newcell)

    if (!config) config = newConfigFrom(chapter.config)
    let newchapter = new Chapter(this.cursor, config, newcells)
    this.add('chapter', newchapter)
  }
}

function newConfigFrom(config) {
  config = clone(config)
  config.name = '새 장'
  config.rhythm = config.rhythm.slice()
  config.hideRhythm = true
  config.padding = 0 // -1?
  return config
}

export default Music
