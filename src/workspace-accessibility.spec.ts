import { describe, expect, it } from 'vitest'
import {
  WORKSPACE_HELP,
  WORKSPACE_KEYSHORTCUTS,
  WORKSPACE_LABEL,
  workspaceKeyShortcuts,
} from './workspace-accessibility'

describe('workspace accessibility metadata', () => {
  it('has a stable editor label', () => {
    expect(WORKSPACE_LABEL).toBe('정간보 편집기')
  })

  it('describes the primary keyboard interaction model', () => {
    expect(WORKSPACE_HELP).toContain('화살표 키로 이동')
    expect(WORKSPACE_HELP).toContain('Shift와 화살표 키로 선택')
    expect(WORKSPACE_HELP).toContain('Enter는 정간 추가')
    expect(WORKSPACE_HELP).toContain('Control+Z')
  })

  it('formats aria-keyshortcuts without duplicates', () => {
    const shortcuts = workspaceKeyShortcuts().split(' ')

    expect(shortcuts).toEqual([...WORKSPACE_KEYSHORTCUTS])
    expect(new Set(shortcuts).size).toBe(shortcuts.length)
  })

  it('includes core shortcuts handled by the workspace key handler', () => {
    expect(WORKSPACE_KEYSHORTCUTS).toEqual(
      expect.arrayContaining([
        'ArrowUp',
        'Shift+ArrowDown',
        'Enter',
        'Shift+Enter',
        'Backspace',
        'Delete',
        'Escape',
        'Control+Z',
        'Control+Shift+Z',
        'Control+A',
        'Control+X',
        'Control+C',
        'Control+V',
      ])
    )
  })
})
