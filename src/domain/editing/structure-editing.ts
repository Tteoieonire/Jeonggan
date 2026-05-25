import type Cursor from '../navigation/cursor'
import {
  Chapter,
  CHILD_OF,
  type Config,
  type ElementOf,
  idOp,
  PARENT_OF,
  SNAP,
  type UndoOp,
  _make,
} from '../navigation/viewer'

export type StructureEditHost = {
  cursor: Cursor
  get<K extends 'music' | 'chapter' | 'cell' | 'row' | 'col'>(
    what: K
  ): ElementOf[K]
  move(what: keyof typeof PARENT_OF, where: number, snap?: SNAP): UndoOp
  addRhythmRow(): UndoOp
  delRhythmRow(): UndoOp
  erase(what?: keyof typeof PARENT_OF): UndoOp
}

export function addElement<T extends keyof typeof PARENT_OF>(
  editor: StructureEditHost,
  what: T,
  obj?: ElementOf[T]
): UndoOp {
  if (editor.cursor.rhythmMode && what === 'row') return editor.addRhythmRow()
  const destPos = editor.cursor[what] + 1
  if (obj == null) {
    if (what === 'chapter') {
      const config = newConfigFrom(editor.get('chapter').config)
      obj = new Chapter(config) as any
    } else {
      obj = _make(what) as any
    }
  }
  editor.get(PARENT_OF[what]).data.splice(destPos, 0, obj as any)
  const undo = editor.move(what, destPos)
  return () => {
    undo()
    editor.get(PARENT_OF[what]).data.splice(destPos, 1)
  }
}

export function delElement(
  editor: StructureEditHost,
  what: keyof typeof PARENT_OF
): UndoOp {
  if (editor.cursor.rhythmMode && what === 'row') return editor.delRhythmRow()
  const arr = editor.get(PARENT_OF[what]).data
  const idx = editor.cursor[what]
  if (arr.length === 1) return editor.erase(what)

  const undo =
    idx === arr.length - 1
      ? editor.move(what, idx - 1, SNAP.BACK)
      : what === 'col'
      ? idOp
      : editor.move(CHILD_OF[what], 0)
  const old = arr.splice(idx, 1)[0]
  return () => {
    editor.get(PARENT_OF[what]).data.splice(idx, 0, old as any)
    undo()
  }
}

export function writeElement<T extends keyof typeof PARENT_OF>(
  editor: StructureEditHost,
  what: T,
  obj: ElementOf[T]
): UndoOp {
  const arr = editor.get(PARENT_OF[what]).data
  const idx = editor.cursor[what]
  const old = arr.splice(idx, 1, obj as any)[0]
  return () => {
    editor.get(PARENT_OF[what]).data.splice(idx, 1, old as any)
  }
}

export function eraseElement(
  editor: StructureEditHost,
  what: keyof typeof PARENT_OF = 'col'
): UndoOp {
  if (what !== 'chapter') return writeElement(editor, what, _make(what))

  const cells = editor.get('chapter').data
  const old = cells.splice(0, cells.length, _make('cell'))
  return () => {
    editor.get('chapter').data.splice(0, 1, ...old)
  }
}

function newConfigFrom(config: Config): Config {
  return {
    ...config,
    name: '새 장',
    rhythm: JSON.parse(JSON.stringify(config.rhythm)),
    hideRhythm: true,
    padding: 0,
  }
}
