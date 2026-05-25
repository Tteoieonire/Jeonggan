import type { RhythmTick } from '../constants'
import Cursor from '../navigation/cursor'
import {
  addRhythmRow as addEditorRhythmRow,
  currentRhythmTick as getCurrentEditorRhythmTick,
  delRhythmRow as deleteEditorRhythmRow,
  eraseRhythmTick as eraseEditorRhythmTick,
  writeRhythmTick as writeEditorRhythmTick,
} from './rhythm-editing'
import {
  cutEntry as cutEditorEntry,
  cutRange as cutEditorRange,
  delRange as deleteEditorRange,
  isEmptyCell as isEditorCellEmpty,
  isEmptyRange as isEditorRangeEmpty,
  pasteEntry as pasteEditorEntry,
  pasteRange as pasteEditorRange,
} from './selection-editing'
import { MusicSelector } from '../navigation/selector'
import {
  addElement,
  delElement,
  eraseElement,
  writeElement,
} from './structure-editing'
import { inRange } from '../utils'
import {
  ElementOf,
  Entry,
  idOp,
  PARENT_OF,
  SNAP,
  UndoOp,
  _make,
} from '../navigation/viewer'

export class MusicEditor extends MusicSelector {
  /* Button action */
  add<T extends keyof typeof PARENT_OF>(what: T, obj?: ElementOf[T]): UndoOp {
    return addElement(this, what, obj)
  }
  addRhythmRow(): UndoOp {
    return addEditorRhythmRow(this)
  }

  del(what: keyof typeof PARENT_OF): UndoOp {
    return delElement(this, what)
  }
  delRhythmRow() {
    return deleteEditorRhythmRow(this)
  }
  currentRhythmTick(): RhythmTick {
    return getCurrentEditorRhythmTick(this)
  }

  writeRhythmTick(tick: RhythmTick): UndoOp {
    return writeEditorRhythmTick(this, tick)
  }

  eraseRhythmTick(): UndoOp {
    return eraseEditorRhythmTick(this)
  }

  write<T extends keyof typeof PARENT_OF>(what: T, obj: ElementOf[T]): UndoOp {
    return writeElement(this, what, obj)
  }

  erase(what: keyof typeof PARENT_OF = 'col'): UndoOp {
    return eraseElement(this, what)
  }

  /* Complex actions */
  private merge(): UndoOp {
    const what = this.getDelimiter()
    const preyPos = this.cursor[what] + 1
    const parentLevel = PARENT_OF[what]
    const parent = this.get(parentLevel).data
    if (!inRange(preyPos, parent)) return idOp

    const prey = parent.splice(preyPos, 1)[0] as any
    let undo: UndoOp = idOp
    if (what !== 'col') {
      this.get(what).data.push(...prey.data)
      undo = this.merge()
    }
    return () => {
      undo()
      const parent = this.get(parentLevel).data
      if (what !== 'col')
        this.get(what).data.splice(-prey.data.length, prey.data.length)
      parent.splice(preyPos, 0, prey)
    }
  }

  /* Keyboard actions */
  backspace(): UndoOp {
    if (this.get('col').data.main != null) return this.erase()

    if (!(this.stepCol(-1) || this.stepChapter(-1))) return idOp
    const undo = this.merge()
    return () => {
      undo()
      this.stepCol(+1) || this.stepChapter(+1)
    }
  }

  deletekey(): UndoOp {
    if (this.get('col').data.main != null) return this.erase()

    for (const level of ['col', 'row', 'cell', 'chapter'] as const) {
      if (this.cursor[level] + 1 < this.get(PARENT_OF[level]).data.length)
        return this.del(level)

      if (this.cursor[level] > 0) {
        const undo = this.del(level)
        this.stepCol(+1) || this.stepChapter(+1)
        return () => {
          this.stepCol(-1) || this.stepChapter(-1)
          undo()
        }
      }
    }
    return idOp
  }

  /* Selection actions */
  isEmptyCell(position: Cursor): boolean {
    return isEditorCellEmpty(this, position)
  }

  isEmptyRange(): boolean {
    return isEditorRangeEmpty(this)
  }

  delRange(): UndoOp {
    return deleteEditorRange(this)
  }

  cutEntry(): [Entry, UndoOp] {
    return cutEditorEntry(this)
  }
  cutRange(): [Entry[][][], UndoOp] {
    return cutEditorRange(this)
  }

  pasteEntry(entry: Entry): UndoOp {
    return pasteEditorEntry(this, entry)
  }
  pasteRange(range: Entry[][][]): UndoOp {
    return pasteEditorRange(this, range)
  }
}
