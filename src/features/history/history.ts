import type { UndoOp } from '../../domain/viewer'

export type ActionRecord<State> = {
  undo: UndoOp
  redo: () => UndoOp
  before: State
  after: State
}

export class ActionHistory<State> {
  private records: ActionRecord<State>[] = []
  private index = 0

  constructor(
    private readonly capture: () => State,
    private readonly restore: (state: State) => void,
    private readonly afterChange: () => void = () => {},
    private readonly maxRecords = 100
  ) {}

  get length(): number {
    return this.records.length
  }

  get position(): number {
    return this.index
  }

  get undoable(): boolean {
    return this.index > 0
  }

  get redoable(): boolean {
    return this.index < this.records.length
  }

  clear(): void {
    this.records = []
    this.index = 0
  }

  do(op: () => UndoOp): void {
    this.records = this.records.slice(0, this.index)

    const before = this.capture()
    const undo = op()
    const after = this.capture()

    this.records.push({ undo, redo: op, before, after })
    this.index = this.records.length
    this.trim()
    this.afterChange()
  }

  undo(): boolean {
    if (!this.undoable) return false

    this.index -= 1
    const record = this.records[this.index]
    this.restore(record.after)
    record.undo()
    this.restore(record.before)
    this.afterChange()
    return true
  }

  redo(): boolean {
    if (!this.redoable) return false

    const record = this.records[this.index]
    this.restore(record.before)
    record.undo = record.redo()
    record.after = this.capture()
    this.index += 1
    this.afterChange()
    return true
  }

  private trim(): void {
    const max = Math.max(0, this.maxRecords)
    if (this.records.length <= max) return

    const dropped = this.records.length - max
    this.records = this.records.slice(dropped)
    this.index = Math.max(0, this.index - dropped)
  }
}
