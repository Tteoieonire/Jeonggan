export const WORKSPACE_LABEL = '정간보 편집기'

export const WORKSPACE_HELP = [
  '화살표 키로 이동합니다.',
  'Shift와 화살표 키로 선택합니다.',
  'Enter는 정간 추가, Shift+Enter는 행 추가입니다.',
  'Control+Z와 Control+Shift+Z로 실행 취소와 다시 실행을 합니다.',
].join(' ')

export const WORKSPACE_KEYSHORTCUTS = [
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Shift+ArrowUp',
  'Shift+ArrowDown',
  'Shift+ArrowLeft',
  'Shift+ArrowRight',
  'Home',
  'End',
  'Control+Home',
  'Control+End',
  'Enter',
  'Shift+Enter',
  'Shift+Space',
  'Backspace',
  'Delete',
  'Escape',
  'Control+Z',
  'Control+Shift+Z',
  'Control+A',
  'Control+X',
  'Control+C',
  'Control+V',
] as const

export function workspaceKeyShortcuts(): string {
  return WORKSPACE_KEYSHORTCUTS.join(' ')
}
