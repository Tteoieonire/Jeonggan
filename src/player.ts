import { instrument, InstrumentName, Player } from 'soundfont-player'
import Cursor from './cursor'
import { MainEntry, ModifierEntry } from './symbols'
import { sleep } from './utils'
import { MusicBase, MusicViewer } from './viewer'

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
    if (lastPitch == null) {
      console.error('처음 등장하는 음의 높낮이를 파악할 수 없습니다.')
      return []
    }
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
    // TODO: take octave into account!!
    const viewer = this.clone()
    let lastPitch = null
    let distance = 0
    do {
      const pitch = viewer.get('col').data.main?.pitch
      if (typeof pitch === 'number') {
        lastPitch = pitch + 51
        break
      }
      distance++
    } while (viewer.stepCol(-1) || viewer.stepChapter(-1))
    if (lastPitch == null) return undefined
    if (distance === 0) return undefined

    while (viewer.stepCol(+1) || viewer.stepChapter(+1)) {
      distance--
      if (distance === 0) return lastPitch

      const pitch = viewer.get('col').data.main?.pitch
      if (pitch == null) continue
      if (typeof pitch === 'number') break

      const scale = viewer.music.data[viewer.cursor.chapter].config.scale
      const offset = +pitch[pitch.length - 1] - 3
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
    const time = MusicPlayer._ac.currentTime

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
      const cell =
        config.rhythm[(viewer.cursor.cell + config.padding) % gakLength]
      const duration = msPerCell / cell.length

      let i = Math.ceil(msFromCellStart / duration)
      time += (i * duration - msFromCellStart) / 1000
      await this.sleepUntil(time)
      if (!this.playing) {
        this.rhythmPlayer?.stop()
        return
      }

      for (; i < cell.length; i++) {
        if (cell[i]) this.rhythmPlayer?.start(cell[i], 0, { gain: 0.5 })

        time += duration / 1000
        await this.sleepUntil(time)
        if (!this.playing) return
      }
      msFromCellStart = 0
    } while (viewer.step('cell') || viewer.stepChapter())
  }

  async playMelody(time: number) {
    this.finished = false

    let notes: Note[]
    let lastPitch: number | undefined = undefined
    do {
      this.lastPitch = lastPitch ?? this.lastPitch
      const cur = this.get('col')
      const duration = this.colDuration()

      if (cur?.data?.main) {
        this.melodyPlayer?.stop()
        if (cur.data.main.pitch) {
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
