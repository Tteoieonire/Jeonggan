export type EditorDocumentHandlers = {
  pointerUp: () => void
  keydown: (event: KeyboardEvent) => void
}

type DocumentEventTarget = {
  addEventListener(type: string, listener: EventListener): void
  removeEventListener(type: string, listener: EventListener): void
}

export function bindEditorDocumentEvents(
  target: DocumentEventTarget,
  handlers: EditorDocumentHandlers
): () => void {
  const pointerUp: EventListener = () => handlers.pointerUp()
  const keydown: EventListener = event =>
    handlers.keydown(event as KeyboardEvent)

  target.addEventListener('pointerup', pointerUp)
  target.addEventListener('pointercancel', pointerUp)
  target.addEventListener('keydown', keydown)

  let active = true
  return () => {
    if (!active) return
    active = false

    target.removeEventListener('pointerup', pointerUp)
    target.removeEventListener('pointercancel', pointerUp)
    target.removeEventListener('keydown', keydown)
  }
}
