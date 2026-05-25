import { YUL_OBJ } from '../../domain/constants'
import type { MainEntry } from '../../domain/symbols'

export type OctaveChange =
  | { type: 'none' }
  | { type: 'setOctave'; octave: number }
  | { type: 'writeMain'; octave: number; main: MainEntry }

export function resolveOctaveChange(
  main: MainEntry | undefined,
  currentOctave: number,
  delta: -1 | 1
): OctaveChange {
  const sourceOctave =
    main == null || 'pitches' in main ? currentOctave : main.octave
  const octave = sourceOctave + delta
  if (octave < -3 || octave > 3) return { type: 'none' }

  if (main == null || 'pitches' in main) return { type: 'setOctave', octave }

  return {
    type: 'writeMain',
    octave,
    main: YUL_OBJ[octave + 3][main.yul],
  }
}
