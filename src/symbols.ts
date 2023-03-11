type MainSymbolEntry = {
  pitches: readonly number[] // relative pitch with 3 being the reference pitch
  text: string
  label: string
}
type MainYulEntry = {
  pitch: number // MIDI note number
  octave: number
  yul: number
  text: string
  label: string
}
type MainEntry = MainSymbolEntry | MainYulEntry

type TrillState = { before?: boolean; after?: boolean }
type ModifierEntry = {
  query?: string
  pitches: readonly [readonly number[], readonly number[], readonly number[]]
  text: string
  label: string
  trill?: TrillState
}

const MAIN: Record<string, MainSymbolEntry> = labelMainTable({
  '0': { pitches: [0], text: '\ue060' }, // Private use area
  '1': { pitches: [1], text: '뒷시김새로표' },
  '2': { pitches: [2], text: '뒷시김새노표' },
  '3': { label: '같은 음 반복', pitches: [3], text: '〻' },
  '4': { pitches: [4], text: '뒷시김새니표' },
  '5': { pitches: [5], text: '뒷시김새리표' },
  '6': { pitches: [6], text: '\ue065' }, // Private use area
  '13': { pitches: [1, 3], text: '뒷시김새너느표' },
  '21': { pitches: [2, 1], text: '뒷시김새노라표' },
  '23': { pitches: [2, 3], text: '뒷시김새느나표' },
  '43': { pitches: [4, 3], text: '뒷시김새니나표' },
  '45': { pitches: [4, 5], text: '뒷시김새느니표' },
  '53': { pitches: [5, 3], text: '뒷시김새너나표' },
  '210': { pitches: [2, 1, 0], text: '뒷시김새네로나표' },
  '212': { pitches: [2, 1, 2], text: '뒷시김새노라노표' },
  '234': { pitches: [2, 3, 4], text: '뒷시김새느나니표' },
  '432': { pitches: [4, 3, 2], text: '뒷시김새니로나표' },
  '454': { pitches: [4, 5, 4], text: '뒷시김새느니르표' },
  '543': { pitches: [5, 4, 3], text: '뒷시김새니레나표' },
  '2343': { pitches: [2, 3, 4, 3], text: '뒷시김새느나니나표' },
  '4323': { pitches: [4, 3, 2, 3], text: '뒷시김새니느라니표' },
  '45435': { pitches: [4, 5, 4, 3, 5], text: '뒷시김새느니르나니표' },
  '54321': { pitches: [5, 4, 3, 2, 1], text: '뒷시김새니나네로나표' },
})
// TODO: 니다야표 등

