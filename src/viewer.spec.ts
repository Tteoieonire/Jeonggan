import { YUL_OBJ } from './constants'
import Cursor from './cursor'
import { deserializeMusic } from './serializer'
import { querySymbol } from './symbols'
import { MusicViewer, SNAP } from './viewer'

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

export function createSampleMusic() {
  return deserializeMusic(SAMPLE_YAML)
}

describe('Music', () => {
  describe('asGaks', () => {
    const music = createSampleMusic()
    const gaks = music.asGaks()

    it('should match in structure', () => {
      expect(gaks[0]).toMatchObject({
        title: '초장',
        chapterID: expect.any(Number),
        chapterIndex: 0,
        gakIndex: -1,
        rhythm: true,
        content: ['떵', '덕', '따닥', ''],
        measure: 4,
        padding: 0,
      })
      expect(gaks[1]).toMatchObject({
        title: '초장',
        chapterID: expect.any(Number),
        chapterIndex: 0,
        gakIndex: 0,
        rhythm: false,
        measure: 4,
        padding: 0,
        content: [
          {
            id: expect.any(Number),
            data: [
              {
                id: expect.any(Number),
                data: [
                  { id: expect.any(Number), data: { main: YUL_OBJ[3][2] } },
                ],
              },
            ],
          },
          {
            id: expect.any(Number),
            data: [
              {
                id: expect.any(Number),
                data: [
                  { id: expect.any(Number), data: { main: YUL_OBJ[2][9] } },
                ],
              },
            ],
          },
          {
            id: expect.any(Number),
            data: [
              {
                id: expect.any(Number),
                data: [
                  {
                    id: expect.any(Number),
                    data: { main: querySymbol('main', '3') },
                  },
                ],
              },
            ],
          },
          {
            id: expect.any(Number),
            data: [
              {
                id: expect.any(Number),
                data: [
                  {
                    id: expect.any(Number),
                    data: {
                      main: querySymbol('main', '3'),
                      modifier: querySymbol('modifier', '43'),
                    },
                  },
                ],
              },
              {
                id: expect.any(Number),
                data: [
                  {
                    id: expect.any(Number),
                    data: {},
                  },
                  {
                    id: expect.any(Number),
                    data: { main: YUL_OBJ[2][7] },
                  },
                ],
              },
            ],
          },
        ],
      })
    })

    it('should segment cells', () => {
      expect(gaks.length).toBe(11)
      expect(gaks.every(gak => gak.content.length === 4)).toBe(true)
    })
  })
})

