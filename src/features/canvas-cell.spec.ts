import { describe, expect, it } from 'vitest'

import Cursor from '../domain/cursor'
import {
  coordInCanvasCell,
  getCanvasCellRowStyle,
  isCanvasCellHandle,
  isCanvasCellSelected,
} from './canvas-cell'

describe('canvas cell helpers', () => {
  it('scales row style by the denser row or column count', () => {
    expect(getCanvasCellRowStyle(2, 3)).toEqual({
      fontSize: 2 * Math.exp(-0.3 * 3) + 'rem',
      height: '50%',
    })
  })

  it('derives an entry coordinate without mutating the cell coordinate', () => {
    const cellCoord = new Cursor(false, 0, 5, 1, 2)

    const coord = coordInCanvasCell(cellCoord, 3, 4)

    expect(coord.isEqualTo(new Cursor(false, 0, 5, 3, 4))).toBe(true)
    expect(cellCoord.isEqualTo(new Cursor(false, 0, 5, 1, 2))).toBe(true)
  })

  it('detects selected cells between an anchor and cursor', () => {
    const anchor = cellAt(1)
    const cursor = cellAt(3)

    expect(isCanvasCellSelected(cellAt(2), anchor, cursor)).toBe(true)
    expect(isCanvasCellSelected(cellAt(4), anchor, cursor)).toBe(false)
    expect(isCanvasCellSelected(cellAt(2), undefined, cursor)).toBe(false)
  })

  it('detects drag handles at either selection edge', () => {
    const anchor = cellAt(1)
    const cursor = cellAt(3)

    expect(isCanvasCellHandle(cellAt(1), anchor, cursor)).toBe(true)
    expect(isCanvasCellHandle(cellAt(3), anchor, cursor)).toBe(true)
    expect(isCanvasCellHandle(cellAt(2), anchor, cursor)).toBe(false)
    expect(isCanvasCellHandle(cellAt(3), undefined, cursor)).toBe(true)
  })
})

function cellAt(cell: number): Cursor {
  return new Cursor(false, 0, cell, 0, 0)
}
