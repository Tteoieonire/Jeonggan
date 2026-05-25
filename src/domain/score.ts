import { InstrumentName } from 'soundfont-player'

import { RHYTHM_OBJ } from './constants'
import { MainEntry, ModifierEntry } from './symbols'
import { getID, WithID } from './utils'

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

export type Entry = { main?: MainEntry; modifier?: ModifierEntry }
export type Col = WithID<Entry>
export type Row = WithID<Col[]>
export type Cell = WithID<Row[]>

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

export function _make<K extends 'col' | 'row' | 'cell'>(what: K): ElementOf[K] {
  const col: Col = { id: getID(), data: {} }
  if (what === 'col') return col as any
  const row: Row = { id: getID(), data: [col] }
  if (what === 'row') return row as any
  const cell: Cell = { id: getID(), data: [row] }
  return cell as any
}

export class Chapter {
  id: number
  config: Config
  data: Cell[]

  constructor(config: Config, cells?: Cell[]) {
    this.id = getID()
    this.config = config
    this.data = cells || [_make('cell')]
  }

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

export type MusicBase = { data: Chapter[]; instrument: InstrumentName }
