/**
 * Serializer
 */
import { InstrumentName } from 'soundfont-player'
import YAML from 'yaml'
import { REST_OBJ, YUL_OBJ } from '../constants'
import { Music } from '../music'
import { MainEntry, querySymbol } from '../symbols'
import {
  Cell,
  Chapter,
  Col,
  Config,
  Entry,
  EntryCell,
  Row,
  ScoreFactory,
  entryWithModifiers,
  getEntryModifiers,
} from '../score'
import { createIDGenerator, type NextID } from '../utils'

const TABLE = '黃大太夾姑仲㽔林夷南無應'

function serializeCol(col: Col): string {
  const modifiers = getEntryModifiers(col.data).map(modifier => modifier.text)
  if (!col.data.main && modifiers.length === 0) return '-'
  const main = col.data.main?.text ?? '-'
  return [main, ...modifiers].join(':')
}

function serializeRow(row: Row): string {
  if (row.data.length === 0) return '-'
  return row.data.map(serializeCol).join(' ')
}

function serializeCell(cell: Cell): string {
  if (cell.data.length === 0) return '-'
  return cell.data
    .flatMap(row =>
      row.breath ? [serializeRow(row), '숨표'] : [serializeRow(row)]
    )
    .join('\n')
}

function serializeScale(scale: number[]): string {
  return scale.map(pitch => TABLE[pitch]).join('')
}

function serializeConfig(config: Config) {
  const serialized: Record<string, any> = { name: config.name }
  for (const [attr, value] of Object.entries(config).sort()) {
    if (attr === 'name') continue
    else if (attr === 'scale') serialized[attr] = serializeScale(config.scale)
    else if (attr === 'rhythm')
      serialized[attr] =
        config.rhythm.map(s => s.map(c => c || '-').join(' ')).join('\n') + '\n'
    else serialized[attr] = value
  }
  return serialized
}

function serializeChapter(chapter: Chapter) {
  const serialized: Record<string, any> = {
    ...serializeConfig(chapter.config),
  }
  serialized.content = chapter.data.map(serializeCell).join('\n\n') + '\n'
  return serialized
}

function serializeMusic(music: Music) {
  const header = { title: music.title, instrument: music.instrument }
  return YAML.stringify([header, ...music.data.map(serializeChapter)])
}

/**
 * Deserializer
 */

function lookupYul(query: string): MainEntry | null {
  const yulMap: Record<string, MainEntry> = {
    // also accept compatible characters
    蕤: YUL_OBJ[3][6],
    林: YUL_OBJ[3][7],
  }
  for (const yulObj of YUL_OBJ.flat()) yulMap[yulObj.text] = yulObj
  return yulMap[query] ?? null
}

function deserializeEntry(col: string): Entry {
  const [_main, ..._mods] = col.trim().split(':')
  const modifiers = _mods.map(mod => querySymbol('modifier', mod, 'text'))
  if (_main === '-') return entryWithModifiers(undefined, modifiers)
  const main =
    _main === '△'
      ? REST_OBJ
      : lookupYul(_main) || querySymbol('main', _main, 'text')
  return entryWithModifiers(main, modifiers)
}

function deserializeCells(string: string, score: ScoreFactory): Cell[] {
  return string
    .trim()
    .split('\n\n')
    .map(function (cell) {
      const entries = deserializeCellRows(cell)
      return score.cellFromEntries(entries)
    })
}

function deserializeCellRows(cell: string): EntryCell {
  const entries: EntryCell = []
  for (const line of cell.trim().split('\n')) {
    const row = line.trim()
    if (row === '숨표') {
      if (entries.length === 0)
        throw Error('Breath mark row must follow a notation row.')
      entries[entries.length - 1].breath = true
      continue
    }
    entries.push(row.split(' ').map(deserializeEntry))
  }
  return entries
}

type Header = {
  title: string
  instrument: InstrumentName
}
function deserializeHeader(header: string | any): Header {
  if (typeof header === 'string') {
    return { title: header, instrument: 'acoustic_grand_piano' }
  }
  return {
    title: header.title,
    instrument: header.instrument || 'acoustic_grand_piano',
  }
}

export type DeserializeMusicOptions = {
  nextID?: NextID
  score?: ScoreFactory
}

function deserializeMusic(yaml: string, options: DeserializeMusicOptions = {}) {
  const score =
    options.score ?? new ScoreFactory(options.nextID ?? createIDGenerator())
  let contents = YAML.parse(yaml)
  const { title, instrument } = deserializeHeader(contents.shift())
  const chapters: Chapter[] = contents.map(function (content: any) {
    const rhythm = content.rhythm
      .trim()
      .split('\n')
      .map((s: string) =>
        s === '' ? [''] : s.split(' ').map((c: string) => (c === '-' ? '' : c))
      )
    const measure: number[] = Array.isArray(content.measure)
      ? content.measure
      : [content.measure]
    const gakLength = measure.reduce((a: number, b: number) => a + b, 0)
    if (rhythm.length > gakLength) throw new Error('Too many ticks in rhythm.')
    while (rhythm.length < gakLength) rhythm.push([''])

    const config: Config = {
      name: content.name,
      tempo: content.tempo,
      measure,
      hideRhythm: content.hideRhythm,
      scale: content.scale
        .trim()
        .split('')
        .map((c: string): number => TABLE.indexOf(c)),
      rhythm,
      padding: content.padding || 0,
    }
    return score.chapter(config, deserializeCells(content.content, score))
  })
  return new Music(title, chapters, instrument, score)
}

export { serializeMusic, deserializeMusic }
