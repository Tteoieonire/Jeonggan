import type { EntryOf } from '../domain/symbols'
import { getID } from '../domain/utils'
import type { Col, Entry, UndoOp } from '../domain/viewer'
import type { MusicEditor } from '../domain/editor'

export type EntryWriteEditor = Pick<
  MusicEditor,
  'get' | 'isSelecting' | 'write'
>

export function getEntryWriteUndo<K extends keyof EntryOf>(
  editor: EntryWriteEditor,
  where: K,
  entry: EntryOf[K] | undefined,
  nextID: () => number = getID
): (() => UndoOp) | undefined {
  if (editor.isSelecting) return undefined

  return () => {
    const col: Col = {
      id: nextID(),
      data: {
        main: editor.get('col').data?.main,
        [where]: entry,
      } as Entry,
    }
    return editor.write('col', col)
  }
}
