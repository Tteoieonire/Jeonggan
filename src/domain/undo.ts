export type UndoOp = () => void

export const idOp: UndoOp = () => {}

export function mergeActions(...actions: (() => UndoOp)[]): () => UndoOp {
  return () => {
    const undos = actions.map(f => f())
    undos.reverse()
    return () => undos.forEach(f => f())
  }
}
