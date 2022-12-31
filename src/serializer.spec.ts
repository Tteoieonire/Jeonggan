import { deserializeMusic, serializeMusic } from './serializer'

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

describe('Round-trip', () => {
  test('yaml to yaml', () => {
    const reconstructed = serializeMusic(deserializeMusic(SAMPLE_YAML))
    expect(reconstructed.trim()).toBe(SAMPLE_YAML.trim())
  })
})
