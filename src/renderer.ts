import { MainEntry, ModifierEntry } from './symbols'

export function scaleIdxToPitch(idx: number, scale: number[]) {
  const oct = Math.floor(idx / scale.length)
  idx -= oct * scale.length
  return scale[idx] + 3 + 12 * oct
}

function approxInScale(note: number, scale: number[]) {
  // note & scale both 0-11
  let minIdx = 0
  let minDist = 15
  for (let i = -scale.length; i < 2 * scale.length; i++) {
    const dist = Math.abs(scaleIdxToPitch(i, scale) - 3 - note)
    if (dist < minDist) {
      minIdx = i
      minDist = dist
    }
  }
  return minIdx
}

export function pitchToScaleIdx(pitch: number, scale: number[]) {
  const oct = Math.floor((pitch - 3) / 12)
  let idx = scale.indexOf((pitch - 3) % 12)
  if (idx === -1) idx = approxInScale((pitch - 3) % 12, scale)
  return idx + oct * scale.length
}

function buildScaleTable(scale: number[], refNote: number) {
  const refIdx = pitchToScaleIdx(refNote, scale)
  return [-3, -2, -1, 0, 1, 2, 3].map(rel =>
    scaleIdxToPitch(refIdx + rel, scale)
  )
}

export type Sori = {
  time: number
  duration: number
  headDuration: number
  main?: MainEntry
  modifier?: ModifierEntry
}

export type Note = {
  pitch: number
  time: number
  duration: number
}

function renderMain(sori: Sori, scale: number[], lastPitch?: number): Note[] {
  //scale C=0 ~ B=11, lastPitch in midi
  let pitches: number[] = []
  if (typeof sori.main?.pitch === 'number') {
    pitches = [sori.main.pitch + 51]
  } else if (typeof sori.main?.pitch === 'string') {
    if (lastPitch == null)
      throw Error('처음 등장하는 음의 높낮이를 파악할 수 없습니다.')
    const mapper = buildScaleTable(scale, lastPitch)
    pitches = sori.main.pitch.split('').map((rel: string) => mapper[+rel])
  } else throw Error('renderMain pitch neither number nor string')

  let base_duration = sori.headDuration / pitches.length
  let tail_duration = base_duration + (sori.duration - sori.headDuration)
  return pitches.map((pitch, idx: number) => ({
    pitch,
    duration: idx < pitches.length - 1 ? base_duration : tail_duration,
    time: sori.time + idx * base_duration,
  }))
}

function renderModifier(
  note: Note,
  modifier: ModifierEntry,
  headDuration: number,
  scale: number[],
  graceCap: number
) {
  const refIdx = pitchToScaleIdx(note.pitch, scale)
  const pitches = modifier.pitches.map(part =>
    part.split('').map(rel => scaleIdxToPitch(+rel - 3 + refIdx, scale))
  )
  const notes = allotGrace(pitches, note.time, headDuration, graceCap)
  notes[notes.length - 1].duration += note.duration - headDuration
  return notes
}

function allotGrace(
  pitches: number[][],
  time: number,
  duration: number,
  graceCap: number
): Note[] {
  const numGrace = pitches[0].length + pitches[2].length
  const numMain = pitches[1].length

  const squeeze = duration < graceCap * (numGrace + numMain * 2)
  const graceDur = squeeze ? duration / (numGrace + numMain * 2) : graceCap
  const mainDur = (duration - graceDur * numGrace) / numMain

  let results: Note[] = []
  for (let i = 0; i < 3; i++) {
    const duration = i == 1 ? mainDur : graceDur
    for (const pitch of pitches[i]) {
      results.push({ pitch, duration, time })
      time += duration
    }
  }
  return results
}

export function renderNote(
  sori: Sori,
  scale: number[],
  lastPitch?: number,
  ticksPerSecond = 1000
): [Note[], number] {
  const graceCap = ticksPerSecond / 10
  const notes = renderMain(sori, scale, lastPitch)
  lastPitch = notes[notes.length - 1].pitch
  if (!sori.modifier) return [notes, lastPitch]
  if (notes.length === 1) {
    return [
      renderModifier(
        notes[0],
        sori.modifier,
        sori.headDuration,
        scale,
        graceCap
      ),
      lastPitch,
    ]
  }
  throw Error('Dunno how to read modifier on notes group')
}

export function render(
  soris: Sori[],
  scale: number[],
  lastPitch?: number,
  ticksPerSecond = 1000
): [Note[], number | undefined] {
  const result: Note[] = []
  for (const sori of soris) {
    let rendered: Note[]
    ;[rendered, lastPitch] = renderNote(sori, scale, lastPitch, ticksPerSecond)
    result.push(...rendered)
  }
  return [result, lastPitch]
}
