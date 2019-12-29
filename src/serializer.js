/**
 * Serializer
 */

import {YUL_OBJ} from './constants.js'

const INDENT = '  '
const TABLE = '黃大太夾姑仲蕤林夷南無應'

function serializeCol(col) {
  if (!col || !col.main) return '-'
  const main = col.main.text
  const modifier = col.main.modifier
  return main + (modifier? (':' + modifier) : '')
}

function serializeRow(row) {
  if (!row || row.length === 0) return '-'
  return INDENT + INDENT + row.map(serializeCol).join(' ')
}

function serializeCell(cell) {
  if (!cell || cell.length === 0) return '-'
  return cell.map(serializeRow).join('\n')
}

function serializeCells(cells) {
  return cells.map(serializeCell).join('\n\n')
}

function serializeScale(scale) {
  return scale.map(pitch => TABLE[pitch]).join('')
}

function serializeConfig(config) {
  const rhythm = config.rhythm.map(s => INDENT + INDENT + (s || '')).join('\n')
  return [
    INDENT + 'name: ' + config.name,
    INDENT + 'measure: ' + config.measure,
    INDENT + 'tempo: ' + config.tempo,
    INDENT + 'scale: ' + serializeScale(config.scale),
    INDENT + 'rhythm: |\n' + rhythm,
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
    music.chapters.map(serializeChapter).join('\n')
  )
}

/**
 * Deserializer
 */

function deserializeCol(col) {
  col = col.trim().split(':')
  let main = col[0]
  let modifier = col[1]
  return { main, modifier}
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
  chapters.forEach(function (config) {
    console.log(config.scale)
    config.scale = config.scale.trim().split('').map(c => TABLE.indexOf(c))
    config.rhythm = config.rhythm.split('\n').map(s => s || null)
    config.rhythm.length = config.measure
    config.content = deserializeCells(config.content)
  })
  return {title, chapters}
}

export { serializeMusic, deserializeMusic }
