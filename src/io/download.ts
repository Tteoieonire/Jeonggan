export type DownloadPayload = {
  blob: Blob
  filename: string
}

const RESERVED_FILENAME_CHARS = /[<>:"/\\|?*\u0000-\u001f]/g

export function makeDownloadFilename(title: string, extension: string): string {
  const safeExtension = extension.replace(/^\.+/, '')
  const safeTitle = title
    .trim()
    .replace(/\s+/g, '-')
    .replace(RESERVED_FILENAME_CHARS, '')
    .replace(/-+/g, '-')
    .replace(/^\.+|\.+$/g, '')

  return `${safeTitle || 'untitled'}.${safeExtension}`
}

export function makeYamlDownload(title: string, data: string): DownloadPayload {
  return {
    blob: new Blob([data], { type: 'text/x-yaml' }),
    filename: makeDownloadFilename(title, 'yaml'),
  }
}

export function makeMidiDownload(
  title: string,
  data: Uint8Array
): DownloadPayload {
  const bytes = new Uint8Array(data.byteLength)
  bytes.set(data)

  return {
    blob: new Blob([bytes.buffer], { type: 'audio/midi' }),
    filename: makeDownloadFilename(title, 'mid'),
  }
}
