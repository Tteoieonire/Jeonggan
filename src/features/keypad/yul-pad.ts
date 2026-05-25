import { YUL_OBJ } from '../../domain/constants'
import type { MainEntry } from '../../domain/symbols'

const MIN_OCTAVE = -3
const MAX_OCTAVE = 3

export function canLowerOctave(octave: number): boolean {
  return octave > MIN_OCTAVE
}

export function canRaiseOctave(octave: number): boolean {
  return octave < MAX_OCTAVE
}

export function getYulPadEntries(
  scale: readonly number[],
  octave: number
): MainEntry[] {
  const octaveEntries = YUL_OBJ[octave + 3]
  return scale.map(index => octaveEntries[index])
}

export function getYulPadEntry(
  scale: readonly number[],
  octave: number,
  index: number
): MainEntry {
  return getYulPadEntries(scale, octave)[index]
}
