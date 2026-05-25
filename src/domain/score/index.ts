import { InstrumentName } from 'soundfont-player'

import { RHYTHM_OBJ } from '../constants'
import { MainEntry, ModifierEntry } from '../symbols'
import { type NextID, type WithID } from '../utils'

export type Config = Readonly<{
  name: string
  tempo: number
  measure: number[]
  padding: number
  hideRhythm: boolean
  scale: number[]
  rhythm: (typeof RHYTHM_OBJ[number] | '')[][]
}>

export type Gak = {
  title: string
  chapterID: number
  chapterIndex: number
  gakIndex: number
  isLast: boolean
  measure: number[]
  padding: number
} & ({ rhythm: true; content: string[][] } | { rhythm: false; content: Cell[] })

export type Entry = {
  main?: MainEntry
  modifier?: ModifierEntry
  modifiers?: ModifierEntry[]
}
export type Col = WithID<Entry>
export type Row = WithID<Col[]> & { breath?: boolean }
export type Cell = WithID<Row[]>
export type EntryRow = Entry[] & { breath?: boolean }
export type EntryCell = EntryRow[]
export type EntryRange = EntryCell[]

export function getEntryModifiers(entry: Entry | undefined): ModifierEntry[] {
  if (entry?.modifiers != null) return entry.modifiers
  return entry?.modifier ? [entry.modifier] : []
}

export function entryWithModifiers(
  main: MainEntry | undefined,
  modifiers: ModifierEntry[]
): Entry {
  if (modifiers.length === 0) return main ? { main } : {}
  if (modifiers.length === 1) return { main, modifier: modifiers[0] }
  return { main, modifier: modifiers[0], modifiers }
}

export const PARENT_OF: {
  col: 'row'
  row: 'cell'
  cell: 'chapter'
  chapter: 'music'
} = {
  col: 'row',
  row: 'cell',
  cell: 'chapter',
  chapter: 'music',
}

export const CHILD_OF: {
  row: 'col'
  cell: 'row'
  chapter: 'cell'
  music: 'chapter'
} = {
  row: 'col',
  cell: 'row',
  chapter: 'cell',
  music: 'chapter',
}

export type ElementOf = {
  col: Col
  row: Row
  cell: Cell
  chapter: Chapter
  music: MusicBase
}

export class Chapter {
  constructor(public id: number, public config: Config, public data: Cell[]) {}

  setConfig(config: Config): void {
    this.config = config
  }

  asGaks(chapterIndex: number): Gak[] {
    let gaks: Gak[] = []
    if (!this.config.hideRhythm) {
      gaks.push({
        title: this.config.name,
        chapterID: this.id,
        chapterIndex,
        gakIndex: -1,
        rhythm: true,
        content: this.config.rhythm,
        measure: this.config.measure,
        padding: 0,
        isLast: false,
      })
    }

    const gakLength = this.config.rhythm.length
    const numGaks = Math.ceil(this.data.length / gakLength)
    for (let i = 0; i < numGaks; i++) {
      const sliced = this.data.slice(i * gakLength, (i + 1) * gakLength)
      gaks.push({
        title: this.config.name,
        chapterID: this.id,
        chapterIndex,
        gakIndex: i,
        rhythm: false,
        content: sliced,
        measure: this.config.measure,
        padding: this.config.padding,
        isLast: i === numGaks - 1,
      })
    }
    return gaks
  }
}

export class ScoreFactory {
  readonly col: (data?: Entry) => Col
  readonly row: (cols?: Col[], breath?: boolean) => Row
  readonly cell: (rows?: Row[]) => Cell
  readonly cellFromEntries: (entries: EntryCell) => Cell
  readonly chapter: (config: Config, cells?: Cell[]) => Chapter

  constructor(nextID: NextID) {
    this.col = (data: Entry = {}) => ({ id: nextID(), data })
    this.row = (cols?: Col[], breath?: boolean) => {
      const row: Row = { id: nextID(), data: cols ?? [this.col()] }
      if (breath) row.breath = true
      return row
    }
    this.cell = (rows?: Row[]) => ({
      id: nextID(),
      data: rows ?? [this.row()],
    })
    this.cellFromEntries = (entries: EntryCell) => ({
      id: nextID(),
      data: entries.map(row => {
        const result: Row = {
          id: nextID(),
          data: row.map(entry => this.col(entry)),
        }
        if (row.breath) result.breath = true
        return result
      }),
    })
    this.chapter = (config: Config, cells?: Cell[]) => {
      return new Chapter(nextID(), config, cells ?? [this.cell()])
    }
  }

  make<K extends 'col' | 'row' | 'cell'>(what: K): ElementOf[K] {
    if (what === 'col') return this.col() as any
    if (what === 'row') return this.row() as any
    return this.cell() as any
  }
}

export type MusicBase = {
  data: Chapter[]
  instrument: InstrumentName
}

export type EditableMusicBase = MusicBase & {
  score: ScoreFactory
}
