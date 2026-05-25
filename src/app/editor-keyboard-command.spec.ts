import { describe, expect, it } from 'vitest'

import { REST_OBJ, YUL_OBJ } from '../domain/constants'
import { IME } from '../features/ime'
import type { KeyboardCommand } from '../features/keyboard'
import { editorCommandFromKeyboard } from './editor-keyboard-command'

describe('editor keyboard command mapping', () => {
  it('maps shape, rhythm, clipboard, and history commands', () => {
    expect(resolve({ type: 'shapeChange', what: 'cell', delta: 1 })).toEqual({
      type: 'changeShape',
      level: 'cell',
      delta: 1,
    })
    expect(resolve({ type: 'deleteRhythmRow' })).toEqual({
      type: 'changeShape',
      level: 'row',
      delta: -1,
    })
    expect(resolve({ type: 'writeRhythmTick', tickIdx: 2 })).toEqual({
      type: 'writeRhythmTick',
      tickIdx: 2,
    })
    expect(resolve({ type: 'copy' })).toEqual({ type: 'copy' })
    expect(resolve({ type: 'paste' })).toEqual({ type: 'paste' })
    expect(resolve({ type: 'undo' })).toEqual({ type: 'undo' })
    expect(resolve({ type: 'redo' })).toEqual({ type: 'redo' })
  })

  it('maps entry-writing keyboard commands', () => {
    expect(resolve({ type: 'writeRest' })).toEqual({
      type: 'writeEntry',
      where: 'main',
      entry: REST_OBJ,
    })
    expect(resolve({ type: 'writePitch', pitchIdx: 2 }, { octave: 1 })).toEqual(
      {
        type: 'writeEntry',
        where: 'main',
        entry: YUL_OBJ[4][2],
      }
    )
    expect(resolve({ type: 'eraseModifier' })).toEqual({
      type: 'writeEntry',
      where: 'modifier',
      entry: undefined,
    })
  })

  it('maps IME writes without resetting composition', () => {
    expect(resolve({ type: 'writeIme', key: '1', shiftKey: false })).toEqual({
      type: 'writeEntry',
      where: 'main',
      entry: expect.objectContaining({ text: '뒷시김새로표' }),
      resetIme: false,
    })
  })

  it('skips IME writes that are not allowed in the current state', () => {
    expect(
      resolve(
        { type: 'writeIme', key: '1', shiftKey: false },
        { isSelecting: true }
      )
    ).toBeUndefined()
    expect(
      resolve(
        { type: 'writeIme', key: '1', shiftKey: true },
        { sigimShow: false }
      )
    ).toBeUndefined()
  })

  it('maps IME backspace to an entry write', () => {
    const ime = new IME()
    ime.update('1', false)

    expect(resolve({ type: 'imeBackspace', where: 'main' }, { ime })).toEqual({
      type: 'writeEntry',
      where: 'main',
      entry: undefined,
      resetIme: false,
    })
  })

  it('leaves navigation and edit-only commands for the session dispatcher', () => {
    expect(resolve({ type: 'ignore', preventDefault: false })).toBeUndefined()
    expect(resolve({ type: 'backspace' })).toBeUndefined()
    expect(
      resolve({ type: 'moveLeftRight', direction: 'left', select: false })
    ).toBeUndefined()
    expect(resolve({ type: 'octave', delta: 1 })).toBeUndefined()
  })
})

type StateInput = {
  ime?: IME
  isSelecting?: boolean
  octave?: number
  sigimShow?: boolean
}

function resolve(command: object, input: StateInput = {}) {
  return editorCommandFromKeyboard(
    { preventDefault: true, ...command } as KeyboardCommand,
    {
      editor: { isSelecting: input.isSelecting ?? false },
      ime: input.ime ?? new IME(),
      octave: input.octave ?? 0,
      sigimShow: input.sigimShow ?? true,
    }
  )
}
