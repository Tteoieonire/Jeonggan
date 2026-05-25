import { describe, expect, it } from 'vitest'

import { YUL_OBJ } from '../domain/constants'
import {
  canLowerOctave,
  canRaiseOctave,
  getYulPadEntries,
  getYulPadEntry,
} from './yul-pad'

describe('yul pad helpers', () => {
  it('enforces octave bounds', () => {
    expect(canLowerOctave(-3)).toBe(false)
    expect(canLowerOctave(-2)).toBe(true)
    expect(canRaiseOctave(2)).toBe(true)
    expect(canRaiseOctave(3)).toBe(false)
  })

  it('maps scale degrees to entries in the current octave', () => {
    expect(getYulPadEntries([0, 2, 4], 0)).toEqual([
      YUL_OBJ[3][0],
      YUL_OBJ[3][2],
      YUL_OBJ[3][4],
    ])
  })

  it('picks one scale entry by button index', () => {
    expect(getYulPadEntry([1, 3], -3, 1)).toEqual(YUL_OBJ[0][3])
  })
})
