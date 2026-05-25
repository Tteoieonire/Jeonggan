import Cursor from '../../domain/navigation/cursor'
import { MusicPlayer } from '../../domain/playback'
import type { MusicBase } from '../../domain/navigation/viewer'

export type PlaybackCommand = 'stop' | 'pause' | 'resume'

export type PlaybackViewer = {
  music: MusicBase
  cursor: Cursor
}

export type PlaybackPlayer = {
  cursor: Cursor
  playing: boolean
  finished: boolean
  load(): Promise<void>
  play(): Promise<void>
  stop(): void
}

export type PlaybackPlayerFactory = (viewer: PlaybackViewer) => PlaybackPlayer

export class PlaybackSession {
  player: PlaybackPlayer | undefined
  busy = false

  constructor(
    private readonly createPlayer: PlaybackPlayerFactory = viewer =>
      MusicPlayer.fromMusicViewer(viewer)
  ) {}

  reset(): void {
    this.player = undefined
    this.busy = false
  }

  async play(command: PlaybackCommand, viewer: PlaybackViewer): Promise<void> {
    if (command === 'stop') {
      this.player?.stop()
      this.player = undefined
    } else if (command === 'pause') {
      this.player?.stop()
    } else if (command === 'resume') {
      this.player = this.player || this.createPlayer(viewer)
      this.busy = true
      await this.player.load()
      this.busy = false
      await this.player.play()
    }

    if (this.player?.finished) this.player = undefined
  }
}
