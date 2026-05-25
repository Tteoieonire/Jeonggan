import { CHILD_OF, type ElementOf, type MusicBase, PARENT_OF } from '../score'
import { inRange, wrappedIdx } from '../utils'

export const enum SNAP {
  FRONT = 0,
  BACK = -1,
}

export type CursorState = Readonly<{
  rhythmMode: boolean
  chapter: number
  cell: number
  row: number
  col: number
}>

export type ViewerState = Readonly<{
  music: MusicBase
  cursor: CursorState
}>

type NavigationLevel = keyof typeof PARENT_OF

type ClampResult = Readonly<{
  cursor: CursorState
  inRange: boolean
}>

export function toCursorState(cursor: CursorState): CursorState {
  return {
    rhythmMode: cursor.rhythmMode,
    chapter: cursor.chapter,
    cell: cursor.cell,
    row: cursor.row,
    col: cursor.col,
  }
}

function withCursor(state: ViewerState, cursor: CursorState): ViewerState {
  return { music: state.music, cursor }
}

function getAt<K extends keyof ElementOf>(
  state: ViewerState,
  what: K
): ElementOf[K] {
  const music = state.music
  if (what === 'music') return music as ElementOf[K]

  const chapter = music.data[state.cursor.chapter]
  if (what === 'chapter') return chapter as ElementOf[K]

  const cell = chapter.data[state.cursor.cell]
  if (what === 'cell') return cell as ElementOf[K]

  const row = cell.data[state.cursor.row]
  if (what === 'row') return row as ElementOf[K]

  return row.data[state.cursor.col] as ElementOf[K]
}

function jeong(state: ViewerState, cell: number): number {
  const config = state.music.data[state.cursor.chapter].config
  return (cell + config.padding) % config.rhythm.length
}

function gak(state: ViewerState, cell: number): number {
  const config = state.music.data[state.cursor.chapter].config
  return Math.floor((cell + config.padding) / config.rhythm.length)
}

export function nextCursorForMove(
  state: ViewerState,
  what: NavigationLevel,
  where: number,
  snap: SNAP = SNAP.FRONT
): CursorState {
  let currentLevel = what
  let cursor: CursorState = {
    ...toCursorState(state.cursor),
    rhythmMode: false,
    [currentLevel]: wrappedIdx(
      where,
      getAt(state, PARENT_OF[currentLevel]).data.length
    ),
  }
  let current = withCursor(state, cursor)

  while (currentLevel !== 'col') {
    currentLevel = CHILD_OF[currentLevel]
    cursor = {
      ...cursor,
      [currentLevel]: wrappedIdx(
        snap,
        getAt(current, PARENT_OF[currentLevel]).data.length
      ),
    }
    current = withCursor(state, cursor)
  }
  return cursor
}

export function nextCursorForRhythmMove(
  state: ViewerState,
  what: NavigationLevel,
  where: number
): CursorState {
  let currentLevel = what
  let cursor: CursorState = {
    ...toCursorState(state.cursor),
    rhythmMode: true,
    [currentLevel]: where,
  }

  while (currentLevel !== 'col') {
    currentLevel = CHILD_OF[currentLevel]
    cursor = { ...cursor, [currentLevel]: 0 }
  }
  return cursor
}

export function nextCursorForMoveClamp(
  state: ViewerState,
  what: NavigationLevel,
  where: number,
  snap: SNAP = SNAP.FRONT
): ClampResult {
  if (where < 0) {
    return {
      cursor: nextCursorForMove(state, what, 0, SNAP.FRONT),
      inRange: false,
    }
  }

  if (where >= getAt(state, PARENT_OF[what]).data.length) {
    return {
      cursor: nextCursorForMove(state, what, -1, SNAP.BACK),
      inRange: false,
    }
  }

  return {
    cursor: nextCursorForMove(state, what, where, snap),
    inRange: true,
  }
}

