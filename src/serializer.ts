/**
 * Serializer
 */
import { InstrumentName } from 'soundfont-player'
import YAML from 'yaml'
import { REST_OBJ, YUL_OBJ } from './constants'
import { Music } from './editor'
import { MainEntry, querySymbol } from './symbols'
import { getID, resetID } from './utils'
import { Cell, Chapter, Col, Config, Row } from './viewer'

const INDENT = '  '
const TABLE = '黃大太夾姑仲蕤林夷南無應'

function serializeCol(col?: Col) {
  if (!col?.data.main) return '-'
  const main = col.data.main.text
  let _mod = col.data.modifier
  if (!_mod) return main
  const modifier = 'text' in _mod ? _mod.text : _mod.texts[0]
  return main + ':' + modifier
}

function serializeRow(row?: Row) {
  if (!row || row.data.length === 0) return INDENT + INDENT + '-'
  return INDENT + INDENT + row.data.map(serializeCol).join(' ')
}

function serializeCell(cell?: Cell) {
  if (!cell || cell.data.length === 0) return INDENT + INDENT + '-'
  return cell.data.map(serializeRow).join('\n')
}

function serializeScale(scale: number[]) {
  return scale.map(pitch => TABLE[pitch]).join('')
}

function serializeConfig(config: Config) {
  let serialized = ''
  const name = YAML.stringify(config.name).trim()
  for (const [attr, value] of Object.entries(config).sort()) {
    let str = ''
    if (attr === 'name') {
      continue
    } else if (attr === 'scale') {
      str = serializeScale(config.scale)
    } else if (attr === 'rhythm') {
      str =
        '|\n' + config.rhythm.map((s: string) => INDENT + INDENT + s).join('\n')
    } else str = value.toString()
    serialized += `${INDENT}${attr}: ${str}\n`
  }
  return `${INDENT}name: ${name}\n${serialized}${INDENT}content: |\n`
}

function serializeChapter(chapter: Chapter) {
  return (
    serializeConfig(chapter.config) +
    chapter.data.map(serializeCell).join('\n\n')
  )
}

function serializeMusic(music: Music) {
  const header = YAML.stringify({
    title: music.title,
    instrument: music.instrument,
  })
  return '-\n' + header + '-\n' + music.data.map(serializeChapter).join('\n-\n')
}

/**
 * Deserializer
 */

function _lookup(table: MainEntry[][], query: string): MainEntry | null {
  let found = table.flat().filter(node => (node?.text === query ? node : null))
  return found.length ? found[0] : null
}

function deserializeCol(col: string): Col {
  const [_main, _mod] = col.trim().split(':')
  if (_main === '-') return { id: getID(), data: {} }
  if (_main === '△') return { id: getID(), data: { main: REST_OBJ } }
  const main = _lookup(YUL_OBJ, _main) || querySymbol('main', _main, 'text')
  const modifier = _mod ? querySymbol('modifier', _mod, 'text') : undefined
  return { id: getID(), data: { main, modifier } }
}

function deserializeCells(string: string): Cell[] {
  return string
    .trim()
    .split('\n\n')
    .map(function (cell) {
      return {
        id: getID(),
        data: cell
          .trim()
          .split('\n')
          .map(function (row) {
            return {
              id: getID(),
              data: row.trim().split(' ').map(deserializeCol),
            }
          }),
      }
    })
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

function deserializeMusic(yaml: string) {
  resetID()
  let contents = YAML.parse(yaml)
  const { title, instrument } = deserializeHeader(contents.shift())
  const chapters: Chapter[] = contents.map(function (content: any) {
    const rhythm: string[] = content.rhythm.split('\n')
    rhythm.length = content.measure
    const config: Config = {
      name: content.name,
      tempo: content.tempo,
      measure: content.measure,
      hideRhythm: content.hideRhythm,
      scale: content.scale
        .trim()
        .split('')
        .map((c: string): number => TABLE.indexOf(c)),
      rhythm,
      padding: content.padding || 0,
    }
    const cells = deserializeCells(content.content)
    return new Chapter(config, cells)
  })
  return new Music(title, chapters, instrument)
}

export { serializeMusic, deserializeMusic }
