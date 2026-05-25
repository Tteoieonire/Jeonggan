import type { EntryOf } from '../domain/symbols'
import type { Entry, ScoreFactory } from '../domain/score'
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
    const col = score.col({
      main: editor.get('col').data?.main,
      [where]: entry,
    } as Entry)
    return editor.write('col', col)
  }
}