export function nextCursorForStep(
  state: ViewerState,
  level: 'col' | 'row' | 'cell',
  delta: 1 | -1 = +1
): ClampResult {
  const parentLevel = PARENT_OF[level]
  const destPos = state.cursor[level] + delta
  if (inRange(destPos, getAt(state, parentLevel).data.length)) {
    const snap = delta > 0 ? SNAP.FRONT : SNAP.BACK
    return {
      cursor: nextCursorForMove(state, level, destPos, snap),
      inRange: true,
    }
  }

  if (parentLevel === 'chapter') {
    return { cursor: toCursorState(state.cursor), inRange: false }
  }
  return nextCursorForStep(state, parentLevel, delta)
}

export function nextCursorForStepChapter(
  state: ViewerState,
  delta: 1 | -1 = +1
): ClampResult {
  const destPos = state.cursor.chapter + delta
  if (!inRange(destPos, state.music.data.length)) {
    return { cursor: toCursorState(state.cursor), inRange: false }
  }

  const snap = delta > 0 ? SNAP.FRONT : SNAP.BACK
  return {
    cursor: nextCursorForMove(state, 'chapter', destPos, snap),
    inRange: true,
  }
}

export function nextCursorForHome(state: ViewerState): CursorState {
  return nextCursorForMove(
    state,
    'cell',
    state.cursor.cell - jeong(state, state.cursor.cell),
    SNAP.FRONT
  )
}

export function nextCursorForEnd(state: ViewerState): CursorState {
  const measure = state.music.data[state.cursor.chapter].config.rhythm.length
  return nextCursorForMove(
    state,
    'cell',
    state.cursor.cell - jeong(state, state.cursor.cell) + (measure - 1),
    SNAP.BACK
  )
}

export function nextCursorForUpDown(
  state: ViewerState,
  direction: 'up' | 'down'
): CursorState {
  const delta = direction === 'down' ? +1 : -1
  const snap = direction === 'down' ? SNAP.FRONT : SNAP.BACK

  if (state.cursor.rhythmMode) {
    const rhythm = getAt(state, 'chapter').config.rhythm
    if (inRange(state.cursor.row + delta, rhythm[state.cursor.cell].length)) {
      return nextCursorForRhythmMove(state, 'row', state.cursor.row + delta)
    }

    if (inRange(state.cursor.cell + delta, rhythm.length)) {
      const moved = withCursor(
        state,
        nextCursorForRhythmMove(state, 'cell', state.cursor.cell + delta)
      )
      return nextCursorForRhythmMove(
        moved,
        'row',
        direction === 'down' ? 0 : rhythm[moved.cursor.cell].length - 1
      )
    }
    return toCursorState(state.cursor)
  }

  const src = (state.cursor.col + 0.49) / getAt(state, 'row').data.length
  let current = state
  let moved = nextCursorForMoveClamp(
    current,
    'row',
    state.cursor.row + delta,
    snap
  )
  current = withCursor(current, moved.cursor)

  if (!moved.inRange) {
    moved = nextCursorForMoveClamp(
      current,
      'cell',
      current.cursor.cell + delta,
      snap
    )
    current = withCursor(current, moved.cursor)
  }

  if (!moved.inRange) {
    moved = nextCursorForMoveClamp(
      current,
      'chapter',
      current.cursor.chapter + delta,
      snap
    )
    current = withCursor(current, moved.cursor)
  }

  return nextCursorForMove(
    current,
    'col',
    Math.floor(src * getAt(current, 'row').data.length)
  )
}

