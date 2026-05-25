import { describe, expect, it } from 'vitest'

import { REST_OBJ, YUL_OBJ } from '../../domain/constants'
import Cursor from '../../domain/navigation/cursor'
import { Music } from '../../domain/music'
import { Chapter, Config } from '../../domain/navigation/viewer'
import { EditorSession } from './editor-session'

const CONFIG: Config = {
  name: '새 장',
  tempo: 60,
  measure: [2],
  rhythm: [['떵'], ['덕']],
  hideRhythm: false,
  scale: [0, 2, 5, 7, 9],
  padding: 0,
}

describe('EditorSession', () => {
  it('creates the default editable music state', () => {
    const session = new EditorSession()

    expect(session.music.title).toBe('새 곡')
    expect(session.editor.get('col').data.main).toEqual(YUL_OBJ[3][0])
    expect(session.sigimShow).toBe(true)
    expect(session.config.name).toBe('초장')
  })

  it('writes entries through history and restores them with undo and redo', () => {
    const session = new EditorSession()

    session.write('main', REST_OBJ)
    expect(session.editor.get('col').data.main).toEqual(REST_OBJ)
    expect(session.sigimShow).toBe(false)

    session.undo()
    expect(session.editor.get('col').data.main).toEqual(YUL_OBJ[3][0])
    expect(session.sigimShow).toBe(true)

    session.redo()
    expect(session.editor.get('col').data.main).toEqual(REST_OBJ)
  })

  it('executes keyboard commands without Vue component state', () => {
    const session = new EditorSession()

    session.executeKeyboardCommand({
      type: 'writePitch',
      pitchIdx: 2,
      preventDefault: true,
    })

    expect(session.editor.get('col').data.main).toEqual(YUL_OBJ[3][2])
  })

  it('exposes derived editor state for the Vue adapter', () => {
    const session = new EditorSession()

    expect(session.gaks).toEqual(session.music.asGaks())
    expect(session.canvasLabel(false)).toContain('황종, 초장 1각 1번째 정간')
    expect(session.canvasLabel(true)).toBe('')

    session.write('main', REST_OBJ)
    expect(session.canUndo(false)).toBe(true)
    expect(session.canUndo(true)).toBe(false)

    session.undo()
    expect(session.canRedo(false)).toBe(true)
    expect(session.canRedo(true)).toBe(false)
  })

  it('keeps octave and clipboard when loading different music', () => {
    const session = new EditorSession()
    session.changeOctave(1)
    session.copy()
    const clipboard = session.clipboard

    session.load(new Music('loaded', [new Chapter(CONFIG)]))

    expect(session.music.title).toBe('loaded')
    expect(session.octave).toBe(1)
    expect(session.clipboard).toBe(clipboard)
  })

  it('calls the focus hook after cursor movement', () => {
    let requests = 0
    const session = new EditorSession({
      requestFocus: () => {
        requests += 1
      },
    })
    requests = 0

    session.moveTo(new Cursor(false, 0, 1, 0, 0))

    expect(requests).toBe(1)
  })

  it('tracks canvas drag selection as session state', () => {
    const session = new EditorSession()

    session.pointerDown(new Cursor(false, 0, 0, 0, 0))
    session.pointerOver(new Cursor(false, 0, 1, 0, 0))

    expect(session.isDragging).toBe(true)
    expect(
      session.editor.anchor?.isEqualTo(new Cursor(false, 0, 0, 0, 0))
    ).toBe(true)
    expect(session.editor.cursor.isEqualTo(new Cursor(false, 0, 1, 0, 0))).toBe(
      true
    )

    session.pointerUp()
    session.pointerOver(new Cursor(false, 0, 0, 0, 0))

    expect(session.isDragging).toBe(false)
    expect(session.editor.cursor.isEqualTo(new Cursor(false, 0, 1, 0, 0))).toBe(
      true
    )
  })
})
