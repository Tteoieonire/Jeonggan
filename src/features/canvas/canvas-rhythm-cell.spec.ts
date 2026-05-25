import { describe, expect, it } from 'vitest'

import Cursor from '../../domain/cursor'
import {
  coordInCanvasRhythmCell,
  getCanvasRhythmCellRowStyle,
  getCanvasRhythmTickStates,
  isCanvasRhythmTickCurrent,
} from './canvas-rhythm-cell'

describe('canvas rhythm cell helpers', () => {
  it('scales row style by tick count', () => {
    expect(getCanvasRhythmCellRowStyle(4)).toEqual({
      fontSize: 2 * Math.exp(-0.2 * 4) + 'rem',
      lineHeight: 3.5 / 4 + 'rem',
    })
  })

  it('derives a rhythm row coordinate without mutating the cell coordinate', () => {
    const cellCoord = new Cursor(true, 0, 5, 1, 0)

    const coord = coordInCanvasRhythmCell(cellCoord, 3)

    expect(coord.isEqualTo(new Cursor(true, 0, 5, 3, 0))).toBe(true)
    expect(cellCoord.isEqualTo(new Cursor(true, 0, 5, 1, 0))).toBe(true)
  })

  it('detects the active rhythm row', () => {
    const cellCoord = new Cursor(true, 0, 5, 0, 0)
    const cursor = new Cursor(true, 0, 5, 2, 0)

    expect(isCanvasRhythmTickCurrent(cellCoord, 2, cursor)).toBe(true)
    expect(isCanvasRhythmTickCurrent(cellCoord, 1, cursor)).toBe(false)
    expect(isCanvasRhythmTickCurrent(cellCoord, 2)).toBe(false)
  })

  it('builds active rhythm row states for rendering and scrolling', () => {
    const cellCoord = new Cursor(true, 0, 5, 0, 0)
    const cursor = new Cursor(true, 0, 5, 2, 0)

    expect(getCanvasRhythmTickStates(4, cellCoord, cursor)).toEqual([
      false,
      false,
      true,
      false,
    ])
  })
})