const MODIFIER: Record<string, ModifierEntry> = labelModifierTable({
  '====': {
    pitches: [[], [3, 1, 3], []],
    text: '나노나표',
    trill: { after: false },
  },
  '====~': {
    pitches: [[], [3, 1, 3], [4, 3]],
    text: '나노다야표',
    trill: { after: true },
  },
  '==': {
    pitches: [[], [3, 2, 3], []],
    text: '나느나표',
    trill: { after: false },
  },
  '==~': {
    pitches: [[], [3, 2, 3], [4, 3]],
    text: '나느다야표',
    trill: { after: true },
  },
  '=': {
    pitches: [[], [3, 4, 3], []],
    text: '나니나표',
    trill: { after: false },
  },
  '=~': {
    pitches: [[], [3, 4, 3], [4, 3]],
    text: '나니다야표',
    trill: { after: true },
  },
  '===': {
    pitches: [[], [3, 5, 3], []],
    text: '나리나표',
    trill: { after: false },
  },
  '===~': {
    pitches: [[], [3, 5, 3], [4, 3]],
    text: '나리다야표',
    trill: { after: true },
  },
  '43': {
    pitches: [[4], [3], []],
    text: '앞시김새니레표',
    trill: { after: false },
  },
  '43~': {
    pitches: [[4, 3, 4], [3], []],
    text: '앞시김새니더여표',
    trill: { after: true },
  },
  '53': {
    pitches: [[5], [3], []],
    text: '앞시김새니라표',
    trill: { after: false },
  },
  '53~': {
    pitches: [[5, 3, 4], [3], []],
    text: '앞시김새니다야표',
    trill: { after: true },
  },
  '63': {
    pitches: [[6], [3], []],
    text: '앞시김새니로표',
    trill: { after: false },
  },
  '63~': {
    pitches: [[6, 3, 4], [3], []],
    text: '\ue08d', // Private use area
    trill: { after: true },
  },
  '23': {
    pitches: [[2], [3], []],
    text: '앞시김새노네표',
    trill: { before: false },
  },
  '~23': {
    pitches: [[2, 3, 2], [3], []],
    text: '앞시김새더여네표',
    trill: { before: true },
  },
  '13': {
    pitches: [[1], [3], []],
    text: '앞시김새너녜표',
    trill: { before: false },
  },
  '~13': {
    pitches: [[1, 2, 1], [3], []],
    text: '앞시김새더여녜표',
    trill: { before: true },
  },
  '03': {
    pitches: [[0], [3], []],
    text: '앞시김새느네표',
    trill: { before: false },
  },
  '~03': {
    pitches: [[0, 1, 0], [3], []],
    text: '\ue083', // Private use area
    trill: { before: true },
  },
  '343': {
    pitches: [[3, 4], [3], []],
    text: '앞시김새노니로표',
  },
  '353': {
    pitches: [[3, 5], [3], []],
    text: '앞시김새노리노표',
  },
  '323': {
    pitches: [[3, 2], [3], []],
    text: '앞시김새네로네표',
  },
  '313': {
    pitches: [[3, 1], [3], []],
    text: '앞시김새느네느표',
  },
  '143': {
    pitches: [[1, 4], [3], []],
    text: '앞시김새로니로표',
    trill: { after: false },
  },
  '143~': {
    pitches: [[1, 4, 3, 4], [3], []],
    text: '앞시김새로니더여표',
    trill: { after: true },
  },
  '243': {
    pitches: [[2, 4], [3], []],
    text: '앞시김새나니로표',
    trill: { before: false, after: false },
  },
  '~243': {
    pitches: [[2, 3, 2, 4], [3], []],
    text: '앞시김새다야니로표',
    trill: { before: true, after: false },
  },
  '243~': {
    pitches: [[2, 4, 3, 4], [3], []],
    text: '앞시김새나니더여표',
    trill: { before: false, after: true },
  },
  '~243~': {
    pitches: [[2, 3, 2, 4, 3, 4], [3], []],
    text: '앞시김새다야니더여표',
    trill: { before: true, after: true },
  },
  '3243': {
    pitches: [[3, 2, 4], [3], []],
    text: '앞시김새느로니르표',
    trill: { before: false, after: false },
  },
  '~3243': {
    pitches: [[3, 4, 3, 2, 4], [3], []],
    text: '앞시김새더여로니르표',
    trill: { before: true, after: false },
  },
  '3243~': {
    pitches: [[3, 2, 4, 3, 4], [3], []],
    text: '앞시김새느로니더여표',
    trill: { before: false, after: true },
  },
  '~3243~': {
    pitches: [[3, 4, 3, 2, 4, 3, 4], [3], []],
    text: '앞시김새더여로니더여표',
    trill: { before: true, after: true },
  },
  '24243': {
    pitches: [[2, 4, 2, 4], [3], []],
    text: '앞시김새나니나니르표',
  },
  '243243': {
    pitches: [[2, 4, 3, 2, 4], [3], []],
    text: '앞시김새나니르노니르표',
    trill: { before: false, after: false },
  },
  '~243243': {
    pitches: [[2, 3, 2, 4, 3, 2, 4], [3], []],
    text: '앞시김새다야니르노니르표',
    trill: { before: true, after: false },
  },
  '243243~': {
    pitches: [[2, 4, 3, 2, 4, 3, 4], [3], []],
    text: '앞시김새나니르노니더여표',
    trill: { before: false, after: true },
  },
  '~243243~': {
    pitches: [[2, 3, 2, 4, 3, 2, 4, 3, 4], [3], []],
    text: '앞시김새다야니르노니더여표',
    trill: { before: true, after: true },
  },
  I: {
    pitches: [[2], [3], [2]],
    text: '느니르표',
    trill: { before: false, after: false },
  },
  '~I': {
    pitches: [[2, 3, 2], [3], [2]],
    text: '더여니르표',
    trill: { before: true, after: false },
  },
  'I~': {
    pitches: [[2], [3], [2, 3, 2]],
    text: '느니더여표',
    trill: { before: false, after: true },
  },
  '~I~': {
    pitches: [[2, 3, 2], [3], [2, 3, 2]],
    text: '더여니더여표',
    trill: { before: true, after: true },
  },
  H: {
    pitches: [[4], [3], [4]],
    text: '니루니표',
  },
})

