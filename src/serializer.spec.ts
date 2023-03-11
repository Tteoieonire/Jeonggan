import { deserializeMusic, serializeMusic } from './serializer'

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
    - 林

    潢

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

describe('Round-trip', () => {
  it('yaml to yaml', () => {
    const reconstructed = serializeMusic(deserializeMusic(SAMPLE_YAML))
    expect(reconstructed).toBe(SAMPLE_YAML)
  })
  it('short', () => {
    const yaml = `- title: test
  instrument: acoustic_guitar
- name: test
  hideRhythm: false
  measure:
    - 2
  padding: 0
  rhythm: |
    -
    -
  scale: 黃太姑林南
  tempo: 140
  content: |
    汰

    -
`
    const reconstructed = serializeMusic(deserializeMusic(yaml))
    expect(reconstructed).toBe(yaml)
  })
  it('very short', () => {
    const yaml = `- title: test
  instrument: acoustic_guitar
- name: test
  hideRhythm: false
  measure:
    - 1
  padding: 0
  rhythm: |
    -
  scale: 黃太仲林無
  tempo: 140
  content: |
    汰
`
    const reconstructed = serializeMusic(deserializeMusic(yaml))
    expect(reconstructed).toBe(yaml)
  })
})
