import type { EntryOf } from '../domain/symbols'

type ImeWriter = {
  update(key: string, shiftKey: boolean): EntryOf[keyof EntryOf] | undefined
}

export type ImeWrite =
  | { type: 'none' }
  | { type: 'write'; where: 'main'; entry?: EntryOf['main'] }
  | { type: 'write'; where: 'modifier'; entry?: EntryOf['modifier'] }

export type ImeWriteInput = {
  key: string
  shiftKey: boolean
  isSelecting: boolean
  sigimShow: boolean
}

export function resolveImeWrite(
  ime: ImeWriter,
  input: ImeWriteInput
): ImeWrite {
  if (input.isSelecting) return { type: 'none' }
  if (input.shiftKey && !input.sigimShow) return { type: 'none' }

  const entry = ime.update(input.key, input.shiftKey)
  if (input.shiftKey) {
    return {
      type: 'write',
      where: 'modifier',
      entry: entry as EntryOf['modifier'] | undefined,
    }
  }

  return {
    type: 'write',
    where: 'main',
    entry: entry as EntryOf['main'] | undefined,
  }
}
