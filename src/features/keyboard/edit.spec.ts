import { describe, expect, it } from 'vitest'

import type { EntryRange, UndoOp } from '../../domain/navigation/viewer'
import {
  getKeyboardEditUndo,
  type KeyboardEditCommand,
  type KeyboardEditEditor,
} from './edit'

describe('keyboard edit helpers', () => {
  it('deletes an empty selection with a follow-up backspace', () => {
    const editor = makeEditor({ emptyRange: true })
    const op = getKeyboardEditUndo(command('backspaceSelection'), editor)

    const undo = op()
    expect(editor.events).toEqual(['isEmptyRange', 'delRange', 'backspace'])

    undo()
    expect(editor.events).toEqual([
      'isEmptyRange',
      'delRange',
      'backspace',
      'undo:backspace',
      'undo:delRange',
    ])
  })

  it('cuts a non-empty selection for backspace', () => {
    const editor = makeEditor({ emptyRange: false })
    const op = getKeyboardEditUndo(command('backspaceSelection'), editor)

    op()

    expect(editor.events).toEqual(['isEmptyRange', 'cutRange'])
  })

  it('deletes an empty selection with a forward delete', () => {
    const editor = makeEditor({ emptyRange: true })
    const op = getKeyboardEditUndo(command('deleteSelection'), editor)

    const undo = op()
    expect(editor.events).toEqual(['isEmptyRange', 'delRange', 'deletekey'])

    undo()
    expect(editor.events).toEqual([
      'isEmptyRange',
      'delRange',
      'deletekey',
      'undo:deletekey',
      'undo:delRange',
    ])
  })

  it('maps single-step edit commands to their editor operations', () => {
    const editor = makeEditor()

    getKeyboardEditUndo(command('backspace'), editor)()
    getKeyboardEditUndo(command('deleteForward'), editor)()
    getKeyboardEditUndo(command('cutSelection'), editor)()

    expect(editor.events).toEqual(['backspace', 'deletekey', 'cutRange'])
  })
})

type FakeEditor = KeyboardEditEditor & {
  events: string[]
}

function makeEditor({
  emptyRange = false,
}: { emptyRange?: boolean } = {}): FakeEditor {
  const events: string[] = []
  const undo = (name: string): UndoOp => {
    return () => {
      events.push(`undo:${name}`)
    }
  }

  return {
    events,
    isEmptyRange() {
      events.push('isEmptyRange')
      return emptyRange
    },
    delRange() {
      events.push('delRange')
      return undo('delRange')
    },
    backspace() {
      events.push('backspace')
      return undo('backspace')
    },
    deletekey() {
      events.push('deletekey')
      return undo('deletekey')
    },
    cutRange(): [EntryRange, UndoOp] {
      events.push('cutRange')
      return [[], undo('cutRange')]
    },
  }
}

function command(type: KeyboardEditCommand['type']): KeyboardEditCommand {
  return { type, preventDefault: true } as KeyboardEditCommand
}
