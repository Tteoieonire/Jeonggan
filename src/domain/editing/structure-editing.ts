import type Cursor from '../navigation/cursor'
import type { ScoreFactory } from '../score'
import {
  CHILD_OF,
  type Config,
  type ElementOf,
  idOp,
  PARENT_OF,
  SNAP,
  type UndoOp,
} from '../navigation/viewer'

type StructureLevel = keyof typeof PARENT_OF
type ElementListHost = {
  get<K extends keyof ElementOf>(what: K): ElementOf[K]
}

export type StructureEditHost = {
  cursor: Cursor
  score: ScoreFactory
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
      obj = editor.score.chapter(config) as any
    } else {
      obj = editor.score.make(what) as any
    }
  }
  const element = obj as ElementOf[T]
  insertElementAt(editor, what, destPos, element)
  const undo = editor.move(what, destPos)
  return () => {
    undo()
    removeElementAt(editor, what, destPos)
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
  const old = removeElementAt(editor, what, idx)
  return () => {
    insertElementAt(editor, what, idx, old)
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
  const old = replaceElementAt(editor, what, idx, obj)
  return () => {
    replaceElementAt(editor, what, idx, old)
  }
}

export function eraseElement(
  editor: StructureEditHost,
  what: keyof typeof PARENT_OF = 'col'
): UndoOp {
  if (what !== 'chapter')
    return writeElement(editor, what, editor.score.make(what))

  const old = replaceElementData(editor.get('chapter'), [editor.score.cell()])
  return () => {
    replaceElementData(editor.get('chapter'), old)
  }
}

export function insertElementAt<T extends StructureLevel>(
  editor: ElementListHost,
  what: T,
  idx: number,
  obj: ElementOf[T]
): void {
  replaceElementList(
    editor,
    what,
    insertAt(getElementList(editor, what), idx, obj)
  )
}

export function removeElementAt<T extends StructureLevel>(
  editor: ElementListHost,
  what: T,
  idx: number
): ElementOf[T] {
  const list = getElementList(editor, what)
  const old = list[idx]
  replaceElementList(editor, what, removeAt(list, idx))
  return old
}

export function replaceElementAt<T extends StructureLevel>(
  editor: ElementListHost,
  what: T,
  idx: number,
  obj: ElementOf[T]
): ElementOf[T] {
  const list = getElementList(editor, what)
  const old = list[idx]
  replaceElementList(editor, what, replaceAt(list, idx, obj))
  return old
}

export function replaceElementRange<T extends StructureLevel>(
  editor: ElementListHost,
  what: T,
  start: number,
  end: number,
  replacements: ElementOf[T][]
): ElementOf[T][] {
  const list = getElementList(editor, what)
  const old = list.slice(start, end)
  replaceElementList(editor, what, [
    ...list.slice(0, start),
    ...replacements,
    ...list.slice(end),
  ])
  return old
}

export function replaceElementData<T extends keyof ElementOf>(
  element: ElementOf[T],
  data: ElementOf[T]['data']
): ElementOf[T]['data'] {
  const old = element.data
  element.data = data
  return old
}

function getElementList<T extends StructureLevel>(
  editor: ElementListHost,
  what: T
): ElementOf[T][] {
  return editor.get(PARENT_OF[what]).data as ElementOf[T][]
}

function replaceElementList<T extends StructureLevel>(
  editor: ElementListHost,
  what: T,
  data: ElementOf[T][]
): void {
  replaceElementData(editor.get(PARENT_OF[what]), data as any)
}

function insertAt<T>(arr: T[], idx: number, item: T): T[] {
  return [...arr.slice(0, idx), item, ...arr.slice(idx)]
}

function removeAt<T>(arr: T[], idx: number): T[] {
  return [...arr.slice(0, idx), ...arr.slice(idx + 1)]
}

function replaceAt<T>(arr: T[], idx: number, item: T): T[] {
  return arr.map((old, i) => (i === idx ? item : old))
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
