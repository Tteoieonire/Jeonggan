import { describe, expect, it } from 'vitest'

import { REST_OBJ, YUL_OBJ } from '../../domain/constants'
import { resolveOctaveChange } from './octave'

describe('octave helpers', () => {
  it('changes the current octave when no main entry is selected', () => {
    expect(resolveOctaveChange(undefined, 0, 1)).toEqual({
      type: 'setOctave',
      octave: 1,
    })
  })

  it('changes the current octave for symbolic main entries', () => {
    expect(resolveOctaveChange(REST_OBJ, 0, -1)).toEqual({
      type: 'setOctave',
      octave: -1,
    })
  })

  it('rewrites yul entries relative to the selected entry octave', () => {
    expect(resolveOctaveChange(YUL_OBJ[3][2], -3, 1)).toEqual({
      type: 'writeMain',
      octave: 1,
      main: YUL_OBJ[4][2],
    })
  })

  it('ignores octave changes outside the supported range', () => {
    expect(resolveOctaveChange(undefined, 3, 1)).toEqual({ type: 'none' })
    expect(resolveOctaveChange(YUL_OBJ[0][2], 0, -1)).toEqual({
      type: 'none',
    })
  })
})
