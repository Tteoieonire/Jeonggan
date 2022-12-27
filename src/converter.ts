import { MidiData, MidiEvent, MidiHeader } from 'midi-file'

import { Config, MusicViewer } from './music'
import { Note, render, Sori } from './renderer'

function chooseTimeSignatureDenominator(numerator: number) {
  if (numerator === 12) return 8
  const log = Math.log2((numerator * 4) / 3) | 0
  return Math.pow(2, log)
}

function chooseKeySignature(scale: number[]) {
  // [D#, E, F, F#, G, G#, A, A#, B, C, C#, D]
  const needAccidentalInKey = {
    '-6': [0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1],
    '-5': [0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1],
    '-4': [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1],
    '-3': [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0],
    '-2': [0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0],
    '-1': [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0],
    '0': [1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0],
    '1': [1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0],
    '2': [1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0],
    '3': [1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0],
    '4': [0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1],
    '5': [0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1],
  }
  let minAccidentals = 12
  let bestKey = 0
  for (const [key, values] of Object.entries(needAccidentalInKey)) {
    let numAccidentals = scale.map(x => values[x]).reduce((a, b) => a + b)
    if (numAccidentals < minAccidentals) {
      bestKey = +key
      minAccidentals = numAccidentals
    } else if (numAccidentals === minAccidentals) {
      if (Math.abs(+key) < Math.abs(bestKey)) bestKey = +key
    }
  }
  return bestKey
}

function convertChapter(
  viewer: MusicViewer,
  time: number,
  lastPitch?: number,
  ticksPerCell?: number
): [Note[], number, number | undefined] {
  const chapter = viewer.music.data[viewer.cursor.chapter]
  const ticksPerSecond =
    ticksPerCell && (ticksPerCell * chapter.config.tempo) / 60

  let soris: Sori[] = []
  let ongoing = false
  do {
    const cur = viewer.get('col')
    const duration = viewer.colDuration(ticksPerCell)

    if (cur?.data?.main) {
      ongoing = !!cur.data.main.pitch // no ongoing if rest
      if (ongoing) {
        const sori: Sori = {
          time,
          duration,
          main: cur.data.main,
          modifier: cur.data.modifier,
          headDuration: duration,
        }
        soris.push(sori)
      }
    } else if (ongoing) {
      soris[soris.length - 1].duration += duration
    }
    time += duration
  } while (viewer.stepCol())

  let notes: Note[]
  ;[notes, lastPitch] = render(
    soris,
    chapter.config.scale,
    lastPitch,
    ticksPerSecond
  )
  return [notes, time, lastPitch]
}

export function convertMusic(viewer: MusicViewer): Note[] {
  let rendered: Note[] = []
  let time = 0
  let lastPitch = viewer.getLastPitch()
  do {
    let notes: Note[]
    ;[notes, time, lastPitch] = convertChapter(viewer, time, lastPitch)
    rendered = rendered.concat(notes)
  } while (viewer.stepChapter())
  return rendered
}

function convertConfigToMidi(config: Config): MidiEvent[] {
  let events = []
  const msPerBeat = 60000 / config.tempo
  let event: MidiEvent = {
    type: 'setTempo',
    microsecondsPerBeat: (1000 * msPerBeat) | 0,
    deltaTime: 0,
  }
  events.push(event)
  event = {
    type: 'timeSignature',
    metronome: config.measure,
    numerator: config.measure,
    denominator: chooseTimeSignatureDenominator(config.measure),
    thirtyseconds: 0,
    deltaTime: 0,
  }
  events.push(event)
  event = {
    type: 'keySignature',
    key: chooseKeySignature(config.scale),
    scale: 0,
    deltaTime: 0,
  }
  events.push(event)
  return events
}

export function convertToMidi(viewer: MusicViewer): MidiData {
  const header: MidiHeader = { format: 2, ticksPerBeat: 96, numTracks: 1 }
  let time = 0
  let timePlayed = 0
  let track: MidiEvent[] = []

  let lastPitch = viewer.getLastPitch()
  do {
    const chapter = viewer.get('chapter')
    if (chapter == null) throw ''
    track.push(...convertConfigToMidi(chapter.config))
    let notes: Note[]
    ;[notes, time, lastPitch] = convertChapter(
      viewer,
      time,
      lastPitch,
      header.ticksPerBeat
    )

    for (const note of notes) {
      track.push({
        type: 'noteOn',
        channel: 0,
        noteNumber: note.pitch,
        velocity: 127,
        deltaTime: (note.time - timePlayed) | 0,
      })
      track.push({
        type: 'noteOff',
        channel: 0,
        noteNumber: note.pitch,
        velocity: 0,
        deltaTime: note.duration | 0,
      })
      timePlayed = note.time + note.duration
    }
  } while (viewer.stepChapter())
  track.push({ type: 'endOfTrack', deltaTime: 0 })

  return { header, tracks: [track] }
}
