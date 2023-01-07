import { REST_OBJ, YUL_OBJ } from './constants'
import Cursor from './cursor'
import { MusicEditor, MusicSelector } from './editor'
import { deserializeMusic, serializeMusic } from './serializer'
import { SNAP } from './viewer'

const SAMPLE_YAML = `- title: 양청도드리
  instrument: acoustic_grand_piano
- name: 초장
  hideRhythm: false
  measure: 4
  padding: 0
  rhythm: |
    떵
    덕
    덕 덕
    -
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
- name: 2장
  hideRhythm: true
  measure: 4
  padding: 0
  rhythm: |
    떵
    덕
    덕 덕
    -
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
    △
`

describe('MusicSelector', () => {
  const music = deserializeMusic(SAMPLE_YAML)
  describe('selection', () => {
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

  describe('copyEntry', () => {
    it('can copy an empty column', () => {
      const selector = new MusicSelector(music)
      selector.cursor.move(0, 3, 1, 0)
      const content = selector.copyEntry()
      selector.cursor.move(0, 7, 1, 0)
      expect(content).toMatchObject(selector.copyEntry())
    })
    it('can copy a non-empty column', () => {
      const selector = new MusicSelector(music)
      selector.move('cell', 3, SNAP.BACK)
      const content = selector.copyEntry()
      selector.move('cell', 6)
      expect(content).toMatchObject(selector.copyEntry())
    })
  })
  describe('copyRange', () => {
    it('can copy a cell', () => {
      const selector = new MusicSelector(music)
      selector.move('cell', 1)
      selector.createSelection()
      const content = selector.copyRange()
      selector.discardSelection()
      selector.move('cell', 8)
      selector.createSelection()
      expect(content).toMatchObject(selector.copyRange())
    })
    it('can copy cells', () => {
      const selector = new MusicSelector(music)
      selector.move('cell', 12)
      selector.createSelection()
      selector.move('cell', 15, SNAP.BACK)
      const content = selector.copyRange()
      selector.discardSelection()
      selector.cursor.move(1, 20, 0, 0)
      selector.createSelection()
      selector.move('cell', 23, SNAP.BACK)
      expect(content).toMatchObject(selector.copyRange())
    })
    it('can copy cells across chapter', () => {
      const selector = new MusicSelector(music)
      selector.move('cell', 15)
      selector.createSelection()
      selector.move('chapter', 1)
      expect(selector.copyRange()).toMatchObject([
        [[{ main: YUL_OBJ[2][2] }], [{ main: REST_OBJ }]],
        [[{ main: YUL_OBJ[2][7] }]],
      ])
    })
  })
})

describe('MusicEditor', () => {
  const music = deserializeMusic(SAMPLE_YAML)
  const lines = SAMPLE_YAML.split('\n')
  const line1 = lines.indexOf('  content: |') + 1
  const line2 = lines.indexOf('  content: |', line1) + 1

  describe('cutEntry', () => {
    it('can cut an empty column', () => {
      const editor = new MusicEditor(music)
      editor.cursor.move(0, 3, 1, 0)
      const [entry, undo] = editor.cutEntry()
      expect(entry).toMatchObject({})
      expect(serializeMusic(music)).toBe(SAMPLE_YAML)
      undo()
      expect(serializeMusic(music)).toBe(SAMPLE_YAML)
    })
    it('can cut a non-empty column', () => {
      const editor = new MusicEditor(music)
      editor.cursor.move(0, 7, 1, 1)
      const [entry, undo] = editor.cutEntry()
      expect(entry).toMatchObject({ main: YUL_OBJ[2][7] })

      const target = lines.slice()
      target[line1 + 16] = '    - -'
      expect(serializeMusic(music)).toBe(target.join('\n'))
      undo()
      expect(serializeMusic(music)).toBe(SAMPLE_YAML)
    })
  })
  describe('cutRange', () => {
    it('can cut a cell', () => {
      const editor = new MusicEditor(music)
      editor.cursor.move(0, 11, 0, 0)
      editor.createSelection()
      const [entries, undo] = editor.cutRange()
      expect(editor.cursor.isEqualTo(new Cursor(false, 0, 11, 0, 0))).toBe(true)
      expect(entries).toMatchObject([
        [[{ main: YUL_OBJ[2][0] }], [{}, { main: YUL_OBJ[2][2] }]],
      ])

      const target = lines.slice()
      target.splice(line1 + 24, 2, '    -')
      expect(serializeMusic(music)).toBe(target.join('\n'))
      undo()
      expect(serializeMusic(music)).toBe(SAMPLE_YAML)
    })
    it('can cut cells', () => {
      const editor = new MusicEditor(music)
      editor.move('cell', 12)
      editor.createSelection()
      editor.move('cell', 15, SNAP.BACK)
      const [entries, undo] = editor.cutRange()
      expect(editor.cursor.isEqualTo(new Cursor(false, 0, 15, 0, 0))).toBe(true)

      editor.discardSelection()
      editor.cursor.move(1, 20, 0, 0)
      editor.createSelection()
      editor.move('cell', 23, SNAP.BACK)
      expect(entries).toMatchObject(editor.copyRange())

      const target = lines.slice()
      target.splice(line1 + 34, 2, '    -')
      target.splice(line1 + 31, 2, '    -')
      target.splice(line1 + 29, 1, '    -')
      target.splice(line1 + 27, 1, '    -')
      expect(serializeMusic(music)).toBe(target.join('\n'))
      editor.cursor.move(0, 15, 1, 0)
      undo()
      expect(serializeMusic(music)).toBe(SAMPLE_YAML)
    })
    it('can cut cells across chapter', () => {
      const editor = new MusicEditor(music)
      editor.move('cell', 15)
      editor.createSelection()
      editor.move('chapter', 1)
      const [entries, undo] = editor.cutRange()
      expect(entries).toMatchObject([
        [[{ main: YUL_OBJ[2][2] }], [{ main: REST_OBJ }]],
        [[{ main: YUL_OBJ[2][7] }]],
      ])

      const target = lines.slice()
      target.splice(line2, 1, '    -')
      target.splice(line1 + 34, 2, '    -')
      expect(serializeMusic(music)).toBe(target.join('\n'))
      undo()
      expect(serializeMusic(music)).toBe(SAMPLE_YAML)
    })
  })
  describe('pasteEntry', () => {
    it('can copy and paste an empty column', () => {
      const editor = new MusicEditor(music)
      editor.cursor.move(0, 3, 1, 0)
      const content = editor.copyEntry()
      editor.cursor.move(0, 3, 0, 0)
      const undo = editor.pasteEntry(content)

      const target = lines.slice()
      target.splice(line1 + 6, 1, '    -')
      expect(serializeMusic(music)).toBe(target.join('\n'))
      undo()
      expect(serializeMusic(music)).toBe(SAMPLE_YAML)
    })
    it('can cut and paste an empty column', () => {
      const editor = new MusicEditor(music)
      editor.cursor.move(0, 3, 1, 0)
      const [content, undo1] = editor.cutEntry()
      editor.cursor.move(0, 3, 0, 0)
      const undo2 = editor.pasteEntry(content)

      const target = lines.slice()
      target.splice(line1 + 6, 1, '    -')
      expect(serializeMusic(music)).toBe(target.join('\n'))
      undo2()
      editor.cursor.move(0, 3, 1, 0)
      undo1()
      expect(serializeMusic(music)).toBe(SAMPLE_YAML)
    })
    it('can copy and paste a non-empty column', () => {
      const editor = new MusicEditor(music)
      editor.move('cell', 3, SNAP.BACK)
      const content = editor.copyEntry()
      editor.move('cell', 0)
      const undo = editor.pasteEntry(content)

      const target = lines.slice()
      target.splice(line1, 1, '    林')
      expect(serializeMusic(music)).toBe(target.join('\n'))
      undo()
      expect(serializeMusic(music)).toBe(SAMPLE_YAML)
    })
    it('can cut and paste a non-empty column', () => {
      const editor = new MusicEditor(music)
      editor.move('cell', 3, SNAP.BACK)
      const [content, undo1] = editor.cutEntry()
      editor.move('chapter', 1)
      const undo2 = editor.pasteEntry(content)

      const target = lines.slice()
      target.splice(line2, 1, '    林')
      target.splice(line1 + 7, 1, '    - -')
      expect(serializeMusic(music)).toBe(target.join('\n'))
      undo2()
      editor.cursor.move(0, 3, 1, 1)
      undo1()
      expect(serializeMusic(music)).toBe(SAMPLE_YAML)
    })
  })
  describe('pasteRange', () => {
    it('can copy and paste a cell', () => {
      const editor = new MusicEditor(music)
      editor.move('cell', 1)
      editor.createSelection()
      const content = editor.copyRange()
      editor.discardSelection()
      editor.move('cell', 3)
      editor.createSelection()
      const undo = editor.pasteRange(content)
      expect(editor.anchor?.isEqualTo(new Cursor(false, 0, 3, 0, 0))).toBe(true)
      expect(editor.cursor.isEqualTo(new Cursor(false, 0, 3, 0, 0))).toBe(true)

      const target = lines.slice()
      target.splice(line1 + 6, 2, '    南')
      expect(serializeMusic(music)).toBe(target.join('\n'))
      undo()
      expect(serializeMusic(music)).toBe(SAMPLE_YAML)
    })
    it('can cut and paste cells', () => {
      const editor = new MusicEditor(music)
      editor.move('cell', 10)
      editor.createSelection()
      editor.move('cell', 11, SNAP.BACK)
      const [content, undo1] = editor.cutRange()
      expect(editor.cursor.isEqualTo(new Cursor(false, 0, 11, 0, 0))).toBe(true)
      editor.discardSelection()
      editor.cursor.move(1, 6, 0, 0)
      editor.createSelection()
      const undo2 = editor.pasteRange(content)
      expect(editor.anchor?.isEqualTo(new Cursor(false, 1, 6, 0, 0))).toBe(true)
      expect(editor.cursor.isEqualTo(new Cursor(false, 1, 7, 1, 1))).toBe(true)

      const target = lines.slice()
      target.splice(line2 + 14, 3, '    太', '', '    黃', '    - 太')
      target.splice(line1 + 22, 4, '    -', '', '    -')
      expect(serializeMusic(music)).toBe(target.join('\n'))
      undo2()
      editor.cursor.move(0, 3, 1, 1)
      undo1()
      expect(serializeMusic(music)).toBe(SAMPLE_YAML)
    })
    it('can copy and paste cells across chapter', () => {
      const editor = new MusicEditor(music)
      editor.move('cell', 14)
      editor.createSelection()
      editor.move('chapter', 1)
      const content = editor.copyRange()
      editor.discardSelection()
      editor.cursor.move(0, 15, 1, 0)
      const undo = editor.pasteRange(content)
      expect(editor.anchor?.isEqualTo(new Cursor(false, 0, 15, 0, 0))).toBe(
        true
      )
      expect(editor.cursor.isEqualTo(new Cursor(false, 1, 1, 0, 0))).toBe(true)

      const target = lines.slice()
      target.splice(line2, 4, '    太', '    △', '', '    林')
      target.splice(line1 + 35, 1, '    㑲:𝆔343')
      expect(serializeMusic(music)).toBe(target.join('\n'))
      undo()
      expect(serializeMusic(music)).toBe(SAMPLE_YAML)
    })
    it('can copy and paste cells after chapter', () => {
      const editor = new MusicEditor(music)
      editor.move('cell', 15)
      editor.createSelection()
      editor.move('chapter', 1)
      const content = editor.copyRange()
      editor.discardSelection()
      editor.move('cell', -1)
      const undo = editor.pasteRange(content)
      expect(editor.anchor?.isEqualTo(new Cursor(false, 1, 23, 0, 0))).toBe(
        true
      )
      expect(editor.cursor.isEqualTo(new Cursor(false, 1, 24, 0, 0))).toBe(true)

      const target = lines.slice()
      target.push('    林', '')
      expect(serializeMusic(music)).toBe(target.join('\n'))
      undo()
      expect(serializeMusic(music)).toBe(SAMPLE_YAML)
    })
  })
})
