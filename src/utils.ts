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

export function clone<T extends Object>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj

  var copy = obj.constructor()
  for (var attr in obj) {
    if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr])
  }

  return copy
}

export function sleep(milliseconds: number) {
  return new Promise(r => setTimeout(r, milliseconds))
}

const objIdMap = new WeakMap<object, number>()
let objectCount = 0
export function getID(object: undefined): undefined
export function getID(object: object): number
export function getID(object?: object): number | undefined {
  if (!object) return undefined
  if (!objIdMap.has(object)) objIdMap.set(object, ++objectCount)
  return objIdMap.get(object)
}