export function nextCursorForLeftRight(
  state: ViewerState,
  direction: 'left' | 'right'
): CursorState {
  if (state.cursor.rhythmMode)
    return nextCursorForLeftRightRhythm(state, direction)

  const chapter = state.music.data[state.cursor.chapter]
  const config = chapter.config
  let delta = direction === 'right' ? +1 : -1
  const snap = direction === 'right' ? SNAP.FRONT : SNAP.BACK
  let current = state

  const colMove = nextCursorForMoveClamp(
    current,
    'col',
    current.cursor.col + delta
  )
  current = withCursor(current, colMove.cursor)
  if (colMove.inRange) return current.cursor

  delta = direction === 'left' ? +1 : -1
  const destPos = current.cursor.cell + delta * config.rhythm.length
  if (inRange(destPos, getAt(current, 'chapter').data.length)) {
    const src = (current.cursor.row + 0.49) / getAt(current, 'cell').data.length
    current = withCursor(current, nextCursorForMove(current, 'cell', destPos))
    return nextCursorForMove(
      current,
      'row',
      Math.floor(src * getAt(current, 'cell').data.length),
      snap
    )
  }

  if (
    inRange(gak(current, destPos), gak(current, chapter.data.length - 1) + 1)
  ) {
    return nextCursorForMoveClamp(current, 'cell', destPos, snap).cursor
  }

  if (!config.hideRhythm && direction === 'right') {
    const src = (current.cursor.row + 0.49) / getAt(current, 'cell').data.length
    current = withCursor(
      current,
      nextCursorForRhythmMove(
        current,
        'cell',
        current.cursor.cell + config.padding
      )
    )
    return nextCursorForRhythmMove(
      current,
      'row',
      Math.floor(src * config.rhythm[current.cursor.cell].length)
    )
  }

  return nextCursorForLeftRightChapter(current, direction)
}

function nextCursorForLeftRightRhythm(
  state: ViewerState,
  direction: 'left' | 'right'
): CursorState {
  const chapter = state.music.data[state.cursor.chapter]
  const rhythm = chapter.config.rhythm
  const src = (state.cursor.row + 0.49) / rhythm[state.cursor.cell].length

  if (direction === 'left') {
    let current = state
    const cellMove = nextCursorForMoveClamp(
      current,
      'cell',
      current.cursor.cell - chapter.config.padding
    )
    current = withCursor(current, cellMove.cursor)
    if (cellMove.inRange) {
      current = withCursor(
        current,
        nextCursorForMove(
          current,
          'row',
          Math.floor(src * getAt(current, 'cell').data.length)
        )
      )
    }
    return nextCursorForMove(current, 'col', -1)
  }

  if (state.cursor.chapter <= 0) return toCursorState(state.cursor)

  let current = state
  const srcJeong = current.cursor.cell
  current = withCursor(
    current,
    nextCursorForMove(current, 'chapter', current.cursor.chapter - 1)
  )
  const lastCell = state.music.data[current.cursor.chapter].data.length - 1
  const cellMove = nextCursorForMoveClamp(
    current,
    'cell',
    lastCell - jeong(current, lastCell) + srcJeong
  )
  current = withCursor(current, cellMove.cursor)
  if (cellMove.inRange) {
    current = withCursor(
      current,
      nextCursorForMove(
        current,
        'row',
        Math.floor(src * getAt(current, 'cell').data.length)
      )
    )
  }
  return nextCursorForMove(current, 'col', 0)
}

function nextCursorForLeftRightChapter(
  state: ViewerState,
  direction: 'left' | 'right'
): CursorState {
  const delta = direction === 'left' ? +1 : -1
  let snap = direction === 'left' ? SNAP.FRONT : SNAP.BACK
  const srcJeong = jeong(state, state.cursor.cell)
  const src = (state.cursor.row + 0.49) / getAt(state, 'cell').data.length

  if (!inRange(state.cursor.chapter + delta, state.music.data.length)) {
    return toCursorState(state.cursor)
  }

  let current = withCursor(
    state,
    nextCursorForMove(state, 'chapter', state.cursor.chapter + delta, snap)
  )
  const chapter = state.music.data[current.cursor.chapter]
  const config = chapter.config

  if (!config.hideRhythm && direction === 'left') {
    current = withCursor(
      current,
      nextCursorForRhythmMove(current, 'cell', srcJeong)
    )
    return nextCursorForRhythmMove(
      current,
      'row',
      Math.floor(src * config.rhythm[srcJeong].length)
    )
  }

  const head = chapter.data.length - 1 - jeong(current, chapter.data.length - 1)
  const destPos = srcJeong + (direction === 'left' ? -config.padding : head)
  const cellMove = nextCursorForMoveClamp(current, 'cell', destPos, snap)
  current = withCursor(current, cellMove.cursor)
  if (!cellMove.inRange) return current.cursor

  snap = direction === 'right' ? SNAP.FRONT : SNAP.BACK
  return nextCursorForMove(
    current,
    'row',
    Math.floor(src * getAt(current, 'cell').data.length),
    snap
  )
}