function readOut(pitches: readonly number[]): string {
  const table = [
    '제 음의 세 음 아래',
    '제 음의 두 음 아래',
    '제 음의 한 음 아래',
    '제 음',
    '제 음의 한 음 위',
    '제 음의 두 음 위',
    '제 음의 세 음 위',
  ] as const
  return pitches.map(n => table[n]).join(', ')
}

function labelMain(pitches: readonly number[]): string {
  const digit = pitches.join(', ')
  const readout = readOut(pitches)
  return digit + '. ' + readout + '.'
}
function labelMainTable(
  table: Record<string, Omit<MainSymbolEntry, 'label'> & { label?: string }>
): Record<string, MainSymbolEntry> {
  const result: Record<string, MainSymbolEntry> = {}
  for (const [query, value] of Object.entries(table)) {
    result[query] = { ...value, label: value.label || labelMain(value.pitches) }
  }
  return result
}

function labelModifier(
  pitches: readonly [readonly number[], readonly number[], readonly number[]]
): string {
  let result = ''

  const digits = pitches.map(s => s.join(', '))
  if (digits[0]) result += '앞에 ' + digits[0] + ', '
  result += '본음 ' + digits[1]
  if (digits[2]) result += ', 뒤에 ' + digits[2]
  result += '. '

  const readouts = pitches.map(readOut)
  if (readouts[0]) result += '앞시김새로 ' + readouts[0] + '. '
  result += '본음으로 ' + readouts[1] + '. '
  if (readouts[2]) result += '뒷시김새로 ' + readouts[2] + '. '

  return result.trim()
}
function labelModifierTable(
  table: Record<string, Omit<ModifierEntry, 'label'>>
): Record<string, ModifierEntry> {
  const result: Record<string, ModifierEntry> = {}
  for (const [query, value] of Object.entries(table)) {
    result[query] = { query, ...value, label: labelModifier(value.pitches) }
  }
  return result
}

function doTrillBefore(pitches: number[]): number[] {
  const head = pitches[0]
  return [head, head + 1]
}
function doTrillAfter(pitches: number[]): number[] {
  const tail = pitches[pitches.length - 1]
  return [tail + 1, tail]
}
function parseQuery(query: string): number[] {
  let trillBefore = false
  let trillAfter = false
  if (query.charAt(0) === '~') {
    trillBefore = true
    query = query.slice(1)
  }
  if (query.charAt(query.length - 1) === '~') {
    trillAfter = true
    query = query.slice(0, -1)
  }
  if (query === '' || query.split('').some(c => !'0123456'.includes(c))) {
    throw Error(`Cannot recognize symbol with key "${query}".`)
  }
  const pitches = query.split('').map(Number)
  const before = trillBefore ? doTrillBefore(pitches) : []
  const after = trillAfter ? doTrillAfter(pitches) : []
  return [...before, ...pitches, ...after]
}
function fallback<K extends keyof EntryOf>(where: K, key: string): EntryOf[K] {
  const pitches = parseQuery(key)
  if (where === 'main') {
    return {
      pitches,
      text: key,
      label: labelMain(pitches),
    } as MainSymbolEntry as any
  }

  const _pitches: readonly [
    readonly number[],
    readonly number[],
    readonly number[]
  ] = [pitches.slice(0, -1), pitches.slice(-1), []]
  return {
    pitches: _pitches,
    text: key,
    label: labelModifier(_pitches),
  } as ModifierEntry as any
}

type EntryOf = { main: MainEntry; modifier: ModifierEntry }
function querySymbol<K extends keyof EntryOf>(
  where: K,
  query: string,
  mode: 'key' | 'text' = 'key'
): EntryOf[K] {
  const table = where === 'main' ? MAIN : MODIFIER
  if (mode === 'key')
    return query in table ? (table[query] as any) : fallback(where, query)
  for (const value of Object.values(table))
    if (value.text === query) return value
  throw Error(`Symbol with text "${query}" not found.`)
}

export { querySymbol, MainEntry, ModifierEntry, TrillState, EntryOf }
