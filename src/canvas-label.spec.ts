import { describe, expect, it } from 'vitest'
import { makeCanvasLabel } from './canvas-label'
import { YUL_OBJ } from './constants'
import Cursor from './cursor'
import { querySymbol } from './symbols'
import type { Col, Config } from './viewer'

const CONFIG: Pick<Config, 'name' | 'padding' | 'rhythm'> = {
  name: '초장',
  padding: 0,
  rhythm: [['떵'], [''], ['덕', '덕'], ['']],
}

describe('makeCanvasLabel', () => {
  it('returns an empty label while playing', () => {
    expect(makeCanvasLabel({ playing: true })).toBe('')
  })

  it('describes a rhythm cursor', () => {
    expect(
      makeCanvasLabel({
        cursor: new Cursor(true, 0, 2, 0, 0),
        config: CONFIG,
        numRows: 1,
        numCols: 1,
        col: emptyCol(),
      })
    ).toBe('덕 덕, 초장 장단 3번째 정간')
  })

  it('describes empty rhythm ticks as blank beats', () => {
    expect(
      makeCanvasLabel({
        cursor: new Cursor(true, 0, 1, 0, 0),
        config: CONFIG,
        numRows: 1,
        numCols: 1,
        col: emptyCol(),
      })
    ).toBe('빈 박, 초장 장단 2번째 정간')
  })

  it('describes an empty notation cursor', () => {
    expect(
      makeCanvasLabel({
        cursor: new Cursor(false, 0, 1, 2, 3),
        config: CONFIG,
        numRows: 4,
        numCols: 5,
        col: emptyCol(),
      })
    ).toBe('빈칸, 초장 1각 2번째 정간, 4행 중 3행, 5열 중 4열')
  })

  it('describes notation entry labels and padding-adjusted gak positions', () => {
    const col: Col = {
      id: 1,
      data: {
        main: YUL_OBJ[3][0],
        modifier: querySymbol('modifier', '43', 'key'),
      },
    }

    expect(
      makeCanvasLabel({
        cursor: new Cursor(false, 0, 4, 0, 1),
        config: { ...CONFIG, padding: 1 },
        numRows: 2,
        numCols: 3,
        col,
      })
    ).toBe(
      '황종 앞에 4, 본음 3. 앞시김새로 제 음의 한 음 위. 본음으로 제 음., ' +
        '초장 2각 2번째 정간, 2행 중 1행, 3열 중 2열'
    )
  })
})

function emptyCol(): Col {
  return { id: 1, data: {} }
}
