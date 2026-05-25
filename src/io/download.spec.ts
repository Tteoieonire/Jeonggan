import { describe, expect, it } from 'vitest'
import {
  makeDownloadFilename,
  makeMidiDownload,
  makeYamlDownload,
} from './download'

describe('download helpers', () => {
  describe('makeDownloadFilename', () => {
    it('normalizes whitespace and preserves Korean titles', () => {
      expect(makeDownloadFilename(' 새 곡 ', 'yaml')).toBe('새-곡.yaml')
    })

    it('removes characters that are unsafe in filenames', () => {
      expect(makeDownloadFilename('suite: 1/2*?', '.mid')).toBe('suite-12.mid')
    })

    it('uses a fallback when the title has no usable characters', () => {
      expect(makeDownloadFilename(' /:*? ', 'yaml')).toBe('untitled.yaml')
    })
  })

  it('creates yaml download payloads', async () => {
    const payload = makeYamlDownload('양청도드리', 'content')

    expect(payload.filename).toBe('양청도드리.yaml')
    expect(payload.blob.type).toBe('text/x-yaml')
    expect(await payload.blob.text()).toBe('content')
  })

  it('creates midi download payloads', async () => {
    const payload = makeMidiDownload('타령', Uint8Array.from([1, 2, 3]))

    expect(payload.filename).toBe('타령.mid')
    expect(payload.blob.type).toBe('audio/midi')
    expect([...new Uint8Array(await payload.blob.arrayBuffer())]).toEqual([
      1, 2, 3,
    ])
  })
})
