import type { RhythmTick } from '../constants'
import type { EditableMusicBase, ScoreFactory } from '../score'
import Cursor from '../navigation/cursor'
import {
  toggleBreathMark as toggleEditorBreathMark,
  writeBreathMark as writeEditorBreathMark,
} from './breath-mark-editing'
import {
  applyHalfLongDurationMark as applyEditorHalfLongDurationMark,
  applyLongShortDurationMark as applyEditorLongShortDurationMark,
  canApplyPairedDurationMark as canApplyEditorPairedDurationMark,
  getActivePairedDurationMark as getActiveEditorPairedDurationMark,
  type PairedDurationMark,
} from './duration-mark-editing'
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
  insertElementAt,
  removeElementAt,
  replaceElementData,
  writeElement,
} from './structure-editing'
import { inRange } from '../utils'
import {
  ElementOf,
  Entry,
  EntryRange,
  idOp,
  PARENT_OF,
  SNAP,
  UndoOp,
} from '../navigation/viewer'

export class MusicEditor extends MusicSelector<EditableMusicBase> {
  get score(): ScoreFactory {
    return this.music.score
  }

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

  writeBreathMark(breath: boolean): UndoOp {
    return writeEditorBreathMark(this, breath)
  }

  toggleBreathMark(): UndoOp {
    return toggleEditorBreathMark(this)
  }

  canApplyPairedDurationMark(): boolean {
    return canApplyEditorPairedDurationMark(this)
  }

  activePairedDurationMark(): PairedDurationMark | undefined {
    return getActiveEditorPairedDurationMark(this)
  }

  applyLongShortDurationMark(): UndoOp {
    return applyEditorLongShortDurationMark(this)
  }

  applyHalfLongDurationMark(): UndoOp {
    return applyEditorHalfLongDurationMark(this)
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
    const parent = this.get(PARENT_OF[what]).data
    if (!inRange(preyPos, parent)) return idOp

    const prey = removeElementAt(this, what, preyPos) as any
    let undo: UndoOp = idOp
    let oldData: unknown
    if (what !== 'col') {
      const target = this.get(what)
      oldData = replaceElementData(target, [...target.data, ...prey.data])
      undo = this.merge()
    }
    return () => {
      undo()
      if (what !== 'col') replaceElementData(this.get(what), oldData as any)
      insertElementAt(this, what, preyPos, prey)
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
  cutRange(): [EntryRange, UndoOp] {
    return cutEditorRange(this)
  }

  pasteEntry(entry: Entry): UndoOp {
    return pasteEditorEntry(this, entry)
  }
  pasteRange(range: EntryRange): UndoOp {
    return pasteEditorRange(this, range)
  }
}
