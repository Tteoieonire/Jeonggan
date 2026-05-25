import Cursor from '../../domain/navigation/cursor'
import type { Col, Config } from '../../domain/navigation/viewer'

type PlayingCanvasLabelInput = {
  playing: true
}

type EditingCanvasLabelInput = {
  playing?: false
  cursor: Cursor
  config: Pick<Config, 'name' | 'padding' | 'rhythm'>
  numRows: number
  numCols: number
  col: Col
  breathMarked?: boolean
}

export type CanvasLabelInput = PlayingCanvasLabelInput | EditingCanvasLabelInput

export function makeCanvasLabel(input: CanvasLabelInput): string {
  if (input.playing) return ''

  const { cursor, config } = input
  const chapterName = config.name

  if (cursor.rhythmMode) {
    const tick = formatRhythmTick(config.rhythm[cursor.cell])
    return `${tick}, ${chapterName} 장단 ${cursor.cell + 1}번째 정간`
  }

  const pos = getPositionInGak(cursor.cell, config)
  const main = input.col.data?.main?.label ?? '빈칸'
  const modifier = input.col.data?.modifier?.label
  const entry = modifier ? `${main} ${modifier}` : main
  const content = input.breathMarked ? `${entry}, 숨표` : entry

  return (
    `${content}, ` +
    `${chapterName} ${pos.gak + 1}각 ${pos.cell + 1}번째 정간, ` +
    `${input.numRows}행 중 ${cursor.row + 1}행, ` +
    `${input.numCols}열 중 ${cursor.col + 1}열`
  )
}

function formatRhythmTick(rows: Config['rhythm'][number] | undefined): string {
  const tick = rows?.filter(Boolean).join(' ')
  return tick || '빈 박'
}

function getPositionInGak(
  cell: number,
  config: Pick<Config, 'padding' | 'rhythm'>
): { gak: number; cell: number } {
  const gakLength = config.rhythm.length
  const gak = Math.floor((cell + config.padding) / gakLength)
  const pos = gak > 0 ? (cell + config.padding) % gakLength : cell

  return { gak, cell: pos }
}
