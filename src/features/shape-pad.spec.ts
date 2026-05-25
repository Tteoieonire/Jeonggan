import { describe, expect, it } from 'vitest'

import {
  shapePadAriaLabel,
  shapePadChange,
  shapePadIconTransform,
} from './shape-pad'

describe('shape pad helpers', () => {
  it('creates shape change payloads', () => {
    expect(shapePadChange('cell', 1)).toEqual(['cell', 1])
    expect(shapePadChange('row', -1)).toEqual(['row', -1])
  })

  it('formats action labels for cell, row, and column buttons', () => {
    expect(shapePadAriaLabel('cell', 1)).toBe('새 정간 추가')
    expect(shapePadAriaLabel('cell', -1)).toBe('이 정간 삭제')
    expect(shapePadAriaLabel('row', 1)).toBe('새 행 추가')
    expect(shapePadAriaLabel('row', -1)).toBe('지금 행 삭제')
    expect(shapePadAriaLabel('col', 1)).toBe('새 열 추가')
    expect(shapePadAriaLabel('col', -1)).toBe('지금 열 삭제')
  })

  it('rotates the icon only for column controls', () => {
    expect(shapePadIconTransform('cell')).toBe('')
    expect(shapePadIconTransform('row')).toBe('')
    expect(shapePadIconTransform('col')).toBe('rotate(90)')
  })
})
