const MAIN = {
  '0': {
    label: '0, 제 음의 세 음 아래',
    pitch: '0',
    text: '0',
  },
  '1': {
    label: '1, 제 음의 두 음 아래',
    pitch: '1',
    text: '1',
  },
  '2': {
    label: '2, 제 음의 한 음 아래',
    pitch: '2',
    text: '2',
  },
  '3': {
    label: '같은 음 반복',
    pitch: '3',
    text: '〻',
  },
  '4': {
    label: '4, 제 음의 한 음 위',
    pitch: '4',
    text: '4',
  },
  '5': {
    label: '5, 제 음의 두 음 위',
    pitch: '5',
    text: '5',
  },
  '6': {
    label: '6, 제 음의 세 음 위',
    pitch: '6',
    text: '6',
  },
  '13': {
    label: '1, 3, 제 음의 두 음 아래, 제 음',
    pitch: '13',
    text: '13',
  },
  '21': {
    label: '2, 1, 제 음의 한 음 아래, 제 음의 두 음 아래',
    pitch: '21',
    text: '21',
  },
  '23': {
    label: '2, 3, 제 음의 한 음 아래, 제 음',
    pitch: '23',
    text: '23',
  },
  '43': {
    label: '4, 3, 제 음의 한 음 위, 제 음',
    pitch: '43',
    text: '43',
  },
  '45': {
    label: '4, 5, 제 음의 한 음 위, 제 음의 두 음 위',
    pitch: '45',
    text: '45',
  },
  '53': {
    label: '5, 3, 제 음의 두 음 위, 제 음',
    pitch: '53',
    text: '53',
  },
  '210': {
    label:
      '2, 1, 0, 제 음의 한 음 아래, 제 음의 두 음 아래, 제 음의 세 음 아래',
    pitch: '210',
    text: '210',
  },
  '212': {
    label:
      '2, 1, 2, 제 음의 한 음 아래, 제 음의 두 음 아래, 제 음의 한 음 아래',
    pitch: '212',
    text: '212',
  },
  '432': {
    label: '4, 3, 2, 제 음의 한 음 위, 제 음, 제 음의 한 음 아래',
    pitch: '432',
    text: '432',
  },
  '454': {
    label: '4, 5, 4, 제 음의 한 음 위, 제 음의 두 음 위, 제 음의 한 음 위',
    pitch: '454',
    text: '454',
  },
  '543': {
    label: '5, 4, 3, 제 음의 두 음 위, 제 음의 한 음 위, 제 음',
    pitch: '543',
    text: '543',
  },
  '2343': {
    label: '2, 3, 4, 3, 제 음의 한 음 아래, 제 음, 제 음의 한 음 위, 제 음',
    pitch: '2343',
    text: '2343',
  },
  '4323': {
    label: '4, 3, 2, 3, 제 음의 한 음 위, 제 음, 제 음의 한 음 아래, 제 음',
    pitch: '4323',
    text: '4323',
  },
  '45435': {
    label:
      '4, 5, 4, 3, 5, 제 음의 한 음 위, 제 음의 두 음 위, 제 음의 한 음 위, 제 음, 제 음의 두 음 위',
    pitch: '45435',
    text: '45435',
  },
  '54321': {
    label:
      '5, 4, 3, 2, 1, 제 음의 두 음 위, 제 음의 한 음 위, 제 음, 제 음의 한 음 아래, 제 음의 두 음 아래',
    pitch: '54321',
    text: '54321',
  },
}

