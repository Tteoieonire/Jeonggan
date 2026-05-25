import { MidiData, MidiWriteOption, writeMidi } from 'midi-file'
import {
  makeMidiDownload,
  makeYamlDownload,
  type DownloadPayload,
} from './download'
import type { Music } from '../domain/editor'
import { convertToMidi } from '../domain/midi'
import { serializeMusic } from '../domain/serializer'

export type MidiWriter = (
  data: MidiData,
  opts?: MidiWriteOption
) => Array<number>

export function makeMusicYamlDownload(music: Music): DownloadPayload {
  return makeYamlDownload(music.title, serializeMusic(music))
}

export function makeMusicMidiDownload(
  music: Music,
  write: MidiWriter = writeMidi
): DownloadPayload {
  const compiled = convertToMidi(music.getPlayer())
  const data = Uint8Array.from(write(compiled, { running: true }))
  return makeMidiDownload(music.title, data)
}
