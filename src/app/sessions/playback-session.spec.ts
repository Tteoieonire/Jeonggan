import { describe, expect, it } from 'vitest'

import Cursor from '../../domain/cursor'
import { Music } from '../../domain/editor'
import { Chapter, Config } from '../../domain/viewer'
import { PlaybackSession, type PlaybackPlayer } from './playback-session'

const CONFIG: Config = {
  name: '초장',
  tempo: 60,
  measure: [2],
  rhythm: [['떵'], ['덕']],
  hideRhythm: false,
  scale: [0, 2, 5, 7, 9],
  padding: 0,
}

describe('PlaybackSession', () => {
  it('creates, loads, and starts a player on resume', async () => {
    const player = new FakePlayer()
    const session = new PlaybackSession(() => player)

    await session.play('resume', viewer())

    expect(session.player).toBe(player)
    expect(session.busy).toBe(false)
    expect(player.events).toEqual(['load', 'play'])
  })

  it('reports busy while loading a player', async () => {
    let session: PlaybackSession
    const player = new FakePlayer(() => {
      expect(session.busy).toBe(true)
    })
    session = new PlaybackSession(() => player)

    await session.play('resume', viewer())

    expect(session.busy).toBe(false)
  })

  it('pauses by stopping without clearing the player', async () => {
    const player = new FakePlayer()
    const session = new PlaybackSession(() => player)
    await session.play('resume', viewer())

    await session.play('pause', viewer())

    expect(session.player).toBe(player)
    expect(player.events).toEqual(['load', 'play', 'stop'])
  })

  it('stops by stopping and clearing the player', async () => {
    const player = new FakePlayer()
    const session = new PlaybackSession(() => player)
    await session.play('resume', viewer())

    await session.play('stop', viewer())

    expect(session.player).toBeUndefined()
    expect(player.events).toEqual(['load', 'play', 'stop'])
  })

  it('clears a finished player after playback', async () => {
    const player = new FakePlayer()
    player.finished = true
    const session = new PlaybackSession(() => player)

    await session.play('resume', viewer())

    expect(session.player).toBeUndefined()
  })
})

class FakePlayer implements PlaybackPlayer {
  cursor = new Cursor(false, 0, 0, 0, 0)
  playing = false
  finished = false
  events: string[] = []

  constructor(private readonly onLoad: () => void = () => {}) {}

  async load(): Promise<void> {
    this.events.push('load')
    this.onLoad()
  }

  async play(): Promise<void> {
    this.events.push('play')
    this.playing = true
  }

  stop(): void {
    this.events.push('stop')
    this.playing = false
  }
}

function viewer() {
  const music = new Music('', [new Chapter(CONFIG)])
  return music.getEditor()
}
