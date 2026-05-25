import { deserializeMusic } from './serializer'

export type TextFileReader = {
  addEventListener(
    type: 'load' | 'error',
    listener: (event: ProgressEvent<FileReader>) => void
  ): void
  readAsText(file: Blob): void
}

export type TextFileReaderFactory = () => TextFileReader

export function readTextFile(
  file: Blob,
  createReader: TextFileReaderFactory = () => new FileReader()
): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    const reader = createReader()
    reader.addEventListener('load', e => {
      const result = e.target?.result
      resolve(typeof result === 'string' ? result : undefined)
    })
    reader.addEventListener('error', e => reject(e))
    reader.readAsText(file)
  })
}

export async function readMusicFile(
  file: Blob,
  createReader?: TextFileReaderFactory
) {
  const text = await readTextFile(file, createReader)
  return text == null ? undefined : deserializeMusic(text)
}
