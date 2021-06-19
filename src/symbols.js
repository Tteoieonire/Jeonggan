import { clone } from './utils'

const MAIN = {
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

const MODIFIER = {
  '====': {
    pitch: ['', '313', ''],
    tall: true,
    text: '313',
  },
  '==': {
    pitch: ['', '323', ''],
    tall: true,
    text: '323',
    trill: { before: null, after: false },
  },
  '==~': {
    pitch: ['', '323', '43'],
    tall: true,
    text: '323~',
    trill: { before: null, after: true },
  },
  '=': {
    pitch: ['', '343', ''],
    tall: true,
    text: '343',
    trill: { before: null, after: false },
  },
  '=~': {
    pitch: ['', '343', '43'],
    tall: true,
    text: '343~',
    trill: { before: null, after: true },
  },
  '===': {
    pitch: ['', '353', ''],
    tall: true,
    text: '353',
  },
  '43': {
    pitch: ['4', '3', ''],
    text: '𝆔43',
    trill: { before: null, after: false },
  },
  '43~': {
    pitch: ['434', '3', ''],
    text: '𝆔43~',
    trill: { before: null, after: true },
  },
  '53': {
    pitch: ['5', '3', ''],
    text: '𝆔53',
    trill: { before: null, after: false },
  },
  '53~': {
    pitch: ['534', '3', ''],
    text: '𝆔53~',
    trill: { before: null, after: true },
  },
  '63': {
    pitch: ['6', '3', ''],
    text: '𝆔63',
    trill: { before: null, after: false },
  },
  '63~': {
    pitch: ['634', '3', ''],
    text: '𝆔63~',
    trill: { before: null, after: true },
  },
  '23': {
    pitch: ['2', '3', ''],
    text: '𝆔23',
    trill: { before: false, after: null },
  },
  '~23': {
    pitch: ['232', '3', ''],
    text: '𝆔~23',
    trill: { before: true, after: null },
  },
  '13': {
    pitch: ['1', '3', ''],
    text: '𝆔13',
    trill: { before: false, after: null },
  },
  '~13': {
    pitch: ['121', '3', ''],
    text: '𝆔~13',
    trill: { before: true, after: null },
  },
  '03': {
    pitch: ['0', '3', ''],
    text: '𝆔03',
    trill: { before: false, after: null },
  },
  '~03': {
    pitch: ['010', '3', ''],
    text: '𝆔~03',
    trill: { before: true, after: null },
  },
  '343': {
    pitch: ['34', '3', ''],
    text: '𝆔343',
  },
  '353': {
    pitch: ['35', '3', ''],
    text: '𝆔353',
  },
  '323': {
    pitch: ['32', '3', ''],
    text: '𝆔323',
  },
  '313': {
    pitch: ['31', '3', ''],
    text: '𝆔313',
  },
  '143': {
    pitch: ['14', '3', ''],
    text: '𝆔143',
  },
  '243': {
    pitch: ['24', '3', ''],
    text: '𝆔243',
    trill: { before: false, after: false },
  },
  '~243': {
    pitch: ['2324', '3', ''],
    text: '𝆔~243',
    trill: { before: true, after: false },
  },
  '243~': {
    pitch: ['2434', '3', ''],
    text: '𝆔243~',
    trill: { before: false, after: true },
  },
  '~243~': {
    pitch: ['232434', '3', ''],
    text: '𝆔~243~',
    trill: { before: true, after: true },
  },
  '3243': {
    pitch: ['324', '3', ''],
    text: '𝆔3243',
    trill: { before: false, after: false },
  },
  '~3243': {
    pitch: ['34324', '3', ''],
    text: '𝆔~3243',
    trill: { before: true, after: false },
  },
  '3243~': {
    pitch: ['32434', '3', ''],
    text: '𝆔3243~',
    trill: { before: false, after: true },
  },
  '~3243~': {
    pitch: ['3432434', '3', ''],
    text: '𝆔3243~',
    trill: { before: true, after: true },
  },
  '24243': {
    pitch: ['2424', '3', ''],
    text: '𝆔24243',
  },
  '243243': {
    pitch: ['24324', '3', ''],
    text: '𝆔243243',
    trill: { before: false, after: false },
  },
  '~243243': {
    pitch: ['2324324', '3', ''],
    text: '𝆔243243~',
    trill: { before: true, after: false },
  },
  '243243~': {
    pitch: ['2432434', '3', ''],
    text: '𝆔243243~',
    trill: { before: false, after: true },
  },
  '~243243~': {
    pitch: ['232432434', '3', ''],
    text: '𝆔~243243~',
    trill: { before: true, after: true },
  },
  I: {
    pitch: ['2', '3', '2'],
    text: 'I',
    trill: { before: false, after: false },
  },
  '~I': {
    pitch: ['232', '3', '2'],
    text: '~I',
    trill: { before: true, after: false },
  },
  'I~': {
    pitch: ['2', '3', '232'],
    text: 'I~',
    trill: { before: false, after: true },
  },
  '~I~': {
    pitch: ['232', '3', '232'],
    text: '~I~',
    trill: { before: true, after: true },
  },
  H: {
    pitch: ['4', '3', '4'],
    text: 'H',
  },
}

function readOut(pitch) {
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
    .map(n => table[n])
    .join(', ')
}

function labelMain(pitch) {
  const digit = pitch.split('').join(', ')
  const readout = readOut(pitch)
  return digit + '. ' + readout
}

function labelModifier(pitches) {
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

function trimTrill(query) {
  if (query[0] === '~') query = query.slice(1)
  if (query[query.length - 1] === '~') query = query.slice(0, -1)
  return query
}

function trillBefore(pitch) {
  let head = +pitch[0]
  pitch = head + '' + (head + 1) + '' + pitch
  return pitch
}
function trillAfter(pitch) {
  let tail = +pitch[pitch.length - 1]
  pitch += '' + (tail + 1) + '' + tail
  return pitch
}

function processQuery(table, query, mode='query') {
  if (mode === 'query') return query
  // mode === 'text'
  const keys = Object.keys(table)
  for (const key of keys) {
    if (table[key].text === query) return key
  }
  return query.replace('𝆔', '') // fallback
}

function querySymbol(where, query, mode='query') {
  const isMain = where === 'main'
  const table = isMain ? MAIN : MODIFIER
  const labeler = isMain ? labelMain : labelModifier

  query = processQuery(table, query, mode)

  let reply = table[query]
  if (reply) {
    reply.query = query
    if (!reply.label) reply.label = labeler(reply.pitch)
    return reply
  }

  const fallback = trimTrill(query)
  if (query === fallback) {
    reply = {
      text: (isMain ? '' : '𝆔') + query,
      pitch: isMain ? query : [query.slice(0, -1), query.slice(-1), ''],
    }
    reply.query = query
    reply.label = labeler(reply.pitch)
    return reply
  }

  reply = clone(querySymbol(where, fallback))
  if (query[0] === '~') {
    if (reply.pitch[0]) reply.pitch[0] = trillBefore(reply.pitch[0])
    else reply.pitch[0] = trillBefore(reply.pitch[1]).slice(0, 2)
  }
  if (query[query.length - 1] === '~') {
    if (reply.pitch[2]) reply.pitch[2] = trillAfter(reply.pitch[2])
    else reply.pitch[2] = trillAfter(reply.pitch[1]).slice(-2)
  }
  reply.query = query
  reply.label = labeler(reply.pitch)
  return reply
}

export { querySymbol }