describe('MusicViewer', () => {
  const music = createSampleMusic()
  describe('move', () => {
    test('snap', () => {
      const viewer = new MusicViewer(music)
      viewer.move('chapter', -1, SNAP.BACK)
      expect(viewer.cursor.isEqualTo(new Cursor(false, 1, 23, 1, 0))).toBe(true)
      viewer.move('cell', 1, SNAP.BACK)
      expect(viewer.cursor.isEqualTo(new Cursor(false, 1, 1, 1, 1))).toBe(true)
      viewer.move('row', -1, SNAP.FRONT)
      expect(viewer.cursor.isEqualTo(new Cursor(false, 1, 1, 1, 0))).toBe(true)
    })
  })

  describe('stepCol', () => {
    test('forward', () => {
      const viewer = new MusicViewer(music)
      viewer.move('chapter', 1)
      viewer.stepCol()
      expect(viewer.cursor.isEqualTo(new Cursor(false, 1, 1, 0, 0))).toBe(true)
      viewer.stepCol()
      expect(viewer.cursor.isEqualTo(new Cursor(false, 1, 1, 1, 0))).toBe(true)
      viewer.stepCol()
      expect(viewer.cursor.isEqualTo(new Cursor(false, 1, 1, 1, 1))).toBe(true)
      viewer.stepCol()
      expect(viewer.cursor.isEqualTo(new Cursor(false, 1, 2, 0, 0))).toBe(true)
    })
    test('backward', () => {
      const viewer = new MusicViewer(music)
      viewer.move('cell', 4)
      viewer.stepCol(-1)
      expect(viewer.cursor.isEqualTo(new Cursor(false, 0, 3, 1, 1))).toBe(true)
      viewer.stepCol(-1)
      expect(viewer.cursor.isEqualTo(new Cursor(false, 0, 3, 1, 0))).toBe(true)
      viewer.stepCol(-1)
      expect(viewer.cursor.isEqualTo(new Cursor(false, 0, 3, 0, 0))).toBe(true)
      viewer.stepCol(-1)
      expect(viewer.cursor.isEqualTo(new Cursor(false, 0, 2, 0, 0))).toBe(true)
    })
  })

  describe('stepChapter', () => {
    test('forward', () => {
      const viewer = new MusicViewer(music)
      viewer.move('chapter', 0, SNAP.BACK)
      expect(viewer.stepCol()).toBe(false)
      expect(viewer.stepChapter()).toBe(true)
      expect(viewer.cursor.isEqualTo(new Cursor(false, 1, 0, 0, 0))).toBe(true)
    })
    test('backward', () => {
      const viewer = new MusicViewer(music)
      viewer.move('chapter', 1, SNAP.FRONT)
      expect(viewer.stepCol(-1)).toBe(false)
      expect(viewer.stepChapter(-1)).toBe(true)
      expect(viewer.cursor.isEqualTo(new Cursor(false, 0, 15, 1, 0))).toBe(true)
    })
  })

  describe('colDuration', () => {
    test('with ticksPerCell', () => {
      const viewer = new MusicViewer(music)
      viewer.move('cell', 3)
      expect(viewer.colDuration(1000)).toBeCloseTo(500)
      viewer.stepCol()
      expect(viewer.colDuration(1000)).toBeCloseTo(250)
    })
    test('without ticksPerCell', () => {
      const viewer = new MusicViewer(music)
      viewer.move('chapter', 1)
      expect(viewer.colDuration()).toBeCloseTo(400)
      viewer.stepCol()
      expect(viewer.colDuration()).toBeCloseTo(200)
    })
  })

  describe('moveHome', () => {
    test('from home', () => {
      const viewer = new MusicViewer(music)
      viewer.moveHome()
      expect(viewer.cursor.isEqualTo(new Cursor(false, 0, 0, 0, 0))).toBe(true)
    })
    test('from middle', () => {
      const viewer = new MusicViewer(music)
      viewer.move('cell', 5)
      viewer.moveHome()
      expect(viewer.cursor.isEqualTo(new Cursor(false, 0, 4, 0, 0))).toBe(true)
    })
    test('from end', () => {
      const viewer = new MusicViewer(music)
      viewer.move('cell', 7, SNAP.BACK)
      viewer.moveHome()
      expect(viewer.cursor.isEqualTo(new Cursor(false, 0, 4, 0, 0))).toBe(true)
    })
  })

  describe('moveEnd', () => {
    test('from home', () => {
      const viewer = new MusicViewer(music)
      viewer.moveEnd()
      expect(viewer.cursor.isEqualTo(new Cursor(false, 0, 3, 1, 1))).toBe(true)
    })
    test('from middle', () => {
      const viewer = new MusicViewer(music)
      viewer.move('cell', 5)
      viewer.moveEnd()
      expect(viewer.cursor.isEqualTo(new Cursor(false, 0, 7, 1, 1))).toBe(true)
    })
    test('from end', () => {
      const viewer = new MusicViewer(music)
      viewer.move('cell', 7, SNAP.BACK)
      viewer.moveEnd()
      expect(viewer.cursor.isEqualTo(new Cursor(false, 0, 7, 1, 1))).toBe(true)
    })
  })

  const ALT_YAML = SAMPLE_YAML.replace('hideRhythm: true', 'hideRhythm: false')
  const musicAlt = deserializeMusic(ALT_YAML)

  describe('moveUpDown', () => {
    test('from music start', () => {
      const viewer = new MusicViewer(music)
      viewer.move('chapter', 0)
      viewer.moveUpDown('up')
      expect(viewer.cursor.isEqualTo(new Cursor(false, 0, 0, 0, 0))).toBe(true)
      viewer.move('chapter', 0)
      viewer.moveUpDown('down')
      expect(viewer.cursor.isEqualTo(new Cursor(false, 0, 1, 0, 0))).toBe(true)
    })
    test('from chapter start', () => {
      const viewer = new MusicViewer(music)
      viewer.move('chapter', 1)
      viewer.moveUpDown('up')
      expect(viewer.cursor.isEqualTo(new Cursor(false, 0, 15, 1, 0))).toBe(true)
      viewer.move('chapter', 1)
      viewer.moveUpDown('down')
      expect(viewer.cursor.isEqualTo(new Cursor(false, 1, 1, 0, 0))).toBe(true)
    })
    test('from home', () => {
      const viewer = new MusicViewer(music)
      viewer.move('cell', 4)
      viewer.moveUpDown('up')
      expect(viewer.cursor.isEqualTo(new Cursor(false, 0, 3, 1, 0))).toBe(true)
      viewer.move('cell', 4)
      viewer.moveUpDown('down')
      expect(viewer.cursor.isEqualTo(new Cursor(false, 0, 5, 0, 0))).toBe(true)
    })
    test('from middle', () => {
      const viewer = new MusicViewer(music)
      viewer.move('cell', 5)
      viewer.moveUpDown('up')
      expect(viewer.cursor.isEqualTo(new Cursor(false, 0, 4, 0, 0))).toBe(true)
      viewer.move('cell', 5)
      viewer.moveUpDown('down')
      expect(viewer.cursor.isEqualTo(new Cursor(false, 0, 6, 0, 0))).toBe(true)
    })
    test('from end', () => {
      const viewer = new MusicViewer(music)
      viewer.move('cell', 7, SNAP.BACK)
      viewer.moveUpDown('up')
      expect(viewer.cursor.isEqualTo(new Cursor(false, 0, 7, 0, 0))).toBe(true)
      viewer.move('cell', 7, SNAP.BACK)
      viewer.moveUpDown('down')
      expect(viewer.cursor.isEqualTo(new Cursor(false, 0, 8, 0, 0))).toBe(true)
    })
    test('from chapter end', () => {
      const viewer = new MusicViewer(music)
      viewer.move('chapter', 0, SNAP.BACK)
      viewer.moveUpDown('up')
      expect(viewer.cursor.isEqualTo(new Cursor(false, 0, 15, 0, 0))).toBe(true)
      viewer.move('chapter', 0, SNAP.BACK)
      viewer.moveUpDown('down')
      expect(viewer.cursor.isEqualTo(new Cursor(false, 1, 0, 0, 0))).toBe(true)
    })
    test('from music end', () => {
      const viewer = new MusicViewer(music)
      viewer.move('chapter', 1, SNAP.BACK)
      viewer.moveUpDown('up')
      expect(viewer.cursor.isEqualTo(new Cursor(false, 1, 23, 0, 0))).toBe(true)
      viewer.move('chapter', 1, SNAP.BACK)
      viewer.moveUpDown('down')
      expect(viewer.cursor.isEqualTo(new Cursor(false, 1, 23, 1, 0))).toBe(true)
    })

    test('from rhythm', () => {
      const viewer = new MusicViewer(musicAlt)
      viewer.cursor.moveRhythm(0, 0)
      viewer.moveUpDown('up')
      expect(viewer.cursor.isEqualTo(new Cursor(true, 0, 0, 0, 0))).toBe(true)
      viewer.cursor.moveRhythm(0, 0)
      viewer.moveUpDown('down')
      expect(viewer.cursor.isEqualTo(new Cursor(true, 0, 1, 0, 0))).toBe(true)
      viewer.cursor.moveRhythm(1, 0)
      viewer.moveUpDown('up')
      expect(viewer.cursor.isEqualTo(new Cursor(true, 1, 0, 0, 0))).toBe(true)
      viewer.cursor.moveRhythm(1, 0)
      viewer.moveUpDown('down')
      expect(viewer.cursor.isEqualTo(new Cursor(true, 1, 1, 0, 0))).toBe(true)
    })
    test('(not) to rhythm', () => {
      const viewer = new MusicViewer(musicAlt)
      viewer.move('chapter', 0, SNAP.BACK)
      viewer.moveUpDown('down')
      expect(viewer.cursor.isEqualTo(new Cursor(false, 1, 0, 0, 0))).toBe(true)
      viewer.move('chapter', 1)
      viewer.moveUpDown('up')
      expect(viewer.cursor.isEqualTo(new Cursor(false, 0, 15, 1, 0))).toBe(true)
    })
  })

  describe('moveLeftRight', () => {
    test('from music start', () => {
      const viewer = new MusicViewer(music)
      viewer.move('chapter', 0)
      viewer.moveLeftRight('left')
      expect(viewer.cursor.isEqualTo(new Cursor(false, 0, 4, 0, 0))).toBe(true)
      viewer.move('chapter', 0)
      viewer.moveLeftRight('right')
      expect(viewer.cursor.isEqualTo(new Cursor(true, 0, 0, 0, 0))).toBe(true)
    })
    test('from chapter start', () => {
      const viewer = new MusicViewer(music)
      viewer.move('chapter', 1)
      viewer.moveLeftRight('left')
      expect(viewer.cursor.isEqualTo(new Cursor(false, 1, 4, 0, 0))).toBe(true)
      viewer.move('chapter', 1)
      viewer.moveLeftRight('right')
      expect(viewer.cursor.isEqualTo(new Cursor(false, 0, 12, 0, 0))).toBe(true)
    })
    test('from home', () => {
      const viewer = new MusicViewer(music)
      viewer.move('cell', 4)
      viewer.moveLeftRight('left')
      expect(viewer.cursor.isEqualTo(new Cursor(false, 0, 8, 0, 0))).toBe(true)
      viewer.move('cell', 4)
      viewer.moveLeftRight('right')
      expect(viewer.cursor.isEqualTo(new Cursor(false, 0, 0, 0, 0))).toBe(true)
    })
    test('from middle', () => {
      const viewer = new MusicViewer(music)
      viewer.move('cell', 5)
      viewer.moveLeftRight('left')
      expect(viewer.cursor.isEqualTo(new Cursor(false, 0, 9, 0, 0))).toBe(true)
      viewer.move('cell', 5)
      viewer.moveLeftRight('right')
      expect(viewer.cursor.isEqualTo(new Cursor(false, 0, 1, 0, 0))).toBe(true)
    })
    test('from end', () => {
      const viewer = new MusicViewer(music)
      viewer.move('cell', 7, SNAP.BACK)
      viewer.moveLeftRight('left')
      expect(viewer.cursor.isEqualTo(new Cursor(false, 0, 7, 1, 0))).toBe(true)
      viewer.move('cell', 7, SNAP.BACK)
      viewer.moveLeftRight('right')
      expect(viewer.cursor.isEqualTo(new Cursor(false, 0, 3, 1, 0))).toBe(true)
    })
    test('from chapter end', () => {
      const viewer = new MusicViewer(music)
      viewer.move('chapter', 0, SNAP.BACK)
      viewer.moveLeftRight('left')
      expect(viewer.cursor.isEqualTo(new Cursor(false, 1, 3, 0, 0))).toBe(true)
      viewer.move('chapter', 0, SNAP.BACK)
      viewer.moveLeftRight('right')
      expect(viewer.cursor.isEqualTo(new Cursor(false, 0, 11, 1, 0))).toBe(true)
    })
    test('from music end', () => {
      const viewer = new MusicViewer(music)
      viewer.move('chapter', 1, SNAP.BACK)
      viewer.moveLeftRight('left')
      expect(viewer.cursor.isEqualTo(new Cursor(false, 1, 23, 1, 0))).toBe(true)
      viewer.move('chapter', 1, SNAP.BACK)
      viewer.moveLeftRight('right')
      expect(viewer.cursor.isEqualTo(new Cursor(false, 1, 19, 1, 0))).toBe(true)
    })

    test('from rhythm', () => {
      const viewer = new MusicViewer(musicAlt)
      viewer.cursor.moveRhythm(0, 0)
      viewer.moveLeftRight('left')
      expect(viewer.cursor.isEqualTo(new Cursor(false, 0, 0, 0, 0))).toBe(true)
      viewer.cursor.moveRhythm(0, 0)
      viewer.moveLeftRight('right')
      expect(viewer.cursor.isEqualTo(new Cursor(true, 0, 0, 0, 0))).toBe(true)
      viewer.cursor.moveRhythm(1, 0)
      viewer.moveLeftRight('left')
      expect(viewer.cursor.isEqualTo(new Cursor(false, 1, 0, 0, 0))).toBe(true)
      viewer.cursor.moveRhythm(1, 0)
      viewer.moveLeftRight('right')
      expect(viewer.cursor.isEqualTo(new Cursor(false, 0, 12, 0, 0))).toBe(true)
    })
    test('to rhythm', () => {
      const viewer = new MusicViewer(musicAlt)
      viewer.move('chapter', 0, SNAP.BACK)
      viewer.moveLeftRight('left')
      expect(viewer.cursor.isEqualTo(new Cursor(true, 1, 3, 0, 0))).toBe(true)
      viewer.move('chapter', 1)
      viewer.moveLeftRight('right')
      expect(viewer.cursor.isEqualTo(new Cursor(true, 1, 0, 0, 0))).toBe(true)
    })
  })
})
