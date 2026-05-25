import Cursor from '../../domain/cursor'
import type { Gak } from '../../domain/viewer'

export type GakGroupInfo = {
  index: number
  endsSubdivision: boolean
  endsChapter: boolean
}

type GakLayout = Pick<
  Gak,
  'chapterIndex' | 'gakIndex' | 'isLast' | 'measure' | 'padding' | 'title'
>

export function getGakLength(measure: number[]): number {
  return measure.reduce((a, b) => a + b, 0)
}

export function coordInGak(
  gak: GakLayout,
  rhythmMode: boolean,
  cell: number,
  row = 0,
  col = 0
): Cursor {
  if (!rhythmMode) {
    cell += gak.gakIndex * getGakLength(gak.measure)
    if (gak.gakIndex > 0) cell -= gak.padding
  }
  return new Cursor(rhythmMode, gak.chapterIndex, cell, row, col)
}

export function groupGakContent<T>(
  content: T[],
  gak: Pick<GakLayout, 'gakIndex' | 'isLast' | 'measure' | 'padding'>
): [T, GakGroupInfo][] {
  const numbered = Array.from(content.entries())
  let idx = gak.gakIndex === 0 ? -gak.padding : 0
  const result: [T, GakGroupInfo][] = []

  for (const subdivision of gak.measure) {
    const sliced = numbered
      .slice(Math.max(0, idx), Math.max(0, idx + subdivision))
      .map(([index, data]): [T, GakGroupInfo] => [
        data,
        { index, endsSubdivision: false, endsChapter: false },
      ])

    if (sliced.length) {
      sliced[sliced.length - 1][1].endsSubdivision = true
      result.push(...sliced)
    }
    idx += subdivision
  }

  result[result.length - 1][1].endsChapter = gak.isLast
  return result
}

export function getGakTitle(gak: Pick<GakLayout, 'chapterIndex' | 'title'>) {
  return gak.title || gak.chapterIndex + 1 + '장'
}

export function getGakLabel(gak: Gak): string {
  const title = getGakTitle(gak)
  if (gak.rhythm) return title + ' 장단'
  return title + ' ' + (gak.gakIndex + 1) + '각'
}

export function getGakPadding(gak: Pick<GakLayout, 'gakIndex' | 'padding'>) {
  return (gak.gakIndex === 0 ? gak.padding : 0) * 3.5 + 'rem'
}
