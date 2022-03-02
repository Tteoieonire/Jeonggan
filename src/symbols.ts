type MainEntry = {
  pitch?: string | number
  text: string
  label?: string
}

type TrillState = { before?: boolean; after?: boolean }
type _Common = {
  query?: string
  pitches: [string, string, string]
  label?: string
  tall?: boolean
  trill?: TrillState
}
type ModifierEntry = _Common & ({ text: string } | { texts: string[] })

const MAIN: Record<string, MainEntry> = {
  '0': { pitch: '0', text: '0' },
  '1': { pitch: '1', text: '1' },
  '2': { pitch: '2', text: '2' },
  '3': { label: '같은 음 반복', pitch: '3', text: '〻' },
  '4': { pitch: '4', text: '4' },
  '5': { pitch: '5', text: '5' },
  '6': { pitch: '6', text: '6' },
  '13': { pitch: '13', text: '13' },
  '21': { pitch: '21', text: '21' },
  '23': { pitch: '23', text: '23' },
  '43': { pitch: '43', text: '43' },
  '45': { pitch: '45', text: '45' },
  '53': { pitch: '53', text: '53' },
  '210': { pitch: '210', text: '210' },
  '212': { pitch: '212', text: '212' },
  '432': { pitch: '432', text: '432' },
  '454': { pitch: '454', text: '454' },
  '543': { pitch: '543', text: '543' },
  '2343': { pitch: '2343', text: '2343' },
  '4323': { pitch: '4323', text: '4323' },
  '45435': { pitch: '45435', text: '45435' },
  '54321': { pitch: '54321', text: '54321' },
}

const MODIFIER: Record<string, ModifierEntry> = {
  '====': {
    pitches: ['', '313', ''],
    tall: true,
    text: '313',
  },
  '==': {
    pitches: ['', '323', ''],
    tall: true,
    text: '323',
    trill: { after: false },
  },
  '==~': {
    pitches: ['', '323', '43'],
    tall: true,
    text: '323~',
    trill: { after: true },
  },
  '=': {
    pitches: ['', '343', ''],
    tall: true,
    text: '343',
    trill: { after: false },
  },
  '=~': {
    pitches: ['', '343', '43'],
    tall: true,
    text: '343~',
    trill: { after: true },
  },
  '===': {
    pitches: ['', '353', ''],
    tall: true,
    text: '353',
  },
  '43': {
    pitches: ['4', '3', ''],
    text: '𝆔43',
    trill: { after: false },
  },
  '43~': {
    pitches: ['434', '3', ''],
    text: '𝆔43~',
    trill: { after: true },
  },
  '53': {
    pitches: ['5', '3', ''],
    text: '𝆔53',
    trill: { after: false },
  },
  '53~': {
    pitches: ['534', '3', ''],
    text: '𝆔53~',
    trill: { after: true },
  },
  '63': {
    pitches: ['6', '3', ''],
    text: '𝆔63',
    trill: { after: false },
  },
  '63~': {
    pitches: ['634', '3', ''],
    text: '𝆔63~',
    trill: { after: true },
  },
  '23': {
    pitches: ['2', '3', ''],
    text: '𝆔23',
    trill: { before: false },
  },
  '~23': {
    pitches: ['232', '3', ''],
    text: '𝆔~23',
    trill: { before: true },
  },
  '13': {
    pitches: ['1', '3', ''],
    text: '𝆔13',
    trill: { before: false },
  },
  '~13': {
    pitches: ['121', '3', ''],
    text: '𝆔~13',
    trill: { before: true },
  },
  '03': {
    pitches: ['0', '3', ''],
    text: '𝆔03',
    trill: { before: false },
  },
  '~03': {
    pitches: ['010', '3', ''],
    text: '𝆔~03',
    trill: { before: true },
  },
  '343': {
    pitches: ['34', '3', ''],
    text: '𝆔343',
  },
  '353': {
    pitches: ['35', '3', ''],
    text: '𝆔353',
  },
  '323': {
    pitches: ['32', '3', ''],
    text: '𝆔323',
  },
  '313': {
    pitches: ['31', '3', ''],
    text: '𝆔313',
  },
  '143': {
    pitches: ['14', '3', ''],
    text: '𝆔143',
  },
  '243': {
    pitches: ['24', '3', ''],
    text: '𝆔243',
    trill: { before: false, after: false },
  },
  '~243': {
    pitches: ['2324', '3', ''],
    text: '𝆔~243',
    trill: { before: true, after: false },
  },
  '243~': {
    pitches: ['2434', '3', ''],
    text: '𝆔243~',
    trill: { before: false, after: true },
  },
  '~243~': {
    pitches: ['232434', '3', ''],
    text: '𝆔~243~',
    trill: { before: true, after: true },
  },
  '3243': {
    pitches: ['324', '3', ''],
    text: '𝆔3243',
    trill: { before: false, after: false },
  },
  '~3243': {
    pitches: ['34324', '3', ''],
    text: '𝆔~3243',
    trill: { before: true, after: false },
  },
  '3243~': {
    pitches: ['32434', '3', ''],
    text: '𝆔3243~',
    trill: { before: false, after: true },
  },
  '~3243~': {
    pitches: ['3432434', '3', ''],
    text: '𝆔~3243~',
    trill: { before: true, after: true },
  },
  '24243': {
    pitches: ['2424', '3', ''],
    text: '𝆔24243',
  },
  '243243': {
    pitches: ['24324', '3', ''],
    text: '𝆔243243',
    trill: { before: false, after: false },
  },
  '~243243': {
    pitches: ['2324324', '3', ''],
    text: '𝆔~243243',
    trill: { before: true, after: false },
  },
  '243243~': {
    pitches: ['2432434', '3', ''],
    text: '𝆔243243~',
    trill: { before: false, after: true },
  },
  '~243243~': {
    pitches: ['232432434', '3', ''],
    text: '𝆔~243243~',
    trill: { before: true, after: true },
  },
  I: {
    pitches: ['2', '3', '2'],
    texts: ['工', 'I'],
    trill: { before: false, after: false },
  },
  '~I': {
    pitches: ['232', '3', '2'],
    texts: ['~工', '~I'],
    trill: { before: true, after: false },
  },
  'I~': {
    pitches: ['2', '3', '232'],
    texts: ['工~', 'I~'],
    trill: { before: false, after: true },
  },
  '~I~': {
    pitches: ['232', '3', '232'],
    texts: ['~工~', '~I~'],
    trill: { before: true, after: true },
  },
  H: {
    pitches: ['4', '3', '4'],
    text: 'H',
  },
}

