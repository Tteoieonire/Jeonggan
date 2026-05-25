import { RHYTHM_OBJ } from './constants'
import type { CoordLevel } from './cursor'

export type KeyboardInput = Pick<
  KeyboardEvent,
  'code' | 'ctrlKey' | 'shiftKey' | 'altKey' | 'metaKey'
>

export type KeyboardContext = {
  playerActive: boolean
  isSelecting: boolean
  rhythmMode: boolean
  sigimShow: boolean
  tickIdx: number
  imeComposing: boolean
  imeGrace: boolean
}

export const PITCH_KEY_CODES = [
  'KeyG',
  'KeyE',
  'KeyX',
  'KeyU',
  'KeyR',
  'KeyW',
  'KeyB',
  'KeyD',
  'KeyL',
  'KeyS',
  'KeyA',
  'KeyM',
] as const

type NavigationCommand =
  | {
      type: 'moveUpDown'
      direction: 'up' | 'down'
      select: boolean
      preventDefault: true
    }
  | {
      type: 'moveLeftRight'
      direction: 'left' | 'right'
      select: boolean
      preventDefault: true
    }

export type KeyboardCommand =
  | { type: 'ignore'; preventDefault: boolean }
  | NavigationCommand
  | {
      type: 'shapeChange'
      what: CoordLevel
      delta: -1 | 1
      preventDefault: boolean
    }
  | { type: 'discardSelection'; preventDefault: false }
  | {
      type: 'home'
      rhythmMode: boolean
      select: boolean
      toChapter: boolean
      preventDefault: true
    }
  | {
      type: 'end'
      rhythmMode: boolean
      select: boolean
      toChapter: boolean
      preventDefault: true
    }
  | { type: 'backspaceSelection'; preventDefault: true }
  | { type: 'backspace'; preventDefault: true }
  | { type: 'deleteSelection'; preventDefault: false }
  | { type: 'deleteForward'; preventDefault: false }
  | { type: 'eraseRhythmTick'; preventDefault: boolean }
  | { type: 'deleteRhythmRow'; preventDefault: boolean }
  | {
      type: 'imeBackspace'
      where: 'main' | 'modifier'
      preventDefault: true
    }
  | { type: 'eraseModifier'; preventDefault: false }
  | { type: 'cutSelection'; preventDefault: false }
  | { type: 'eraseEntry'; preventDefault: false }
  | { type: 'paste'; preventDefault: true }
  | { type: 'copy'; preventDefault: true }
  | { type: 'octave'; delta: -1 | 1; preventDefault: boolean }
  | { type: 'writeRest'; preventDefault: false }
  | { type: 'writeIme'; key: string; shiftKey: boolean; preventDefault: true }
  | { type: 'writeRhythmTick'; tickIdx: number; preventDefault: true }
  | { type: 'undo'; preventDefault: true }
  | { type: 'redo'; preventDefault: true }
  | { type: 'selectAll'; preventDefault: true }
  | { type: 'cut'; preventDefault: true }
  | { type: 'writePitch'; pitchIdx: number; preventDefault: true }

const ignore: KeyboardCommand = { type: 'ignore', preventDefault: false }

export function getKeyboardCommand(
  e: KeyboardInput,
  context: KeyboardContext
): KeyboardCommand {
  if (context.playerActive) return ignore

  switch (e.code) {
    case 'ArrowUp':
      return moveUpDown('up', e.shiftKey)
    case 'ArrowDown':
      return moveUpDown('down', e.shiftKey)
    case 'ArrowLeft':
      return moveLeftRight('left', e.shiftKey)
    case 'ArrowRight':
      return moveLeftRight('right', e.shiftKey)
    case 'Space':
      if (context.isSelecting || !e.shiftKey || context.rhythmMode)
        return ignore
      return shapeChange('col', +1, true)
    case 'Enter':
    case 'NumpadEnter':
      if (context.isSelecting) return ignore
      if (e.shiftKey) return shapeChange('row', +1, true)
      if (context.rhythmMode) return ignore
      return shapeChange('cell', +1, true)
    case 'Escape':
      return { type: 'discardSelection', preventDefault: false }
    case 'Home':
      return {
        type: 'home',
        rhythmMode: context.rhythmMode,
        select: e.shiftKey,
        toChapter: e.ctrlKey,
        preventDefault: true,
      }
    case 'End':
      return {
        type: 'end',
        rhythmMode: context.rhythmMode,
        select: e.shiftKey,
        toChapter: e.ctrlKey,
        preventDefault: true,
      }
    case 'Backspace':
      if (context.isSelecting)
        return { type: 'backspaceSelection', preventDefault: true }
      if (context.rhythmMode)
        return context.tickIdx !== -1
          ? { type: 'eraseRhythmTick', preventDefault: true }
          : { type: 'deleteRhythmRow', preventDefault: true }
      if (context.imeComposing) {
        return {
          type: 'imeBackspace',
          where: context.imeGrace ? 'modifier' : 'main',
          preventDefault: true,
        }
      }
      return { type: 'backspace', preventDefault: true }
    case 'Minus':
    case 'NumpadSubtract':
      if (context.rhythmMode) return ignore
      if (hasShiftKeyOnly(e))
        return context.isSelecting
          ? ignore
          : { type: 'eraseModifier', preventDefault: false }
      if (hasModifierKey(e)) return ignore
      return context.isSelecting
        ? { type: 'cutSelection', preventDefault: false }
        : { type: 'eraseEntry', preventDefault: false }
    case 'Delete':
      if (context.isSelecting)
        return { type: 'deleteSelection', preventDefault: false }
      if (context.rhythmMode)
        return context.tickIdx !== -1
          ? { type: 'eraseRhythmTick', preventDefault: false }
          : { type: 'deleteRhythmRow', preventDefault: false }
      return { type: 'deleteForward', preventDefault: false }
    case 'KeyV':
      if (hasCtrlKeyOnly(e)) return { type: 'paste', preventDefault: true }
      return lowerOctave(context)
    case 'Slash':
    case 'KeyQ':
    case 'KeyK':
      return lowerOctave(context)
    case 'KeyC':
      if (hasCtrlKeyOnly(e)) return { type: 'copy', preventDefault: true }
      return raiseOctave(context)
    case 'Semicolon':
    case 'KeyT':
    case 'KeyJ':
      return raiseOctave(context)
    case 'Comma':
      if (context.rhythmMode || context.isSelecting) return ignore
      return { type: 'writeRest', preventDefault: false }
    case 'Equal':
      if (
        context.rhythmMode ||
        e.ctrlKey ||
        e.altKey ||
        e.metaKey ||
        !context.sigimShow ||
        context.isSelecting
      )
        return ignore
      return {
        type: 'writeIme',
        key: e.code,
        shiftKey: true,
        preventDefault: true,
      }
    case 'Backquote':
    case 'KeyH':
    case 'KeyI':
      if (
        context.rhythmMode ||
        !hasShiftKeyOnly(e) ||
        !context.sigimShow ||
        context.isSelecting
      )
        return ignore
      return {
        type: 'writeIme',
        key: e.code,
        shiftKey: true,
        preventDefault: true,
      }
    default:
      return defaultCommand(e, context)
  }
}

