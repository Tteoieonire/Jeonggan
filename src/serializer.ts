/**
 * Serializer
 */
import YAML from 'yaml'
import { Cell, Chapter, Col, Config, Music, Row } from './music'
import { YUL_OBJ, REST_OBJ } from './constants'
import { MainEntry, querySymbol } from './symbols'

const INDENT = '  '
const TABLE = '黃大太夾姑仲蕤林夷南無應'

function serializeCol(col?: Col) {
  if (!col || !col.main) return '-'
  const main = col.main.text
  let _mod = col.modifier
  if (!_mod) return main
  const modifier = 'text' in _mod ? _mod.text : _mod.texts[0]
  return main + ':' + modifier
}

function serializeRow(row?: Row) {
  if (!row || row.length === 0) return INDENT + INDENT + '-'
  return INDENT + INDENT + row.map(serializeCol).join(' ')
}

function serializeCell(cell?: Cell) {
  if (!cell || cell.length === 0) return INDENT + INDENT + '-'
  return cell.map(serializeRow).join('\n')
}

function serializeScale(scale: number[]) {
  return scale.map(pitch => TABLE[pitch]).join('')
}

function serializeConfig(config: Config) {
  let serialized = ''
  for (const [attr, value] of Object.entries(config)) {
    let str = ''
    if (attr === 'scale') {
      str = serializeScale(config.scale)
    } else if (attr === 'rhythm') {
      str =
        '|\n' +
        config.rhythm.map((s: string) => INDENT + INDENT + (s || '')).join('\n')
    } else str = value.toString()
    serialized += INDENT + attr + ': ' + str + '\n'
  }
  return serialized + '\n' + INDENT + 'content: |\n'
}

function serializeChapter(chapter: Chapter) {
  return (
    serializeConfig(chapter.config) + chapter.map(serializeCell).join('\n\n')
  )
}

function serializeMusic(title: string, music: Music) {
  return (
    '-\n' + INDENT + title + '\n-\n' + music.map(serializeChapter).join('\n-\n')
  )
}

/**
 * Deserializer
 */

function _lookup(table: MainEntry[][], query: string): MainEntry | null {
  let found = table.flat().filter(node => (node?.text === query ? node : null))
  return found.length ? found[0] : null
}

function deserializeCol(col: string): Col | undefined {
  const [_main, _mod] = col.trim().split(':')
  if (_main === '-') return
  if (_main === '△') return { main: REST_OBJ }
  const main = _lookup(YUL_OBJ, _main) || querySymbol('main', _main, 'text')
  const modifier = _mod ? querySymbol('modifier', _mod, 'text') : undefined
  return { main, modifier }
}

function deserializeCells(string: string) {
  return string
    .trim()
    .split('\n\n')
    .map(function (cell) {
      return cell
        .trim()
        .split('\n')
        .map(function (row) {
          return row.trim().split(' ').map(deserializeCol)
        })
    })
}

function deserializeMusic(yaml: string) {
  let contents = YAML.parse(yaml)
  const title: string = contents.shift()
  const chapters: Chapter[] = contents.map(function (content: any) {
    const rhythm: string[] = content.rhythm
      .split('\n')
      .map((s: string) => s || null)
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
  return { title, chapters }
}

export { serializeMusic, deserializeMusic }
