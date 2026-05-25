import { describe, expect, it } from 'vitest'
import { readMusicFile, readTextFile, type TextFileReader } from './file-open'

const SAMPLE_YAML = `- title: test
  instrument: acoustic_guitar
- name: test
  hideRhythm: false
  measure:
    - 1
  padding: 0
  rhythm: |
    -
  scale: 黃太姑林南
  tempo: 140
  content: |
    -
`

describe('file open helpers', () => {
  it('reads a text file', async () => {
    const file = new Blob(['ignored'])
    const reader = new FakeFileReader('content')

    await expect(readTextFile(file, () => reader)).resolves.toBe('content')
    expect(reader.file).toBe(file)
  })

  it('returns undefined for non-text file reader results', async () => {
    const result = new ArrayBuffer(0)

    await expect(
      readTextFile(new Blob(), () => new FakeFileReader(result))
    ).resolves.toBe(undefined)
  })

  it('rejects when file reading fails', async () => {
    const error = { type: 'error' } as ProgressEvent<FileReader>

    await expect(
      readTextFile(new Blob(), () => new FakeFileReader('unused', error))
    ).rejects.toBe(error)
  })

  it('deserializes music from a text file', async () => {
    const music = await readMusicFile(
      new Blob(),
      () => new FakeFileReader(SAMPLE_YAML)
    )

    expect(music?.title).toBe('test')
    expect(music?.data).toHaveLength(1)
    expect(music?.data[0].config.name).toBe('test')
  })

  it('returns undefined when a file does not yield text', async () => {
    const music = await readMusicFile(
      new Blob(),
      () => new FakeFileReader(new ArrayBuffer(0))
    )

    expect(music).toBe(undefined)
  })
})

class FakeFileReader implements TextFileReader {
  file?: Blob
  private listeners: Partial<
    Record<'load' | 'error', (event: ProgressEvent<FileReader>) => void>
  > = {}

  constructor(
    private readonly result: string | ArrayBuffer,
    private readonly error?: ProgressEvent<FileReader>
  ) {}

  addEventListener(
    type: 'load' | 'error',
    listener: (event: ProgressEvent<FileReader>) => void
  ): void {
    this.listeners[type] = listener
  }

  readAsText(file: Blob): void {
    this.file = file
    if (this.error != null) {
      this.listeners.error?.(this.error)
      return
    }
    this.listeners.load?.({
      target: { result: this.result },
    } as ProgressEvent<FileReader>)
  }
}
