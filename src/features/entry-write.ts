import type { EntryOf } from '../domain/symbols'
import {
  entryWithModifiers,
  getEntryModifiers,
  type ScoreFactory,
} from '../domain/score'
import type { UndoOp } from '../domain/navigation/viewer'
import type { MusicEditor } from '../domain/editing/music-editor'

export type EntryWriteEditor = Pick<
  MusicEditor,
  'get' | 'isSelecting' | 'score' | 'write'
>

export function getEntryWriteUndo<K extends keyof EntryOf>(
  editor: EntryWriteEditor,
  where: K,
  entry: EntryOf[K] | undefined,
  score: ScoreFactory = editor.score
): (() => UndoOp) | undefined {
  if (editor.isSelecting) return undefined

  return () => {
    const current = editor.get('col').data
    const data =
      where === 'modifier'
        ? entryWithModifiers(
            current?.main,
            entry ? [entry as EntryOf['modifier']] : []
          )
        : entryWithModifiers(
            entry as EntryOf['main'] | undefined,
            current.main == null ? getEntryModifiers(current) : []
          )
    const col = score.col(data)
    return editor.write('col', col)
  }
}