const MODIFIER = {
  '313': {
    label: '3, 1, 3, 균등, 제 음, 제 음의 두 음 아래, 제 음을 균등하게',
    pitch: '313',
    tall: true,
    text: '313',
  },
  '323': {
    label: '3, 2, 3, 균등, 제 음, 제 음의 한 음 아래, 제 음을 균등하게',
    pitch: '323',
    tall: true,
    text: '323',
    trillable: { before: false, after: true },
  },
  '343': {
    label: '3, 4, 3, 균등, 제 음, 제 음의 한 음 위, 제 음을 균등하게',
    pitch: '343',
    tall: true,
    text: '343',
    trillable: { before: false, after: true },
  },
  '353': {
    label: '3, 5, 3, 균등, 제 음, 제 음의 두 음 위, 제 음을 균등하게',
    pitch: '353',
    tall: true,
    text: '353',
  },
  '43': {
    label: '4, 3, 제 음의 한 음 위, 제 음',
    pitch: '43',
    text: '𝆔43',
    trillable: { before: false, after: true },
  },
  '53': {
    label: '5, 3, 제 음의 두 음 위, 제 음',
    pitch: '53',
    text: '𝆔53',
    trillable: { before: false, after: true },
  },
  '63': {
    label: '6, 3, 제 음의 세 음 위, 제 음',
    pitch: '63',
    text: '𝆔63',
    trillable: { before: false, after: true },
  },
  '23': {
    label: '2, 3, 제 음의 한 음 아래, 제 음',
    pitch: '23',
    text: '𝆔23',
    trillable: { before: true, after: false },
  },
  '13': {
    label: '1, 3, 제 음의 두 음 아래, 제 음',
    pitch: '13',
    text: '𝆔13',
    trillable: { before: true, after: false },
  },
  '03': {
    label: '0, 3, 제 음의 세 음 아래, 제 음',
    pitch: '03',
    text: '𝆔03',
    trillable: { before: true, after: false },
  },
  '343': {
    label: '3, 4, 3, 제 음, 제 음의 한 음 위, 제 음',
    pitch: '343',
    text: '𝆔343',
  },
  '353': {
    label: '3, 5, 3, 제 음, 제 음의 두 음 위, 제 음',
    pitch: '353',
    text: '𝆔353',
  },
  '323': {
    label: '3, 2, 3, 제 음, 제 음의 한 음 아래, 제 음',
    pitch: '323',
    text: '𝆔323',
  },
  '313': {
    label: '3, 1, 3, 제 음, 제 음의 두 음 아래, 제 음',
    pitch: '313',
    text: '𝆔313',
  },
  '143': {
    label: '1, 4, 3, 제 음의 두 음 아래, 제 음의 한 음 위, 제 음',
    pitch: '143',
    text: '𝆔143',
  },
  '243': {
    label: '2, 4, 3, 제 음의 한 음 아래, 제 음의 한 음 위, 제 음',
    pitch: '243',
    text: '𝆔243',
    trillable: { before: true, after: true },
  },
  '3243': {
    label: '3, 2, 4, 3, 제 음, 제 음의 한 음 아래, 제 음의 한 음 위, 제 음',
    pitch: '3243',
    text: '𝆔3243',
    trillable: { before: true, after: true },
  },
  '24243': {
    label:
      '2, 4, 2, 4, 3, 제 음의 한 음 아래, 제 음의 한 음 위, 제 음의 한 음 아래, 제 음의 한 음 위, 제 음',
    pitch: '24243',
    text: '𝆔24243',
  },
  '243243': {
    label:
      '2, 4, 3, 2, 4, 3, 제 음의 한 음 아래, 제 음의 한 음 위, 제 음, 제 음의 한 음 아래, 제 음의 한 음 위, 제 음',
    pitch: '243243',
    text: '𝆔243243',
    trillable: { before: true, after: true },
  },
  I: {
    label: '앞뒤 2, 제 음의 앞뒤로 제 음의 한 음 아래',
    pitch: '232',
    text: 'I',
    trillable: { before: true, after: true },
  },
  H: {
    label: '앞뒤 4, 제 음의 앞뒤로 제 음의 한 음 위',
    pitch: '434',
    text: 'H',
  },
}

// TODO: elaborate on this
function makeLabel(pitch) {
  const table = [
    '제 음의 세 음 아래',
    '제 음의 두 음 아래',
    '제 음의 한 음 아래',
    '제 음',
    '제 음의 한 음 위',
    '제 음의 두 음 위',
    '제 음의 세 음 위',
  ]
  pitch = pitch.split('')
  const digit = pitch.join(', ')
  const readout = pitch.map(n => table[n]).join(', ')
  return digit + ', ' + readout
}

function querySymbol(where, query) {
  // 있으면 제공
  const table = where === 'main' ? MAIN : MODIFIER
  const reply = table[query]
  if (reply) return reply

  // 없으면 만듦
  const text = (where === 'modifier' ? '𝆔' : '') + query
  return {
    text: text,
    pitch: query,
    label: makeLabel(query),
  }
}

export { querySymbol }
