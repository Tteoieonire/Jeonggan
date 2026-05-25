import { describe, expect, it } from 'vitest'
import type { MidiData, MidiWriteOption } from 'midi-file'
import {
  makeMusicMidiDownload,
  makeMusicYamlDownload,
  type MidiWriter,
} from './music-export'
import { deserializeMusic } from '../domain/serialization'

const SAMPLE_YAML = `- title: test song
  instrument: acoustic_guitar
- name: test
  hideRhythm: false
  measure:
    - 1
  padding: 0
  rhythm: |
    -
  scale: 黃太姑林南
  tempo: 140
  content: |
    黃
`

describe('music export helpers', () => {
  it('creates a YAML download payload from music', async () => {
    const music = deserializeMusic(SAMPLE_YAML)
    const payload = makeMusicYamlDownload(music)

    expect(payload.filename).toBe('test-song.yaml')
    expect(payload.blob.type).toBe('text/x-yaml')
    expect(await payload.blob.text()).toBe(SAMPLE_YAML)
  })

  it('creates a MIDI download payload from music', async () => {
    const music = deserializeMusic(SAMPLE_YAML)
    let captured:
      | { data: MidiData; opts: MidiWriteOption | undefined }
      | undefined
    const write: MidiWriter = (data, opts) => {
      captured = { data, opts }
      return [1, 2, 3]
    }

    const payload = makeMusicMidiDownload(music, write)

    expect(payload.filename).toBe('test-song.mid')
    expect(payload.blob.type).toBe('audio/midi')
    expect([...new Uint8Array(await payload.blob.arrayBuffer())]).toEqual([
      1, 2, 3,
    ])
    expect(captured?.opts).toEqual({ running: true })
    expect(captured?.data.header).toMatchObject({ format: 2, ticksPerBeat: 96 })
    expect(captured?.data.tracks[0].at(-1)).toMatchObject({
      type: 'endOfTrack',
    })
  })
})
