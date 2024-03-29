export function wrappedIdx(idx: number, total: number): number
export function wrappedIdx<T extends Array<V>, V>(idx: number, arr: T): number
export function wrappedIdx<T extends Array<V>, V>(
  idx: number,
  ref: number | T
): number {
  const total = typeof ref === 'number' ? ref : ref.length
  idx %= total
  if (idx < 0) idx += total
  return idx
}
export function clamp(idx: number, total: number): number
export function clamp<T extends Array<V>, V>(idx: number, arr: T): number
export function clamp<T extends Array<V>, V>(
  idx: number,
  ref: number | T
): number {
  const total = typeof ref === 'number' ? ref : ref.length
  return Math.max(0, Math.min(idx, total - 1))
}

export function inRange(idx: number, length: number): boolean
export function inRange<T extends Array<V>, V>(idx: number, arr: T): boolean
export function inRange<T extends Array<V>, V>(
  idx: number,
  ref: number | T
): boolean {
  return idx >= 0 && idx < (typeof ref === 'number' ? ref : ref.length)
}

export function sleep(milliseconds: number): Promise<void> {
  if (milliseconds <= 0) return Promise.resolve()
  return new Promise(r => setTimeout(r, milliseconds))
}

let count = 0
export function getID(): number {
  return ++count // always positive
}
export function resetID() {
  count = 0
}

export type WithID<T> = { id: number; data: T }
