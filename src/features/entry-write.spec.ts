import { describe, expect, it } from 'vitest'

import { REST_OBJ, YUL_OBJ } from '../domain/constants'
import type { EntryOf } from '../domain/symbols'
import type { Col, Entry, UndoOp } from '../domain/navigation/viewer'
import { getEntryWriteUndo, type EntryWriteEditor } from './entry-write'

describe('entry write helpers', () => {
  it('does not create a write operation while selecting', () => {
    const editor = makeEditor({ isSelecting: true })
    const op = getEntryWriteUndo(editor, 'main', REST_OBJ, editor.nextID)

    expect(op).toBeUndefined()
    expect(editor.events).toEqual([])
  })

  it('writes a main entry to the current column', () => {
    const editor = makeEditor()
    const op = getEntryWriteUndo(editor, 'main', REST_OBJ, editor.nextID)

    expect(op?.()).toBe(editor.undo)

    expect(editor.written).toEqual({
      id: 101,
      data: { main: REST_OBJ },
    })
    expect(editor.events).toEqual(['nextID', 'get:col', 'write:col'])
  })

  it('preserves the current main entry when writing a modifier', () => {
    const editor = makeEditor({ current: { main: YUL_OBJ[3][0] } })
    const modifier: EntryOf['modifier'] = {
      pitches: [[], [3], []],
      text: 'modifier',
      label: 'modifier',
    }

    const op = getEntryWriteUndo(editor, 'modifier', modifier, editor.nextID)
    op?.()

    expect(editor.written).toEqual({
      id: 101,
      data: { main: YUL_OBJ[3][0], modifier },
    })
  })
})

type FakeEditor = EntryWriteEditor & {
  events: string[]
  nextID(): number
  undo: UndoOp
  written?: Col
}

function makeEditor({
  current = {},
  isSelecting = false,
}: { current?: Entry; isSelecting?: boolean } = {}): FakeEditor {
  const events: string[] = []
  const undo = () => {
    events.push('undo')
  }

  return {
    events,
    isSelecting,
    nextID() {
      events.push('nextID')
      return 101
    },
    undo,
    get(what) {
      events.push(`get:${what}`)
      return { id: 1, data: current } as any
    },
    write(what, col) {
      events.push(`write:${what}`)
      this.written = col as Col
      return undo
    },
  } as FakeEditor
}
