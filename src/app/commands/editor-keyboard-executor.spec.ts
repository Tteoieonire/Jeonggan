import { describe, expect, it, vi } from 'vitest'

import { YUL_OBJ } from '../../domain/constants'
import Cursor from '../../domain/navigation/cursor'
import { Music } from '../../domain/music'
import { MusicEditor } from '../../domain/editing/music-editor'
import { Config, UndoOp } from '../../domain/navigation/viewer'
import type { ClipboardData } from '../../features/clipboard'
import { IME } from '../../features/ime'
import { executeEditorCommand, type EditorCommand } from './editor-command'
import {
  createEditorHistory,
  type EditorHistory,
} from '../sessions/editor-history'
import {
  executeEditorKeyboardCommand,
  type EditorKeyboardExecutorHost,
} from './editor-keyboard-executor'

const CONFIG: Config = {
  name: '초장',
  tempo: 60,
  measure: [2],
  rhythm: [['떵'], ['덕']],
  hideRhythm: false,
  scale: [0, 2, 5, 7, 9],
  padding: 0,
}

describe('editor keyboard executor', () => {
  it('executes mapped editor commands', () => {
    const host = makeHost()

    executeEditorKeyboardCommand(host, {
      type: 'writePitch',
      pitchIdx: 2,
      preventDefault: true,
    })

    expect(host.editor.get('col').data.main).toEqual(YUL_OBJ[3][2])
    expect(host.history.undoable).toBe(true)
  })

  it('executes keyboard navigation commands', () => {
    const host = makeHost()
    host.editor.add('cell')
    host.editor.anchor = new Cursor(false, 0, 0, 0, 0)
    host.editor.cursor.move(0, 1, 0, 0)

    executeEditorKeyboardCommand(host, {
      type: 'discardSelection',
      preventDefault: false,
    })

    expect(host.editor.anchor).toBeUndefined()
  })

  it('executes keyboard edit commands through history', () => {
    const host = makeHost()
    host.editor.get('col').data.main = YUL_OBJ[3][0]

    executeEditorKeyboardCommand(host, {
      type: 'backspace',
      preventDefault: true,
    })

    expect(host.editor.get('col').data.main).toBeUndefined()
    host.history.undo()
    expect(host.editor.get('col').data.main).toEqual(YUL_OBJ[3][0])
  })

  it('delegates octave commands to the session-level octave writer', () => {
    const host = makeHost()
    host.writeOctave = vi.fn()

    executeEditorKeyboardCommand(host, {
      type: 'octave',
      delta: 1,
      preventDefault: false,
    })

    expect(host.writeOctave).toHaveBeenCalledWith(1)
  })

  it('executes select-all commands directly on the editor', () => {
    const host = makeHost()
    host.editor.add('cell')

    executeEditorKeyboardCommand(host, {
      type: 'selectAll',
      preventDefault: true,
    })

    expect(host.editor.isSelecting).toBe(true)
  })
})

type TestHost = EditorKeyboardExecutorHost & {
  music: Music
  editor: MusicEditor
  history: EditorHistory
  clipboard: ClipboardData | undefined
}

function makeHost(): TestHost {
  const music = new Music('test')
  music.data.push(music.score.chapter(CONFIG))
  const editor = music.getEditor()
  const ime = new IME()
  const history = createEditorHistory(editor, () => {})

  const host: TestHost = {
    music,
    editor,
    config: CONFIG,
    ime,
    history,
    clipboard: undefined,
    octave: 0,
    sigimShow: true,
    execute(command: EditorCommand) {
      executeEditorCommand(host, command)
    },
    doWithHistory(op: () => UndoOp) {
      history.do(op)
    },
    writeOctave() {},
  }

  return host
}
