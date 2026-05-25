import { instrument, InstrumentName, Player } from 'soundfont-player'
import Cursor from './cursor'
import { MainEntry, ModifierEntry } from './symbols'
import { sleep } from './utils'
import { MusicBase, MusicViewer } from './viewer'

const REF_PITCH = 63 // Eb4, 황종

function scaleIdxToPitch(idx: number, scale: number[]) {
  const oct = Math.floor(idx / scale.length)
  idx -= oct * scale.length
  return scale[idx] + 12 * oct + REF_PITCH
}

function approxInScale(yul: number, scale: number[]) {
  // yul & scale both 0~11
  let minIdx = 0
  let minDist = 1000
  for (let oct = -1; oct <= 1; oct++) {
    for (const [i, cur] of scale.entries()) {
      const dist = Math.abs(cur + 12 * oct - yul)
      if (dist < minDist) {
        minIdx = i + oct * scale.length
        minDist = dist
      }
    }
  }
  return minIdx
}

function pitchToScaleIdx(pitch: number, scale: number[]) {
  const relPitch = pitch - REF_PITCH // 0 = Eb4
  const oct = Math.floor(relPitch / 12)
  const yul = relPitch - oct * 12
  let idx = scale.indexOf(yul)
  if (idx === -1) idx = approxInScale(yul, scale)
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
  main: MainEntry
  modifier?: ModifierEntry
}

export type Note = {
  pitch: number
  time: number
  duration: number
}

function renderMain(sori: Sori, scale: number[], lastPitch?: number): Note[] {
  // lastPitch in midi
  let pitches: number[] = []
  if ('pitch' in sori.main) {
    pitches = [sori.main.pitch]
  } else {
    if (lastPitch == null) {
      console.error('처음 등장하는 음의 높낮이를 파악할 수 없습니다.')
      return []
    }
    const mapper = buildScaleTable(scale, lastPitch)
    pitches = sori.main.pitches.map(rel => mapper[rel])
  }
  if (pitches.length === 0) return []

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
    part.map(rel => scaleIdxToPitch(rel - 3 + refIdx, scale))
  ) as [number[], number[], number[]]
  const notes = allotGrace(pitches, note.time, headDuration, graceCap)
  notes[notes.length - 1].duration += note.duration - headDuration
  return notes
}

