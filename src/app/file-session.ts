import { saveAs } from 'file-saver'

import type { Music } from '../domain/editor'
import type { DownloadPayload } from '../io/download'
import { readMusicFile } from '../io/file-open'
import {
  makeMusicMidiDownload,
  makeMusicYamlDownload,
} from '../io/music-export'

export type FileSessionDeps = {
  readMusicFile: (file: Blob) => Promise<Music | undefined>
  makeYamlDownload: (music: Music) => DownloadPayload
  makeMidiDownload: (music: Music) => DownloadPayload
  saveAs: (blob: Blob, filename: string) => void
  waitUntilBusyVisible: () => Promise<void>
}

const DEFAULT_DEPS: FileSessionDeps = {
  readMusicFile,
  makeYamlDownload: makeMusicYamlDownload,
  makeMidiDownload: makeMusicMidiDownload,
  saveAs,
  waitUntilBusyVisible: async () => {},
}

export class FileSession {
  busy = false
  loadingFailed = false
  private readonly deps: FileSessionDeps

  constructor(deps: Partial<FileSessionDeps> = {}) {
    this.deps = { ...DEFAULT_DEPS, ...deps }
  }

  reset(): void {
    this.busy = false
    this.loadingFailed = false
  }

  async open(file: Blob, load: (music: Music) => void): Promise<void> {
    this.busy = true
    this.loadingFailed = false
    await this.deps.waitUntilBusyVisible()

    try {
      const music = await this.deps.readMusicFile(file)
      if (music != null) load(music)
    } catch (error) {
      this.loadingFailed = true
    } finally {
      this.busy = false
    }
  }

  save(music: Music): void {
    this.download(this.deps.makeYamlDownload(music))
  }

  exportMidi(music: Music): void {
    this.download(this.deps.makeMidiDownload(music))
  }

  private download({ blob, filename }: DownloadPayload): void {
    this.deps.saveAs(blob, filename)
  }
}
