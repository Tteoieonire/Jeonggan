import { describe, expect, it } from 'vitest'

import { Music } from '../../domain/editor'
import type { DownloadPayload } from '../../io/download'
import { FileSession, type FileSessionDeps } from './file-session'

describe('FileSession', () => {
  it('opens a music file and reports busy while waiting', async () => {
    const music = new Music('loaded')
    let session: FileSession
    const loaded: Music[] = []
    const deps = makeDeps({
      waitUntilBusyVisible: async () => {
        expect(session.busy).toBe(true)
      },
      readMusicFile: async () => music,
    })
    session = new FileSession(deps)

    await session.open(new Blob(), music => loaded.push(music))

    expect(loaded).toEqual([music])
    expect(session.busy).toBe(false)
    expect(session.loadingFailed).toBe(false)
  })

  it('sets loadingFailed when opening throws', async () => {
    const session = new FileSession(
      makeDeps({
        readMusicFile: async () => {
          throw Error('broken')
        },
      })
    )

    await session.open(new Blob(), () => {})

    expect(session.busy).toBe(false)
    expect(session.loadingFailed).toBe(true)
  })

  it('does not load when the file has no readable music', async () => {
    const loaded: Music[] = []
    const session = new FileSession(
      makeDeps({ readMusicFile: async () => undefined })
    )

    await session.open(new Blob(), music => loaded.push(music))

    expect(loaded).toEqual([])
    expect(session.loadingFailed).toBe(false)
  })

  it('saves yaml and midi downloads', () => {
    const saved: string[] = []
    const session = new FileSession(
      makeDeps({
        saveAs: (_blob, filename) => saved.push(filename),
      })
    )
    const music = new Music('test')

    session.save(music)
    session.exportMidi(music)

    expect(saved).toEqual(['test.yaml', 'test.mid'])
  })

  it('resets file state', async () => {
    const session = new FileSession(
      makeDeps({
        readMusicFile: async () => {
          throw Error('broken')
        },
      })
    )
    await session.open(new Blob(), () => {})

    session.reset()

    expect(session.busy).toBe(false)
    expect(session.loadingFailed).toBe(false)
  })
})

function makeDeps(overrides: Partial<FileSessionDeps> = {}): FileSessionDeps {
  return {
    readMusicFile: async () => undefined,
    makeYamlDownload: music => payload(`${music.title}.yaml`),
    makeMidiDownload: music => payload(`${music.title}.mid`),
    saveAs: () => {},
    waitUntilBusyVisible: async () => {},
    ...overrides,
  }
}

function payload(filename: string): DownloadPayload {
  return { blob: new Blob(), filename }
}
