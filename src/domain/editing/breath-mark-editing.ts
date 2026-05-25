import type { Row, UndoOp } from '../navigation/viewer'

export type BreathMarkEditHost = {
  get(what: 'row'): Row
}

export function writeBreathMark(
  editor: BreathMarkEditHost,
  breath: boolean
): UndoOp {
  const row = editor.get('row')
  const old = row.breath

  // Row breath marks are trailing, so gak-boundary marks belong to the previous gak.
  if (breath) row.breath = true
  else delete row.breath

  return () => {
    if (old) row.breath = true
    else delete row.breath
  }
}

export function toggleBreathMark(editor: BreathMarkEditHost): UndoOp {
  return writeBreathMark(editor, !editor.get('row').breath)
}
