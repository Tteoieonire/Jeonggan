class Player {
  constructor(music) {
    MIDI.loadPlugin({
      soundfontUrl: 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/',
      instrument: 'acoustic_grand_piano'
    })
    this.music = music
    this.midi = MIDI.Player
    this.mode = 'stopped'
  }

  load() {
    const data = convertMidi(this.music.render())
    this.midi.replayer = { getData: () => data }
  }

  resume() {
    if (this.mode === 'stopped') this.load()
    this.midi.resume()
    // anim?
    this.music.cursor.startPlay()
    this.mode = 'playing'
  }

  stop() {
    this.midi.stop()
    this.music.cursor.stopPlay()
    this.mode = 'stopped'
  }

  pause() {
    this.midi.pause()
    this.mode = 'paused'
  }
}

function makeMidiEvent(subtype, noteNumber, velocity = 127) {
  return { type: 'channel', channel: 0, subtype, noteNumber, velocity }
}

function convertMidi(notes) {
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

export default Player
