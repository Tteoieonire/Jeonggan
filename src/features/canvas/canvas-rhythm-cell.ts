import type Cursor from '../../domain/cursor'

export type CanvasRhythmCellRowStyle = {
  fontSize: string
  lineHeight: string
}

export function getCanvasRhythmCellRowStyle(
  tickCount: number
): CanvasRhythmCellRowStyle {
  return {
    fontSize: 2 * Math.exp(-0.2 * tickCount) + 'rem',
    lineHeight: 3.5 / tickCount + 'rem',
  }
}

export function coordInCanvasRhythmCell(
  cellCoord: Cursor,
  row: number
): Cursor {
  const coord = cellCoord.clone()
  coord.row = row
  return coord
}

export function isCanvasRhythmTickCurrent(
  cellCoord: Cursor,
  row: number,
  cursor?: Cursor
): boolean {
  return !!cursor?.isEqualTo(coordInCanvasRhythmCell(cellCoord, row), 'row')
}

export function getCanvasRhythmTickStates(
  tickCount: number,
  cellCoord: Cursor,
  cursor?: Cursor
): boolean[] {
  return Array.from({ length: tickCount }, (_, row) =>
    isCanvasRhythmTickCurrent(cellCoord, row, cursor)
  )
}
