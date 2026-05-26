import { describe, expect, it } from 'vitest'
import { MusicPlayer } from './player'
import { convertMusic } from './midi'
import { deserializeMusic } from '../serialization'

const SAMPLE_YAML = `- title: 양청도드리
  instrument: acoustic_grand_piano
- name: 초장
  hideRhythm: false
  measure:
    - 4
  padding: 0
  rhythm: |
    떵
    덕
    덕 덕
    -
  scale: 黃太仲林南
  tempo: 140
  content: |
    汰

    南

    〻

    〻:앞시김새니레표
    - 林

    潢

    〻:앞시김새니레표

    林

    南:앞시김새니레표
    - 林

    南

    仲

    太

    黃
    - 太

    林

    仲

    太
    㑲:앞시김새노니로표

    太
    △
- name: 2장
  hideRhythm: true
  measure:
    - 4
  padding: 0
  rhythm: |
    떵
    덕
    덕 덕
    -
  scale: 黃太仲林南
  tempo: 150
  content: |
    林

    南
    - 뒷시김새노표

    뒷시김새리표

    〻:앞시김새니레표

    林

    南
    - 林

    潢

    〻:앞시김새니레표

    林

    仲

    林

    南:앞시김새니레표
    - 林

    潢

    〻:앞시김새니레표

    林

    南:앞시김새니레표
    - 林

    南

    仲

    太

    黃
    - 太

    林

    仲

    太
    㑲:앞시김새노니로표

    太
    △
`

describe('MusicPlayer', () => {
  const music = deserializeMusic(SAMPLE_YAML)

  describe('getLastPitch', () => {
    it('basic', () => {
      const player = new MusicPlayer(music)
      player.move('cell', 2)
      expect(player.getLastPitch()).toBe(72)
    })
    it('octave thing', () => {
      const player = new MusicPlayer(music)
      player.cursor.move(1, 2, 0, 0)
      expect(player.getLastPitch()).toBe(70)
    })
  })

  describe('duration marks', () => {
    it('plays 덧길이 as 1.5x and 반길이 as 0.5x', () => {
      const player = new MusicPlayer(
        deserializeMusic(`- title: duration marks
  instrument: acoustic_grand_piano
- name: test
  hideRhythm: true
  measure:
    - 2
  padding: 0
  rhythm: |
    -
    -
  scale: 黃太仲林南
  tempo: 60
  content: |
    黃:덧길이표

    太:반길이표
`)
      )

      const notes = convertMusic(player)

      expect(notes).toMatchObject([
        { time: 0, duration: 1500 },
        { time: 1500, duration: 500 },
      ])
    })

    it('plays 반길이 before 덧길이 in reverse order', () => {
      const player = new MusicPlayer(
        deserializeMusic(`- title: duration marks
  instrument: acoustic_grand_piano
- name: test
  hideRhythm: true
  measure:
    - 2
  padding: 0
  rhythm: |
    -
    -
  scale: 黃太仲林南
  tempo: 60
  content: |
    黃:반길이표

    太:덧길이표
`)
      )

      const notes = convertMusic(player)

      expect(notes).toMatchObject([
        { time: 0, duration: 500 },
        { time: 500, duration: 1500 },
      ])
    })

    it('stops ordinary sustain at an empty duration-marked column', () => {
      const player = new MusicPlayer(
        deserializeMusic(`- title: duration marks
  instrument: acoustic_grand_piano
- name: test
  hideRhythm: true
  measure:
    - 3
  padding: 0
  rhythm: |
    -
    -
    -
  scale: 黃太仲林南
  tempo: 60
  content: |
    黃:덧길이표

    -:반길이표

    太
`)
      )

      const notes = convertMusic(player)

      expect(notes).toMatchObject([
        { time: 0, duration: 1500 },
        { time: 2000, duration: 1000 },
      ])
    })
  })
})
