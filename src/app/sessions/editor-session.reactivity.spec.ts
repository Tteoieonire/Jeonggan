import { computed, nextTick, reactive } from 'vue'
import { describe, expect, it } from 'vitest'

import { REST_OBJ, YUL_OBJ } from '../../domain/constants'
import { EditorSession } from './editor-session'

describe('EditorSession Vue reactivity', () => {
  it('reacts to structural data array replacement', async () => {
    const session = reactive(new EditorSession()) as EditorSession

    const cellCount = computed(() => session.editor.get('chapter').data.length)
    const initialCells = cellCount.value
    session.changeShape('cell', +1)
    await nextTick()
    expect(cellCount.value).toBe(initialCells + 1)

    session.undo()
    await nextTick()
    expect(cellCount.value).toBe(initialCells)

    const rowCount = computed(() => session.editor.get('cell').data.length)
    const initialRows = rowCount.value
    session.changeShape('row', +1)
    await nextTick()
    expect(rowCount.value).toBe(initialRows + 1)

    session.undo()
    await nextTick()
    expect(rowCount.value).toBe(initialRows)

    const colCount = computed(() => session.editor.get('row').data.length)
    const initialCols = colCount.value
    session.changeShape('col', +1)
    await nextTick()
    expect(colCount.value).toBe(initialCols + 1)

    session.undo()
    await nextTick()
    expect(colCount.value).toBe(initialCols)
  })

  it('reacts to column data replacement and history restore', async () => {
    const session = reactive(new EditorSession()) as EditorSession
    const currentMain = computed(() => session.editor.get('col').data.main)

    expect(currentMain.value).toEqual(YUL_OBJ[3][0])

    session.write('main', REST_OBJ)
    await nextTick()
    expect(currentMain.value).toEqual(REST_OBJ)

    session.undo()
    await nextTick()
    expect(currentMain.value).toEqual(YUL_OBJ[3][0])

    session.redo()
    await nextTick()
    expect(currentMain.value).toEqual(REST_OBJ)
  })

  it('reacts to rhythm config replacement', async () => {
    const session = reactive(new EditorSession()) as EditorSession
    const rhythmRows = computed(() => session.config.rhythm[0].length)

    session.editor.moveRhythm('cell', 0)
    await nextTick()
    expect(rhythmRows.value).toBe(1)

    session.changeShape('row', +1)
    await nextTick()
    expect(rhythmRows.value).toBe(2)

    session.undo()
    await nextTick()
    expect(rhythmRows.value).toBe(1)
  })
})
