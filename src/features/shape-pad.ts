export type ShapePadLevel = 'cell' | 'row' | 'col'
export type ShapePadAxisLevel = Exclude<ShapePadLevel, 'cell'>
export type ShapePadDelta = 1 | -1
export type ShapePadChange<T extends ShapePadLevel = ShapePadLevel> = readonly [
  T,
  ShapePadDelta
]

const SHAPE_LABELS: Record<ShapePadLevel, string> = {
  cell: '정간',
  row: '행',
  col: '열',
}

export function shapePadChange<T extends ShapePadLevel>(
  level: T,
  delta: ShapePadDelta
): ShapePadChange<T> {
  return [level, delta]
}

export function shapePadAriaLabel(
  level: ShapePadLevel,
  delta: ShapePadDelta
): string {
  const label = SHAPE_LABELS[level]
  if (delta === 1) return `새 ${label} 추가`
  return level === 'cell' ? `이 ${label} 삭제` : `지금 ${label} 삭제`
}

export function shapePadIconTransform(level: ShapePadLevel): string {
  return level === 'col' ? 'rotate(90)' : ''
}
