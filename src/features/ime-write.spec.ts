import { describe, expect, it } from 'vitest'

import type { EntryOf } from '../domain/symbols'
import { resolveImeWrite } from './ime-write'

const MAIN: EntryOf['main'] = {
  pitches: [3],
  text: 'main',
  label: 'main',
}

const MODIFIER: EntryOf['modifier'] = {
  pitches: [[], [3], []],
  text: 'modifier',
  label: 'modifier',
}

describe('IME write helpers', () => {
  it('ignores IME writes while selecting', () => {
    const ime = fakeIme(MAIN)

    expect(resolveImeWrite(ime, input({ isSelecting: true }))).toEqual({
      type: 'none',
    })
    expect(ime.calls).toEqual([])
  })

  it('ignores shifted IME writes when sigim is unavailable', () => {
    const ime = fakeIme(MODIFIER)

    expect(
      resolveImeWrite(ime, input({ shiftKey: true, sigimShow: false }))
    ).toEqual({ type: 'none' })
    expect(ime.calls).toEqual([])
  })

  it('resolves unshifted IME writes as main writes', () => {
    const ime = fakeIme(MAIN)

    expect(resolveImeWrite(ime, input({ key: '3' }))).toEqual({
      type: 'write',
      where: 'main',
      entry: MAIN,
    })
    expect(ime.calls).toEqual([{ key: '3', shiftKey: false }])
  })

  it('resolves shifted IME writes as modifier writes', () => {
    const ime = fakeIme(MODIFIER)

    expect(
      resolveImeWrite(ime, input({ key: 'Equal', shiftKey: true }))
    ).toEqual({
      type: 'write',
      where: 'modifier',
      entry: MODIFIER,
    })
    expect(ime.calls).toEqual([{ key: 'Equal', shiftKey: true }])
  })

  it('preserves undefined entries from the IME', () => {
    expect(resolveImeWrite(fakeIme(undefined), input())).toEqual({
      type: 'write',
      where: 'main',
      entry: undefined,
    })
  })
})

type FakeIme = {
  calls: { key: string; shiftKey: boolean }[]
  update(key: string, shiftKey: boolean): EntryOf[keyof EntryOf] | undefined
}

function fakeIme(entry: EntryOf[keyof EntryOf] | undefined): FakeIme {
  return {
    calls: [],
    update(key: string, shiftKey: boolean) {
      this.calls.push({ key, shiftKey })
      return entry
    },
  }
}

function input(input: Partial<Parameters<typeof resolveImeWrite>[1]> = {}) {
  return {
    key: 'Digit3',
    shiftKey: false,
    isSelecting: false,
    sigimShow: true,
    ...input,
  }
}
