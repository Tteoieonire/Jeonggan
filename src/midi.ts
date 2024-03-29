import { MidiData, MidiEvent, MidiHeader } from 'midi-file'

import { MusicPlayer, Note, render, Sori } from './player'
import { Config } from './viewer'

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
  player: MusicPlayer,
  time: number,
  lastPitch?: number,
  ticksPerCell?: number
): [Note[], number, number | undefined] {
  const chapter = player.music.data[player.cursor.chapter]
  const ticksPerSecond =
    ticksPerCell && (ticksPerCell * chapter.config.tempo) / 60

  let soris: Sori[] = []
  let ongoing = false
  do {
    const cur = player.get('col')
    const duration = player.colDuration(ticksPerCell)

    if (cur?.data?.main) {
      // not ongoing when encountered a rest
      ongoing = !('pitches' in cur.data.main && !cur.data.main.pitches.length)
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
  } while (player.stepCol())

  let notes: Note[]
  ;[notes, lastPitch] = render(
    soris,
    chapter.config.scale,
    lastPitch,
    ticksPerSecond
  )
  return [notes, time, lastPitch]
}

export function convertMusic(player: MusicPlayer): Note[] {
  let rendered: Note[] = []
  let time = 0
  let lastPitch = player.getLastPitch()
  do {
    let notes: Note[]
    ;[notes, time, lastPitch] = convertChapter(player, time, lastPitch)
    rendered = rendered.concat(notes)
  } while (player.stepChapter())
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
    metronome: config.rhythm.length,
    numerator: config.rhythm.length,
    denominator: chooseTimeSignatureDenominator(config.rhythm.length),
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

export function convertToMidi(player: MusicPlayer): MidiData {
  const header: MidiHeader = { format: 2, ticksPerBeat: 96, numTracks: 1 }
  let time = 0
  let timePlayed = 0
  let track: MidiEvent[] = []

  let lastPitch = player.getLastPitch()
  do {
    const chapter = player.get('chapter')
    track.push(...convertConfigToMidi(chapter.config))
    let notes: Note[]
    ;[notes, time, lastPitch] = convertChapter(
      player,
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
  } while (player.stepChapter())
  track.push({ type: 'endOfTrack', deltaTime: 0 })

  return { header, tracks: [track] }
}
