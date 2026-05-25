import { describe, expect, it } from 'vitest'
import {
  getKeyboardCommand,
  hasCtrlKeyOnly,
  hasModifierKey,
  hasShiftKeyOnly,
  type KeyboardContext,
  type KeyboardInput,
} from './index'

const BASE_CONTEXT: KeyboardContext = {
  playerActive: false,
  isSelecting: false,
  rhythmMode: false,
  sigimShow: false,
  tickIdx: -1,
  imeComposing: false,
  imeGrace: false,
}

describe('keyboard helpers', () => {
  it('detects modifier key combinations', () => {
    expect(hasModifierKey(key('KeyA', { ctrlKey: true }))).toBe(true)
    expect(hasModifierKey(key('KeyA'))).toBe(false)

    expect(hasCtrlKeyOnly(key('KeyA', { ctrlKey: true }))).toBe(true)
    expect(hasCtrlKeyOnly(key('KeyA', { ctrlKey: true, shiftKey: true }))).toBe(
      false
    )

    expect(hasShiftKeyOnly(key('KeyA', { shiftKey: true }))).toBe(true)
    expect(
      hasShiftKeyOnly(key('KeyA', { shiftKey: true, metaKey: true }))
    ).toBe(false)
  })

  it('ignores keyboard input while the player is active', () => {
    expect(command('ArrowDown', { playerActive: true })).toEqual({
      type: 'ignore',
      preventDefault: false,
    })
  })

  it('classifies movement and selection movement', () => {
    expect(command('ArrowUp')).toEqual({
      type: 'moveUpDown',
      direction: 'up',
      select: false,
      preventDefault: true,
    })
    expect(command('ArrowRight', {}, { shiftKey: true })).toEqual({
      type: 'moveLeftRight',
      direction: 'right',
      select: true,
      preventDefault: true,
    })
  })

  it('classifies shape editing keys', () => {
    expect(command('Space', {}, { shiftKey: true })).toEqual({
      type: 'shapeChange',
      what: 'col',
      delta: 1,
      preventDefault: true,
    })
    expect(command('Enter')).toEqual({
      type: 'shapeChange',
      what: 'cell',
      delta: 1,
      preventDefault: true,
    })
    expect(command('NumpadEnter', {}, { shiftKey: true })).toEqual({
      type: 'shapeChange',
      what: 'row',
      delta: 1,
      preventDefault: true,
    })
    expect(command('Enter', { rhythmMode: true })).toEqual({
      type: 'ignore',
      preventDefault: false,
    })
  })

  it('classifies home, end, and escape navigation', () => {
    expect(command('Escape')).toEqual({
      type: 'discardSelection',
      preventDefault: false,
    })
    expect(command('Home', {}, { ctrlKey: true })).toEqual({
      type: 'home',
      rhythmMode: false,
      select: false,
      toChapter: true,
      preventDefault: true,
    })
    expect(command('End', { rhythmMode: true }, { shiftKey: true })).toEqual({
      type: 'end',
      rhythmMode: true,
      select: true,
      toChapter: false,
      preventDefault: true,
    })
  })

  it('classifies backspace variants', () => {
    expect(command('Backspace', { isSelecting: true })).toEqual({
      type: 'backspaceSelection',
      preventDefault: true,
    })
    expect(command('Backspace', { rhythmMode: true, tickIdx: 2 })).toEqual({
      type: 'eraseRhythmTick',
      preventDefault: true,
    })
    expect(command('Backspace', { rhythmMode: true, tickIdx: -1 })).toEqual({
      type: 'deleteRhythmRow',
      preventDefault: true,
    })
    expect(
      command('Backspace', { imeComposing: true, imeGrace: true })
    ).toEqual({
      type: 'imeBackspace',
      where: 'modifier',
      preventDefault: true,
    })
    expect(command('Backspace')).toEqual({
      type: 'backspace',
      preventDefault: true,
    })
  })

  it('classifies delete and minus variants without overriding browser defaults', () => {
    expect(command('Delete', { isSelecting: true })).toEqual({
      type: 'deleteSelection',
      preventDefault: false,
    })
    expect(command('Delete', { rhythmMode: true, tickIdx: -1 })).toEqual({
      type: 'deleteRhythmRow',
      preventDefault: false,
    })
    expect(command('Minus', {}, { shiftKey: true })).toEqual({
      type: 'eraseModifier',
      preventDefault: false,
    })
    expect(command('NumpadSubtract')).toEqual({
      type: 'eraseEntry',
      preventDefault: false,
    })
  })

  it('classifies copy, paste, cut, undo, redo, and select all', () => {
    expect(command('KeyV', {}, { ctrlKey: true })).toEqual({
      type: 'paste',
      preventDefault: true,
    })
    expect(command('KeyC', {}, { ctrlKey: true })).toEqual({
      type: 'copy',
      preventDefault: true,
    })
    expect(command('KeyX', {}, { ctrlKey: true })).toEqual({
      type: 'cut',
      preventDefault: true,
    })
    expect(command('KeyZ', {}, { ctrlKey: true })).toEqual({
      type: 'undo',
      preventDefault: true,
    })
    expect(command('KeyZ', {}, { ctrlKey: true, shiftKey: true })).toEqual({
      type: 'redo',
      preventDefault: true,
    })
    expect(command('KeyA', {}, { ctrlKey: true })).toEqual({
      type: 'selectAll',
      preventDefault: true,
    })
  })

  it('classifies octave shortcuts with legacy preventDefault behavior', () => {
    expect(command('KeyQ')).toEqual({
      type: 'octave',
      delta: -1,
      preventDefault: true,
    })
    expect(command('KeyC')).toEqual({
      type: 'octave',
      delta: 1,
      preventDefault: false,
    })
    expect(command('KeyJ', {}, { ctrlKey: true })).toEqual({
      type: 'octave',
      delta: 1,
      preventDefault: false,
    })
  })

  it('classifies notation and rhythm input', () => {
    expect(command('Comma')).toEqual({
      type: 'writeRest',
      preventDefault: false,
    })
    expect(command('Digit4')).toEqual({
      type: 'writeIme',
      key: '4',
      shiftKey: false,
      preventDefault: true,
    })
    expect(command('Digit4', {}, { shiftKey: true })).toEqual({
      type: 'writeIme',
      key: '4',
      shiftKey: true,
      preventDefault: true,
    })
    expect(command('Digit2', { rhythmMode: true })).toEqual({
      type: 'writeRhythmTick',
      tickIdx: 1,
      preventDefault: true,
    })
    expect(command('Digit9', { rhythmMode: true })).toEqual({
      type: 'ignore',
      preventDefault: false,
    })
  })

  it('classifies pitch and sigim input', () => {
    expect(command('KeyG')).toEqual({
      type: 'writePitch',
      pitchIdx: 0,
      preventDefault: true,
    })
    expect(command('KeyG', { isSelecting: true })).toEqual({
      type: 'ignore',
      preventDefault: false,
    })
    expect(command('Equal', { sigimShow: true })).toEqual({
      type: 'writeIme',
      key: 'Equal',
      shiftKey: true,
      preventDefault: true,
    })
    expect(command('KeyH', { sigimShow: true }, { shiftKey: true })).toEqual({
      type: 'writeIme',
      key: 'KeyH',
      shiftKey: true,
      preventDefault: true,
    })
  })
})

function command(
  code: string,
  context: Partial<KeyboardContext> = {},
  input: Partial<KeyboardInput> = {}
) {
  return getKeyboardCommand(key(code, input), { ...BASE_CONTEXT, ...context })
}

function key(code: string, input: Partial<KeyboardInput> = {}): KeyboardInput {
  return {
    code,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
    ...input,
  }
}
