class Player {
  constructor(music) {
    MIDI.loadPlugin({
      soundfontUrl: 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/',
      instrument: 'acoustic_grand_piano'
    })
    this.music = music
    this.midi = MIDI.Player
    this.mode = 'stopped'
    this.time = 0
    this.timerID = -1
  }

  load() {
    // TODO: 太 -[ㄴ] | 黃 에서 ㄴ에 커서를 두고 연주하면 먹통이 됨
    const rendered = this.music.convertForPlayer(1)
    const data = convertToEvents(rendered)
    this.midi.replayer = { getData: () => data }
  }

  resume() {
    if (this.mode === 'stopped') {
      this.load()
      this.music.cursor.startPlay()
    }

    this.mode = 'playing'
    this.midi.resume()
    this.time = getNow()
    this.schedule()
  }

  stop() {
    this.midi.stop()
    this.mode = 'stopped'
    this.cancel()
    this.time = 0
    this.music.cursor.stopPlay()
  }

  pause() {
    // TODO: 太 | [-] | 에서 -에서 일시정지하고 재생하면 싱크가 어긋남
    this.cancel()
    this.midi.pause()
    this.time = 0
    this.mode = 'paused'
  }

  schedule() {
    const duration = this.music.get('chapter').colDuration()
    const delay = getNow() - this.time
    this.timerID = setTimeout(
      () => this.music.stepCol()? this.schedule(): this.stop(),
      duration > delay ? duration - delay : 0
    )
    this.time += duration
  }

  cancel() {
    if (this.timerID < 0) return
    clearTimeout(this.timerID)
    this.timerID = -1
  }
}

function makeMidiEvent(subtype, noteNumber, velocity = 127) {
  return { type: 'channel', channel: 0, subtype, noteNumber, velocity }
}

function convertToEvents(notes) {
  const delay = 1
  let midis = []
  let time = 0
  for (let i = 0; i < notes.length; i++) {
    let note = notes[i]
    let event = makeMidiEvent('noteOn', note.note)
    midis.push([{ event }, note.time - time + delay])
    event = makeMidiEvent('noteOff', note.note)
    midis.push([{ event }, note.duration - delay])
    time = note.time + note.duration
  }
  return midis
}

function getNow() {
  if (window.performance && window.performance.now) {
    return window.performance.now()
  } else {
    return Date.now()
  }
}

export default Player
