import { describe, expect, it } from 'vitest'
import Cursor from '../domain/cursor'
import { ActionHistory } from './history'

describe('ActionHistory', () => {
  it('restores captured state around undo and redo', () => {
    let value = 0
    const appliedFrom: number[] = []
    const undoneFrom: number[] = []
    const changedAt: number[] = []
    const history = new ActionHistory(
      () => value,
      state => {
        value = state
      },
      () => changedAt.push(value)
    )
    const increment = () => {
      appliedFrom.push(value)
      value += 10
      return () => {
        undoneFrom.push(value)
        value -= 10
      }
    }

    history.do(increment)
    value = 999

    expect(history.undo()).toBe(true)
    expect(value).toBe(0)

    value = 555
    expect(history.redo()).toBe(true)
    expect(value).toBe(10)

    expect(appliedFrom).toEqual([0, 0])
    expect(undoneFrom).toEqual([10])
    expect(changedAt).toEqual([10, 0, 10])
  })

  it('drops the redo branch after a new action', () => {
    let value = 0
    const history = new ActionHistory(
      () => value,
      state => {
        value = state
      }
    )
    const add = (amount: number) => () => {
      value += amount
      return () => {
        value -= amount
      }
    }

    history.do(add(1))
    history.do(add(2))
    history.undo()
    history.do(add(10))

    expect(value).toBe(11)
    expect(history.length).toBe(2)
    expect(history.position).toBe(2)
    expect(history.redoable).toBe(false)
  })

  it('keeps only the configured number of records', () => {
    let value = 0
    const history = new ActionHistory(
      () => value,
      state => {
        value = state
      },
      undefined,
      2
    )
    const increment = () => {
      value += 1
      return () => {
        value -= 1
      }
    }

    history.do(increment)
    history.do(increment)
    history.do(increment)

    expect(value).toBe(3)
    expect(history.length).toBe(2)
    expect(history.position).toBe(2)

    expect(history.undo()).toBe(true)
    expect(history.undo()).toBe(true)
    expect(history.undo()).toBe(false)
    expect(value).toBe(1)
  })

  it('restores cursor and selection anchor around undo and redo', () => {
    type SelectionState = { cursor: Cursor; anchor?: Cursor }

    let cursor = new Cursor(false, 0, 1, 0, 0)
    let anchor: Cursor | undefined = new Cursor(false, 0, 0, 0, 0)
    const beforeCursor = cursor.clone()
    const beforeAnchor = anchor.clone()
    const afterCursor = new Cursor(false, 0, 4, 0, 0)
    const afterAnchor = new Cursor(false, 0, 2, 0, 0)

    const history = new ActionHistory<SelectionState>(
      () => ({
        cursor: cursor.clone(),
        anchor: anchor?.clone(),
      }),
      state => {
        anchor = state.anchor?.clone()
        cursor.moveTo(state.cursor)
      }
    )

    const replaceSelection = () => {
      cursor.moveTo(afterCursor)
      anchor = afterAnchor.clone()
      return () => {
        cursor.moveTo(beforeCursor)
        anchor = beforeAnchor.clone()
      }
    }
    const anchorMatches = (target: Cursor) => anchor?.isEqualTo(target) === true

    history.do(replaceSelection)
    expect(cursor.isEqualTo(afterCursor)).toBe(true)
    expect(anchorMatches(afterAnchor)).toBe(true)

    cursor.move(0, 9, 0, 0)
    anchor = undefined
    expect(history.undo()).toBe(true)
    expect(cursor.isEqualTo(beforeCursor)).toBe(true)
    expect(anchorMatches(beforeAnchor)).toBe(true)

    cursor.move(0, 8, 0, 0)
    anchor = undefined
    expect(history.redo()).toBe(true)
    expect(cursor.isEqualTo(afterCursor)).toBe(true)
    expect(anchorMatches(afterAnchor)).toBe(true)
  })
})