function readOut(pitch: string): string {
  const table = [
    '제 음의 세 음 아래',
    '제 음의 두 음 아래',
    '제 음의 한 음 아래',
    '제 음',
    '제 음의 한 음 위',
    '제 음의 두 음 위',
    '제 음의 세 음 위',
  ]
  return pitch
    .split('')
    .map(n => table[+n])
    .join(', ')
}

function labelMain(pitch: string): string {
  const digit = pitch.split('').join(', ')
  const readout = readOut(pitch)
  return digit + '. ' + readout
}

function labelModifier(pitches: [string, string, string]): string {
  let result = ''

  const digits = pitches.map(s => s.split('').join(', '))
  if (digits[0]) result += '앞에 ' + digits[0] + ', '
  result += '본음 ' + digits[1]
  if (digits[2]) result += ', 뒤에 ' + digits[2]
  result += '. '

  const readouts = pitches.map(readOut)
  if (readouts[0]) result += '앞시김새로 ' + readouts[0] + '. '
  result += '본음으로 ' + readouts[1] + '. '
  if (readouts[2]) result += '뒷시김새로 ' + readouts[2] + '. '

  return result
}

function trimTrill(query: string): string {
  if (query[0] === '~') query = query.slice(1)
  if (query[query.length - 1] === '~') query = query.slice(0, -1)
  return query
}

function trillBefore(pitch: string): string {
  let head = +pitch[0]
  pitch = head + '' + (head + 1) + '' + pitch
  return pitch
}

function trillAfter(pitch: string): string {
  let tail = +pitch[pitch.length - 1]
  pitch += '' + (tail + 1) + '' + tail
  return pitch
}

function processQuery(
  table: typeof MAIN | typeof MODIFIER,
  query: string,
  mode: 'query' | 'text' = 'query'
) {
  if (mode === 'query') return query

  for (const [key, value] of Object.entries(table)) {
    if ('text' in value && value.text === query) return key
    if ('texts' in value && value.texts.includes(query)) return key
  }
  return query.replace('𝆔', '') // fallback
}

function queryMain(query: string, mode: 'query' | 'text' = 'query'): MainEntry {
  query = processQuery(MAIN, query, mode)

  let reply = MAIN[query]
  if (reply) {
    let label = reply.label
    if (label == null) {
      if (typeof reply.pitch !== 'string') throw Error('queryMain cannot label')
      label = labelMain(reply.pitch)
    }
    return {
      pitch: reply.pitch,
      text: reply.text,
      label,
    }
  }
  return {
    pitch: query,
    text: query,
    label: labelMain(query),
  }
}

function queryModifier(
  query: string,
  mode: 'query' | 'text' = 'query'
): ModifierEntry {
  query = processQuery(MODIFIER, query, mode)

  let reply = MODIFIER[query]
  if (reply) {
    const response: ModifierEntry = {
      query: query,
      pitches: reply.pitches,
      text: 'text' in reply ? reply.text : reply.texts[0],
      label: reply.query || labelModifier(reply.pitches),
      trill: reply.trill,
    }
    return response
  }

  const fallback = trimTrill(query)
  if (query === fallback) {
    let pitches: [string, string, string] = [
      query.slice(0, -1),
      query.slice(-1),
      '',
    ]
    return {
      query: query,
      pitches: pitches,
      text: '𝆔' + query,
      label: labelModifier(pitches),
    }
  }

  reply = querySymbol('modifier', fallback, mode)
  let pitches = reply.pitches
  if (query[0] === '~') {
    if (pitches[0]) pitches[0] = trillBefore(pitches[0])
    else pitches[0] = trillBefore(pitches[1]).slice(0, 2)
  }
  if (query[query.length - 1] === '~') {
    if (pitches[2]) pitches[2] = trillAfter(pitches[2])
    else pitches[2] = trillAfter(pitches[1]).slice(-2)
  }
  return {
    query: query,
    pitches: pitches,
    text: '𝆔' + query,
    label: labelModifier(pitches),
  }
}

type EntryOf = { main: MainEntry; modifier: ModifierEntry }
function querySymbol<K extends keyof EntryOf>(
  where: K,
  query: string,
  mode: 'query' | 'text' = 'query'
): EntryOf[K] {
  return (
    where === 'main' ? queryMain(query, mode) : queryModifier(query, mode)
  ) as any
}

export { querySymbol, MainEntry, ModifierEntry, TrillState, EntryOf }
