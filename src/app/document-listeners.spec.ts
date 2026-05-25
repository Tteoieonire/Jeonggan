import { describe, expect, it } from 'vitest'

import { bindEditorDocumentEvents } from './document-listeners'

describe('document listener helpers', () => {
  it('binds editor document events and returns cleanup', () => {
    const target = new FakeTarget()
    const calls: string[] = []
    const cleanup = bindEditorDocumentEvents(target, {
      pointerUp: () => calls.push('pointerUp'),
      keydown: event => calls.push(`keydown:${event.code}`),
    })

    target.dispatch('pointerup')
    target.dispatch('pointercancel')
    target.dispatch('keydown', { code: 'KeyA' } as KeyboardEvent)

    expect(calls).toEqual(['pointerUp', 'pointerUp', 'keydown:KeyA'])
    expect(target.listenerCount()).toBe(3)

    cleanup()

    expect(target.listenerCount()).toBe(0)
    target.dispatch('pointerup')
    target.dispatch('keydown', { code: 'KeyB' } as KeyboardEvent)
    expect(calls).toEqual(['pointerUp', 'pointerUp', 'keydown:KeyA'])
  })

  it('makes cleanup idempotent', () => {
    const target = new FakeTarget()
    const cleanup = bindEditorDocumentEvents(target, {
      pointerUp: () => {},
      keydown: () => {},
    })

    cleanup()
    cleanup()

    expect(target.listenerCount()).toBe(0)
  })
})

class FakeTarget {
  private listeners = new Map<string, Set<EventListener>>()

  addEventListener(type: string, listener: EventListener): void {
    const listeners = this.listeners.get(type) ?? new Set<EventListener>()
    listeners.add(listener)
    this.listeners.set(type, listeners)
  }

  removeEventListener(type: string, listener: EventListener): void {
    this.listeners.get(type)?.delete(listener)
  }

  dispatch(type: string, event: Event = new Event(type)): void {
    this.listeners.get(type)?.forEach(listener => listener(event))
  }

  listenerCount(): number {
    return Array.from(this.listeners.values()).reduce(
      (total, listeners) => total + listeners.size,
      0
    )
  }
}
