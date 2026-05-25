import { describe, expect, it } from 'vitest'
import { MusicPlayer } from './player'
import { deserializeMusic } from './serializer'

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
})
