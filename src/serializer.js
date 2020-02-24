/**
 * Serializer
 */

import { YUL_OBJ } from './constants.js'
import { MAIN, MODIFIER } from './components/keypads/sympad.vue'

const INDENT = '  '
const TABLE = '黃大太夾姑仲蕤林夷南無應'

function serializeCol(col) {
  if (!col || !col.main) return '-'
  const main = col.main.text
  const modifier = col.modifier && col.modifier.text
  return main + (modifier ? ':' + modifier : '')
}

function serializeRow(row) {
  if (!row || row.length === 0) return INDENT + INDENT + '-'
  return INDENT + INDENT + row.map(serializeCol).join(' ')
}

function serializeCell(cell) {
  if (!cell || cell.length === 0) return INDENT + INDENT + '-'
  return cell.map(serializeRow).join('\n')
}

function serializeCells(cells) {
  return cells.map(serializeCell).join('\n\n')
}

function serializeScale(scale) {
  return scale.map(pitch => TABLE[pitch]).join('')
}

function serializeConfig(config) {
  const rhythm =
    config.rhythm &&
    config.rhythm.map(s => INDENT + INDENT + (s || '')).join('\n')
  return [
    INDENT + 'name: ' + config.name,
    INDENT + 'measure: ' + config.measure,
    INDENT + 'tempo: ' + config.tempo,
    INDENT + 'scale: ' + serializeScale(config.scale),
    rhythm ? INDENT + 'rhythm: |\n' + rhythm : '',
    INDENT + 'content: |\n'
  ].join('\n')
}

function serializeChapter(chapter) {
  return serializeConfig(chapter.config) + serializeCells(chapter.cells)
}

function serializeMusic(title, music) {
  return (
    '---\n-\n' +
    INDENT +
    title +
    '\n-\n' +
    music.chapters.map(serializeChapter).join('\n-\n')
  )
}

/**
 * Deserializer
 */

function recursiveLookup(node, query) {
  if (!Array.isArray(node)) {
    if (!node) return null
    return node.text === query ? node : null
  }
  for (let i = 0; i < node.length; i++) {
    let lookup = recursiveLookup(node[i], query)
    if (lookup) return lookup
  }
  return null
}

function deserializeCol(col) {
  col = col.trim().split(':')
  let main = recursiveLookup(YUL_OBJ, col[0]) || recursiveLookup(MAIN, col[0])
  let modifier = recursiveLookup(MODIFIER, col[1])
  return { main, modifier }
}

function deserializeCells(string) {
  return string
    .trim()
    .split('\n\n')
    .map(function(cell) {
      return cell
        .trim()
        .split('\n')
        .map(function(row) {
          return row
            .trim()
            .split(' ')
            .map(deserializeCol)
        })
    })
}

function deserializeMusic(yaml) {
  let chapters = YAML.parse(yaml)
  const title = chapters.shift()
  chapters.forEach(function(config) {
    config.scale = config.scale
      .trim()
      .split('')
      .map(c => TABLE.indexOf(c))
    if (config.rhythm) {
      config.rhythm = config.rhythm.split('\n').map(s => s || null)
      config.rhythm.length = config.measure
    }
    config.content = deserializeCells(config.content)
  })
  return { title, chapters }
}

export { serializeMusic, deserializeMusic }
