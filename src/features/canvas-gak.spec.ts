import { describe, expect, it } from 'vitest'

import Cursor from '../domain/cursor'
import type { Gak } from '../domain/viewer'
import {
  coordInGak,
  getGakLabel,
  getGakLength,
  getGakPadding,
  getGakTitle,
  groupGakContent,
} from './canvas-gak'

describe('canvas gak helpers', () => {
  it('measures a gak by summing subdivisions', () => {
    expect(getGakLength([2, 3, 1])).toBe(6)
  })

  it('converts notation cell coordinates from gak-local to document position', () => {
    const gak = notationGak({ chapterIndex: 2, gakIndex: 3, padding: 1 })

    const coord = coordInGak(gak, false, 2, 1, 4)

    expect(coord.isEqualTo(new Cursor(false, 2, 13, 1, 4))).toBe(true)
  })

  it('keeps rhythm coordinates local to the rhythm block', () => {
    const gak = rhythmGak({ chapterIndex: 2, gakIndex: -1, padding: 1 })

    const coord = coordInGak(gak, true, 2, 1)

    expect(coord.isEqualTo(new Cursor(true, 2, 2, 1, 0))).toBe(true)
  })

  it('groups first-gak content with padding-aware subdivisions', () => {
    const grouped = groupGakContent(['a', 'b', 'c', 'd', 'e'], {
      gakIndex: 0,
      isLast: true,
      measure: [2, 2, 1],
      padding: 1,
    })

    expect(grouped).toEqual([
      ['a', { index: 0, endsSubdivision: true, endsChapter: false }],
      ['b', { index: 1, endsSubdivision: false, endsChapter: false }],
      ['c', { index: 2, endsSubdivision: true, endsChapter: false }],
      ['d', { index: 3, endsSubdivision: true, endsChapter: true }],
    ])
  })

  it('groups later-gak content without padding offset', () => {
    const grouped = groupGakContent(['a', 'b', 'c', 'd'], {
      gakIndex: 1,
      isLast: false,
      measure: [2, 2],
      padding: 1,
    })

    expect(grouped).toEqual([
      ['a', { index: 0, endsSubdivision: false, endsChapter: false }],
      ['b', { index: 1, endsSubdivision: true, endsChapter: false }],
      ['c', { index: 2, endsSubdivision: false, endsChapter: false }],
      ['d', { index: 3, endsSubdivision: true, endsChapter: false }],
    ])
  })

  it('formats title, label, and padding display values', () => {
    expect(getGakTitle(notationGak({ title: '' }))).toBe('1장')
    expect(getGakTitle(notationGak({ title: '초장' }))).toBe('초장')
    expect(getGakLabel(rhythmGak({ title: '초장' }))).toBe('초장 장단')
    expect(getGakLabel(notationGak({ title: '초장', gakIndex: 1 }))).toBe(
      '초장 2각'
    )
    expect(getGakPadding(notationGak({ gakIndex: 0, padding: 2 }))).toBe('7rem')
    expect(getGakPadding(notationGak({ gakIndex: 1, padding: 2 }))).toBe('0rem')
  })
})

function notationGak(overrides: Partial<Gak> = {}): Gak {
  return {
    title: '초장',
    chapterID: 1,
    chapterIndex: 0,
    gakIndex: 0,
    isLast: false,
    measure: [2, 2],
    padding: 0,
    rhythm: false,
    content: [],
    ...overrides,
  } as Gak
}

function rhythmGak(overrides: Partial<Gak> = {}): Gak {
  return {
    title: '초장',
    chapterID: 1,
    chapterIndex: 0,
    gakIndex: -1,
    isLast: false,
    measure: [2, 2],
    padding: 0,
    rhythm: true,
    content: [],
    ...overrides,
  } as Gak
}
