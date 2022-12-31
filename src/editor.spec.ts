import Cursor from './cursor'
import { MusicEditor, MusicSelector } from './editor'
import { deserializeMusic } from './serializer'

const SAMPLE_YAML = `
-
  양청도드리
-
  name: 초장
  hideRhythm: false
  measure: 4
  padding: 0
  rhythm: |
    떵
    덕
    따닥
    
  scale: 黃太仲林南
  tempo: 140
  content: |
    汰

    南

    〻

    〻:𝆔43
    - 林

    潢

    〻:𝆔43

    林

    南:𝆔43
    - 林

    南

    仲

    太

    黃
    - 太

    林

    仲

    太
    㑲:𝆔343

    太
    △
-
  name: 2장
  hideRhythm: true
  measure: 4
  padding: 0
  rhythm: |
    떵
    덕
    따닥
    
  scale: 黃太仲林南
  tempo: 150
  content: |
    林

    南
    - 林

    潢

    〻:𝆔43

    林

    南
    - 林

    潢

    〻:𝆔43

    林

    仲

    林

    南:𝆔43
    - 林

    潢

    〻:𝆔43

    林

    南:𝆔43
    - 林

    南

    仲

    太

    黃
    - 太

    林

    仲

    太
    㑲:𝆔343

    太
    △`

describe('MusicSelector', () => {
  const music = deserializeMusic(SAMPLE_YAML)
  describe('selection', () => {
    test('normalizeSelection', () => {
      const selector = new MusicSelector(music)
      selector.move('cell', 3)
      selector.createSelection()
      selector.move('cell', 1)
      expect(selector.anchor?.isEqualTo(new Cursor(false, 0, 3, 0, 0))).toBe(
        true
      )
      expect(selector.cursor.isEqualTo(new Cursor(false, 0, 1, 0, 0))).toBe(
        true
      )
      selector.normalizeSelection()
      expect(selector.anchor?.isEqualTo(new Cursor(false, 0, 1, 0, 0))).toBe(
        true
      )
      expect(selector.cursor.isEqualTo(new Cursor(false, 0, 3, 0, 0))).toBe(
        true
      )
    })
    test('selectAll', () => {
      const selector = new MusicSelector(music)
      selector.move('cell', 1)
      selector.selectAll()
      expect(selector.anchor?.isEqualTo(new Cursor(false, 0, 0, 0, 0))).toBe(
        true
      )
      expect(selector.cursor.isEqualTo(new Cursor(false, 1, 23, 1, 0))).toBe(
        true
      )
    })
  })

  describe('copy', () => {
    it('can copy a cell', () => {
      const selector = new MusicSelector(music)
      selector.move('cell', 1)
      const content = selector.copy()
      selector.move('cell', 8)
      expect(content).toMatchObject(selector.copy())
    })
  })
})

describe('MusicEditor', () => {
  const music = deserializeMusic(SAMPLE_YAML)
  describe('paste', () => {
    it('can copy and paste a cell', () => {
      const editor = new MusicEditor(music)
      editor.move('cell', 1)
      const data = editor.get('col').data
      const content = editor.copy()
      editor.discardSelection()
      editor.move('cell', 2)
      editor.paste(content)
      expect(editor.get('col').data).toMatchObject(data)
    })
  })
})