export function hasModifierKey(e: KeyboardInput): boolean {
  return e.ctrlKey || e.shiftKey || e.altKey || e.metaKey
}

export function hasCtrlKeyOnly(e: KeyboardInput): boolean {
  return e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey
}

export function hasShiftKeyOnly(e: KeyboardInput): boolean {
  return !e.ctrlKey && e.shiftKey && !e.altKey && !e.metaKey
}

function moveUpDown(
  direction: 'up' | 'down',
  select: boolean
): KeyboardCommand {
  return { type: 'moveUpDown', direction, select, preventDefault: true }
}

function moveLeftRight(
  direction: 'left' | 'right',
  select: boolean
): KeyboardCommand {
  return { type: 'moveLeftRight', direction, select, preventDefault: true }
}

function shapeChange(
  what: CoordLevel,
  delta: -1 | 1,
  preventDefault: boolean
): KeyboardCommand {
  return { type: 'shapeChange', what, delta, preventDefault }
}

function lowerOctave(context: KeyboardContext): KeyboardCommand {
  if (context.rhythmMode) return ignore
  return { type: 'octave', delta: -1, preventDefault: true }
}

function raiseOctave(context: KeyboardContext): KeyboardCommand {
  if (context.rhythmMode) return ignore
  return { type: 'octave', delta: +1, preventDefault: false }
}

function defaultCommand(
  e: KeyboardInput,
  context: KeyboardContext
): KeyboardCommand {
  const digit = getDigit(e.code)
  if (digit != null) return digitCommand(e, context, digit)

  if (e.ctrlKey) {
    if (e.code === 'KeyZ')
      return e.shiftKey
        ? { type: 'redo', preventDefault: true }
        : { type: 'undo', preventDefault: true }
    if (e.code === 'KeyA' && hasCtrlKeyOnly(e))
      return { type: 'selectAll', preventDefault: true }
    if (e.code === 'KeyX' && hasCtrlKeyOnly(e))
      return { type: 'cut', preventDefault: true }
    return { type: 'ignore', preventDefault: true }
  }

  if (context.rhythmMode) return ignore
  if (hasModifierKey(e) && !hasShiftKeyOnly(e)) return ignore

  const pitchIdx = PITCH_KEY_CODES.indexOf(e.code as any)
  if (pitchIdx === -1) return ignore
  if (context.isSelecting) return ignore
  return { type: 'writePitch', pitchIdx, preventDefault: true }
}

function digitCommand(
  e: KeyboardInput,
  context: KeyboardContext,
  digit: number
): KeyboardCommand {
  if (context.isSelecting) return ignore
  if (hasModifierKey(e) && !hasShiftKeyOnly(e)) return ignore

  if (context.rhythmMode) {
    const tickIdx = digit - 1
    if (e.shiftKey || tickIdx < 0 || tickIdx >= RHYTHM_OBJ.length) return ignore
    return { type: 'writeRhythmTick', tickIdx, preventDefault: true }
  }

  return {
    type: 'writeIme',
    key: String(digit),
    shiftKey: e.shiftKey,
    preventDefault: true,
  }
}

function getDigit(code: string): number | undefined {
  const prefix = code.slice(0, -1)
  if (prefix !== 'Digit' && prefix !== 'Numpad') return undefined

  const digit = Number(code.slice(-1))
  return Number.isInteger(digit) ? digit : undefined
}
