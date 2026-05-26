import { describe, expect, it } from 'vitest'

import { YUL_OBJ } from '../constants'
import Cursor from '../navigation/cursor'
import { Music } from '../music'
import { type Config, getEntryModifiers } from '../navigation/viewer'
import type { ModifierEntry } from '../symbols'
import { querySymbol } from '../symbols'

const CONFIG: Config = {
  name: '초장',
  tempo: 60,
  measure: [1],
  rhythm: [['']],
  hideRhythm: true,
  scale: [0, 2, 5, 7, 9],
  padding: 0,
}

describe('duration mark editing', () => {
  it('applies 덧길이 and 반길이 to an adjacent equal-duration pair', () => {
    const { music, editor } = editorWithCells([
      music =>
        music.score.cell([
          music.score.row([
            music.score.col({ main: YUL_OBJ[3][2] }),
            music.score.col({ main: YUL_OBJ[3][0] }),
          ]),
        ]),
    ])
    editor.createSelection()

    expect(editor.canApplyPairedDurationMark()).toBe(true)
    expect(editor.activePairedDurationMark()).toBeUndefined()

    const undo = editor.applyLongShortDurationMark()
    expect(modifierTexts(music, 0, 0, 0)).toEqual(['덧길이표'])
    expect(modifierTexts(music, 0, 0, 1)).toEqual(['반길이표'])
    expect(editor.activePairedDurationMark()).toBe('long-short')

    undo()
    expect(modifierTexts(music, 0, 0, 0)).toEqual([])
    expect(modifierTexts(music, 0, 0, 1)).toEqual([])
    expect(editor.activePairedDurationMark()).toBeUndefined()
  })

  it('toggles an active duration pair off', () => {
    const { music, editor } = editorWithCells([
      music =>
        music.score.cell([
          music.score.row([
            music.score.col({ main: YUL_OBJ[3][2] }),
            music.score.col({ main: YUL_OBJ[3][0] }),
          ]),
        ]),
    ])
    editor.createSelection()

    editor.applyLongShortDurationMark()
    editor.applyLongShortDurationMark()

    expect(modifierTexts(music, 0, 0, 0)).toEqual([])
    expect(modifierTexts(music, 0, 0, 1)).toEqual([])
    expect(editor.activePairedDurationMark()).toBeUndefined()
  })

  it('applies 반길이 and 덧길이 in the reverse order', () => {
    const { music, editor } = editorWithCells([
      music =>
        music.score.cell([
          music.score.row([
            music.score.col({ main: YUL_OBJ[3][2] }),
            music.score.col({ main: YUL_OBJ[3][0] }),
          ]),
        ]),
    ])
    editor.createSelection()

    editor.applyHalfLongDurationMark()

    expect(modifierTexts(music, 0, 0, 0)).toEqual(['반길이표'])
    expect(modifierTexts(music, 0, 0, 1)).toEqual(['덧길이표'])
    expect(editor.activePairedDurationMark()).toBe('half-long')
  })

  it('applies a duration pair to selected empty columns', () => {
    const { music, editor } = editorWithCells([
      music =>
        music.score.cell([
          music.score.row([music.score.col(), music.score.col()]),
        ]),
    ])
    editor.createSelection()

    expect(editor.canApplyPairedDurationMark()).toBe(true)

    editor.applyLongShortDurationMark()

    expect(modifierTexts(music, 0, 0, 0)).toEqual(['덧길이표'])
    expect(modifierTexts(music, 0, 0, 1)).toEqual(['반길이표'])
    expect(editor.activePairedDurationMark()).toBe('long-short')
  })

  it('preserves non-duration modifiers when applying the pair', () => {
    const sigim = querySymbol('modifier', '43', 'key')
    const { music, editor } = editorWithCells([
      music =>
        music.score.cell([
          music.score.row([
            music.score.col({ main: YUL_OBJ[3][2], modifier: sigim }),
            music.score.col({ main: YUL_OBJ[3][0] }),
          ]),
        ]),
    ])
    editor.createSelection()

    editor.applyLongShortDurationMark()

    expect(modifierTexts(music, 0, 0, 0)).toEqual([
      '앞시김새니레표',
      '덧길이표',
    ])
  })

  it('accepts stacked rows with equal base duration', () => {
    const { editor } = editorWithCells([
      music =>
        music.score.cell([
          music.score.row([music.score.col({ main: YUL_OBJ[3][2] })]),
          music.score.row([music.score.col({ main: YUL_OBJ[3][0] })]),
        ]),
    ])
    editor.createSelection()

    expect(editor.canApplyPairedDurationMark()).toBe(true)
  })

  it('rejects selections that do not resolve to exactly two columns', () => {
    const { editor } = editorWithCells([
      music =>
        music.score.cell([
          music.score.row([
            music.score.col({ main: YUL_OBJ[3][2] }),
            music.score.col({ main: YUL_OBJ[3][0] }),
            music.score.col({ main: YUL_OBJ[3][7] }),
          ]),
        ]),
    ])
    editor.createSelection()

    expect(editor.canApplyPairedDurationMark()).toBe(false)
  })

  it('rejects adjacent columns with different base durations', () => {
    const { editor } = editorWithCells([
      music =>
        music.score.cell([
          music.score.row([music.score.col({ main: YUL_OBJ[3][2] })]),
        ]),
      music =>
        music.score.cell([
          music.score.row([
            music.score.col({ main: YUL_OBJ[3][0] }),
            music.score.col({ main: YUL_OBJ[3][7] }),
          ]),
        ]),
    ])
    editor.anchor = new Cursor(false, 0, 0, 0, 0)
    editor.cursor.move(0, 1, 0, 0)

    expect(editor.canApplyPairedDurationMark()).toBe(false)
  })
})

function editorWithCells(cellFactories: Array<(music: Music) => any>) {
  const music = new Music('duration test')
  music.data.push(
    music.score.chapter(
      CONFIG,
      cellFactories.map(factory => factory(music))
    )
  )
  return { music, editor: music.getEditor() }
}

function modifierTexts(
  music: Music,
  cell: number,
  row: number,
  col: number
): string[] {
  return getEntryModifiers(
    music.data[0].data[cell].data[row].data[col].data
  ).map((modifier: ModifierEntry) => modifier.text)
}
