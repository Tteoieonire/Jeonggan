import { describe, expect, it } from 'vitest'
import { canPaste, type ClipboardData } from './clipboard'
import Cursor from '../domain/cursor'

const ENTRY_CLIPBOARD: ClipboardData = ['Entry', {}]
const RANGE_CLIPBOARD: ClipboardData = ['Range', [[[{}]]]]

describe('clipboard helpers', () => {
  it('cannot paste without clipboard content', () => {
    expect(canPaste(undefined, false, undefined, cursorAt(0, 0))).toBe(false)
  })

  it('can paste ranges whenever clipboard content exists', () => {
    expect(canPaste(RANGE_CLIPBOARD, false, undefined, cursorAt(0, 0))).toBe(
      true
    )
    expect(
      canPaste(RANGE_CLIPBOARD, true, cursorAt(0, 1), cursorAt(0, 4))
    ).toBe(true)
  })

  it('can paste entries without an active selection', () => {
    expect(canPaste(ENTRY_CLIPBOARD, false, undefined, cursorAt(0, 0))).toBe(
      true
    )
  })

  it('can paste entries into a single-cell selection', () => {
    expect(
      canPaste(
        ENTRY_CLIPBOARD,
        true,
        cursorAt(0, 2, 0, 0),
        cursorAt(0, 2, 1, 1)
      )
    ).toBe(true)
  })

  it('cannot paste entries into a multi-cell selection', () => {
    expect(
      canPaste(ENTRY_CLIPBOARD, true, cursorAt(0, 2), cursorAt(0, 3))
    ).toBe(false)
    expect(
      canPaste(ENTRY_CLIPBOARD, true, cursorAt(0, 2), cursorAt(1, 2))
    ).toBe(false)
    expect(canPaste(ENTRY_CLIPBOARD, true, undefined, cursorAt(0, 2))).toBe(
      false
    )
  })
})

function cursorAt(chapter: number, cell: number, row = 0, col = 0): Cursor {
  return new Cursor(false, chapter, cell, row, col)
}
