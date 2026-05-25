import type Cursor from '../../domain/cursor'

export type CanvasCellRowStyle = {
  fontSize: string
  height: string
}

export function getCanvasCellRowStyle(
  rowCount: number,
  colCount: number
): CanvasCellRowStyle {
  const longest = Math.max(rowCount, colCount)
  return {
    fontSize: 2 * Math.exp(-0.3 * longest) + 'rem',
    height: 100 / rowCount + '%',
  }
}

export function coordInCanvasCell(
  cellCoord: Cursor,
  row: number,
  col: number
): Cursor {
  const coord = cellCoord.clone()
  coord.row = row
  coord.col = col
  return coord
}

export function isCanvasCellSelected(
  coord: Cursor,
  anchor?: Cursor,
  cursor?: Cursor
): boolean {
  if (anchor == null || cursor == null) return false
  return coord.isBetween(anchor, cursor, 'cell')
}

export function isCanvasCellHandle(
  coord: Cursor,
  anchor?: Cursor,
  cursor?: Cursor
): boolean {
  return !!(
    anchor?.isEqualTo(coord, 'cell') || cursor?.isEqualTo(coord, 'cell')
  )
}