function allotGrace(
  pitches: [number[], number[], number[]],
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

function renderNote(
  sori: Sori,
  scale: number[],
  lastPitch?: number,
  ticksPerSecond = 1000
): [Note[], number | undefined] {
  const graceCap = ticksPerSecond / 10
  const notes = renderMain(sori, scale, lastPitch)
  if (notes.length === 0) return [notes, lastPitch]
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

export class MusicPlayer extends MusicViewer {
  protected static _ac?: AudioContext
  protected static _players: Partial<Record<InstrumentName | '장구', Player>> =
    {}

  protected melodyPlayer?: Player
  protected rhythmPlayer?: Player
  lastPitch?: number
  playing = false // playing <-> paused or stopped
  finished = false // playing or paused <-> stopped

  static fromMusicViewer(viewer: {
    music: MusicBase
    cursor: Cursor
  }): MusicPlayer {
    return new MusicPlayer(viewer.music, viewer.cursor.clone())
  }

  protected async getPlayer(_instrument: InstrumentName | '장구') {
    if (!(_instrument in MusicPlayer._players)) {
      if (MusicPlayer._ac == null) MusicPlayer._ac = new AudioContext()
      if (_instrument === '장구') {
        const { Janggu } = await import('./janggu')
        MusicPlayer._players[_instrument] = await instrument(
          MusicPlayer._ac,
          Janggu as any,
          { isSoundfontURL: () => true }
        )
      } else {
        MusicPlayer._players[_instrument] = await instrument(
          MusicPlayer._ac,
          _instrument
        )
      }
    }
    return MusicPlayer._players[_instrument]
  }

  getLastPitch(): number | undefined {
    const viewer = this.clone()
    let lastPitch = null
    let distance = 0
    do {
      const main = viewer.get('col').data.main
      if (main != null && 'pitch' in main) {
        lastPitch = main.pitch
        break
      }
      distance++
    } while (viewer.stepCol(-1) || viewer.stepChapter(-1))
    if (lastPitch == null) return undefined
    if (distance === 0) return undefined

    while (viewer.stepCol(+1) || viewer.stepChapter(+1)) {
      distance--
      if (distance === 0) return lastPitch

      const main = viewer.get('col').data.main
      if (main == null) continue
      if ('pitch' in main) break
      if (main.pitches.length === 0) continue

      const scale = viewer.music.data[viewer.cursor.chapter].config.scale
      const offset = main.pitches[main.pitches.length - 1] - 3
      const scaleIdx = pitchToScaleIdx(lastPitch, scale)
      lastPitch = scaleIdxToPitch(scaleIdx + offset, scale)
    }
    throw Error('getLastPitch unstable')
  }

  render(sori: Sori) {
    const scale = this.music.data[this.cursor.chapter].config.scale
    try {
      return renderNote(sori, scale, this.lastPitch)
    } catch (e) {
      this.lastPitch = this.getLastPitch()
      return renderNote(sori, scale, this.lastPitch)
    }
  }

  async load() {
    const [melodyPlayer, rhythmPlayer] = await Promise.all([
      this.getPlayer(this.music.instrument),
      this.getPlayer('장구'),
    ])
    this.melodyPlayer = melodyPlayer
    this.rhythmPlayer = rhythmPlayer
  }

  async play() {
    this.stop()

    if (MusicPlayer._ac == null) return
    // TODO: remove this offset
    const time = MusicPlayer._ac.currentTime + 0.5 // offset for unknown delay

    this.playing = true
    await Promise.all([this.playMelody(time), this.playRhythm(time)])
  }

  async playRhythm(time: number) {
    // calculate offset from cell start
    let msFromCellStart = 0
    const viewer = this.clone()
    viewer.move('row', 0)
    while (!viewer.cursor.isEqualTo(this.cursor))
      msFromCellStart += viewer.colDuration()

    do {
      const config = viewer.get('chapter').config
      const gakLength = config.measure.reduce((a, b) => a + b, 0)
      const msPerCell = 60000 / config.tempo

      do {
        const cell =
          config.rhythm[(viewer.cursor.cell + config.padding) % gakLength]
        const duration = msPerCell / cell.length

        let i = Math.ceil(msFromCellStart / duration)
        time += (i * duration - msFromCellStart) / 1000
        await this.sleepUntil(time)
        if (!this.playing) return

        for (; i < cell.length; i++) {
          if (cell[i]) {
            this.rhythmPlayer?.stop()
            this.rhythmPlayer?.start(cell[i], 0, { gain: 0.5 })
          }

          time += duration / 1000
          await this.sleepUntil(time)
          if (!this.playing) return
        }
        msFromCellStart = 0
      } while (viewer.step('cell'))
    } while (viewer.stepChapter())
  }

  async playMelody(time: number) {
    this.finished = false

    time += 0.15 // offset for rhythm
    await this.sleepUntil(time)

    let notes: Note[]
    let lastPitch: number | undefined = undefined
    do {
      this.lastPitch = lastPitch ?? this.lastPitch
      const cur = this.get('col')
      const duration = this.colDuration()

      if (cur?.data?.main) {
        this.melodyPlayer?.stop()
        if ('pitch' in cur.data.main || cur.data.main.pitches.length > 0) {
          const sori: Sori = {
            time: 0,
            duration,
            main: cur.data.main,
            modifier: cur.data.modifier,
            headDuration: duration,
          }

          ;[notes, lastPitch] = this.render(sori)
          for (const note of notes) {
            this.melodyPlayer?.stop()
            this.melodyPlayer?.start('' + note.pitch)
            time += note.duration / 1000
            await this.sleepUntil(time)
            if (!this.playing) return
          }
          continue
        }
      }
      time += duration / 1000
      await this.sleepUntil(time)
      if (!this.playing) return
    } while (this.stepCol() || this.stepChapter())
    this.stop()
    this.finished = true
  }

  async sleepUntil(time: number) {
    if (MusicPlayer._ac == null) return
    const duration = time - MusicPlayer._ac.currentTime
    await sleep(duration * 1000)
  }

  stop() {
    this.melodyPlayer?.stop()
    this.rhythmPlayer?.stop()
    this.playing = false
  }
}

if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest
  it('scaleIdxToPitch', () => {
    const scale = [0, 2, 5, 7, 9] // 황태중임남
    expect(scaleIdxToPitch(-1, scale)).toBe(60)
    expect(scaleIdxToPitch(0, scale)).toBe(63)
    expect(scaleIdxToPitch(1, scale)).toBe(65)
    expect(scaleIdxToPitch(2, scale)).toBe(68)
    expect(scaleIdxToPitch(3, scale)).toBe(70)
    expect(scaleIdxToPitch(4, scale)).toBe(72)
    expect(scaleIdxToPitch(5, scale)).toBe(75)
    expect(scaleIdxToPitch(6, scale)).toBe(77)
  })
  it('approxInScale', () => {
    const scale = [2, 3, 5, 7, 11]
    expect(approxInScale(0, scale)).toBe(-1)
    expect(approxInScale(1, scale)).toBe(0)
    expect(approxInScale(8, scale)).toBe(3)
    expect(approxInScale(10, scale)).toBe(4)
  })
  it('pitchToScaleIdx', () => {
    const scale = [0, 2, 5, 7, 9] // 황태중임남
    expect(pitchToScaleIdx(60, scale)).toBe(-1)
    expect(pitchToScaleIdx(63, scale)).toBe(0)
    expect(pitchToScaleIdx(65, scale)).toBe(1)
    expect(pitchToScaleIdx(68, scale)).toBe(2)
    expect(pitchToScaleIdx(70, scale)).toBe(3)
    expect(pitchToScaleIdx(72, scale)).toBe(4)
    expect(pitchToScaleIdx(75, scale)).toBe(5)
    expect(pitchToScaleIdx(77, scale)).toBe(6)
  })
}
