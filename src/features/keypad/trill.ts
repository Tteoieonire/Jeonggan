import {
  querySymbol,
  type ModifierEntry,
  type TrillState,
} from '../../domain/symbols'

export function formatTrillQuery(query: string, trill: TrillState): string {
  const base = query.replace(/~/g, '')
  return `${trill.before ? '~' : ''}${base}${trill.after ? '~' : ''}`
}

export function applyModifierTrill(
  modifier: ModifierEntry | undefined,
  trill: TrillState
): ModifierEntry | undefined {
  if (modifier?.query == null) return undefined
  return querySymbol('modifier', formatTrillQuery(modifier.query, trill), 'key')
}
