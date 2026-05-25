import { describe, expect, it } from 'vitest'

import { REST_OBJ, YUL_OBJ } from '../../domain/constants'
import Cursor from '../../domain/navigation/cursor'
import { Music } from '../../domain/music'
import { MusicEditor } from '../../domain/editing/music-editor'
import { Config } from '../../domain/navigation/viewer'
import type { ClipboardData } from '../../features/clipboard'
import { IME } from '../../features/ime'
import {
  createEditorHistory,
  type EditorHistory,
} from '../sessions/editor-history'
import { executeEditorCommand, type EditorCommandHost } from './editor-command'

const CONFIG: Config = {
  name: '초장',
  tempo: 60,
  measure: [2],
  rhythm: [['떵'], ['덕']],
  hideRhythm: false,
  scale: [0, 2, 5, 7, 9],
  padding: 0,
}

describe('editor command executor', () => {
  it('writes entries through history and resets IME by default', () => {
    const host = makeHost()
    host.editor.get('col').data.main = YUL_OBJ[3][0]
    host.ime.update('1', false)

    executeEditorCommand(host, {
      type: 'writeEntry',
      where: 'main',
      entry: REST_OBJ,
    })

    expect(host.editor.get('col').data.main).toEqual(REST_OBJ)
    expect(host.ime.isComposing()).toBe(false)

    executeEditorCommand(host, { type: 'undo' })
    expect(host.editor.get('col').data.main).toEqual(YUL_OBJ[3][0])

    executeEditorCommand(host, { type: 'redo' })
    expect(host.editor.get('col').data.main).toEqual(REST_OBJ)
  })

  it('can preserve IME composition for IME-backed writes', () => {
    const host = makeHost()
    host.ime.update('1', false)

    executeEditorCommand(host, {
      type: 'writeEntry',
      where: 'main',
      entry: YUL_OBJ[3][0],
      resetIme: false,
    })

    expect(host.ime.isComposing()).toBe(true)
  })

  it('changes score shape through history', () => {
    const host = makeHost()

    executeEditorCommand(host, {
      type: 'changeShape',
      level: 'cell',
      delta: +1,
    })
    expect(host.editor.get('chapter').data).toHaveLength(2)

    executeEditorCommand(host, { type: 'undo' })
    expect(host.editor.get('chapter').data).toHaveLength(1)
  })

  it('copies, cuts, and pastes through a shared clipboard', () => {
    const host = makeHost()
    host.editor.get('col').data.main = YUL_OBJ[3][0]

    executeEditorCommand(host, { type: 'copy' })
    expect(host.clipboard).toEqual(['Entry', { main: YUL_OBJ[3][0] }])

    executeEditorCommand(host, { type: 'cut' })
    expect(host.clipboard?.[0]).toBe('Entry')
    expect(host.editor.get('col').data.main).toBeUndefined()

    executeEditorCommand(host, { type: 'paste' })
    expect(host.editor.get('col').data.main).toEqual(YUL_OBJ[3][0])
  })

  it('writes and erases rhythm ticks', () => {
    const host = makeHost()
    host.editor.cursor.moveRhythm(0, 0, 0)

    executeEditorCommand(host, { type: 'writeRhythmTick', tickIdx: 1 })
    expect(host.editor.currentRhythmTick()).toBe('쿵')

    executeEditorCommand(host, { type: 'erase' })
    expect(host.editor.currentRhythmTick()).toBe('')
  })

  it('ignores entry edits while a range is selected', () => {
    const host = makeHost()
    host.editor.add('cell')
    host.editor.anchor = new Cursor(false, 0, 0, 0, 0)
    host.editor.cursor.move(0, 1, 0, 0)

    executeEditorCommand(host, {
      type: 'writeEntry',
      where: 'main',
      entry: REST_OBJ,
    })

    expect(host.editor.get('col').data.main).toBeUndefined()
    expect(host.history.undoable).toBe(false)
  })
})

type TestHost = EditorCommandHost & {
  music: Music
  editor: MusicEditor
  history: EditorHistory
}

function makeHost(): TestHost {
  const music = new Music('test')
  music.data.push(music.score.chapter(CONFIG))
  const editor = music.getEditor()
  const ime = new IME()
  const history = createEditorHistory(editor, () => {})
  const clipboard: ClipboardData | undefined = undefined

  return { music, editor, ime, history, clipboard }
}
