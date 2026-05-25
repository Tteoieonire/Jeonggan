import { describe, expect, it } from 'vitest'

import Cursor from './cursor'

describe('Cursor', () => {
  it('replaces cursor state instead of mutating the previous snapshot', () => {
    const cursor = new Cursor(false, 0, 0, 0, 0)
    const before = cursor.state

    cursor.move(1, 2, 3, 4)

    expect(before).toEqual({
      rhythmMode: false,
      chapter: 0,
      cell: 0,
      row: 0,
      col: 0,
    })
    expect(Object.isFrozen(before)).toBe(true)
    expect(cursor.state).not.toBe(before)
    expect(cursor.state).toEqual({
      rhythmMode: false,
      chapter: 1,
      cell: 2,
      row: 3,
      col: 4,
    })
  })

  it('keeps event listeners while replacing cursor state', () => {
    const cursor = new Cursor(false, 0, 0, 0, 0)
    const events: string[] = []

    cursor.on('beforeCellChange', () => events.push('before'))
    cursor.on('afterCellChange', () => events.push('after'))

    cursor.move(0, 1, 0, 0)

    expect(events).toEqual(['before', 'after'])
    expect(cursor.cell).toBe(1)
  })
})
