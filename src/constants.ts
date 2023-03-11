import { MainEntry } from './symbols'

const RHYTHM_OBJ = ['떵', '쿵', '덕', '기덕', '더러러러', '더'] as const

const YULLYEO = [
  [
    '\ue0e0', // Private use area, ⿰⿱丿彳黃
    '\ue0e1', // Private use area, ⿰⿱丿彳大
    '\ue0e2', // Private use area, ⿰⿱丿彳太
    '\ue0e3', // Private use area, ⿰⿱丿彳夾
    '\ue0e4', // Private use area, ⿰⿱丿彳姑
    '\ue0e5', // Private use area, ⿰⿱丿彳仲
    '\ue0e6', // Private use area, ⿰⿱丿彳㽔
    '\ue0e7', // Private use area, ⿰⿱丿彳林
    '\ue0e8', // Private use area, ⿰⿱丿彳夷
    '\ue0e9', // Private use area, ⿰⿱丿彳南
    '\ue0ea', // Private use area, ⿰⿱丿彳無
    '\ue0eb', // Private use area, ⿰⿱丿彳應
  ],
  [
    '㣴',
    '㣕',
    '㣖',
    '㣣',
    '㣨',
    '㣡',
    '㣸',
    '㣩',
    '\ud849\udce1', // ⿰彳夷
    '㣮',
    '㣳',
    '㣹',
  ],
  [
    '僙',
    '㐲',
    '㑀',
    '俠',
    '㑬',
    '㑖',
    '\ud841\udc2d', // ⿰亻㽔
    '㑣',
    '侇',
    '㑲', // Middle C = MIDI note number 60 = C4 in scientific pitch notation
    '㒇',
    '㒣',
  ],
  ['黃', '大', '太', '夾', '姑', '仲', '㽔', '林', '夷', '南', '無', '應'],
  ['潢', '汏', '汰', '浹', '㴌', '㳞', '㶋', '淋', '洟', '湳', '潕', '㶐'],
  [
    '㶂',
    '\ud84f\udd18', // ⿰氵汏
    '㳲',
    '㴺',
    '㵈',
    '㴢',
    '㶙',
    '㵉',
    '㴣',
    '㵜',
    '㶃',
    '㶝',
  ],
  [
    '\ue0ec', // Private use area, ⿰氵㶂
    '\ue0ed', // Private use area, ⿰氵⿰氵汏
    '\ue0ee', // Private use area, ⿰氵㳲
    '\ue0ef', // Private use area, ⿰氵㴺
    '\ue0f0', // Private use area, ⿰氵㵈
    '\ue0f1', // Private use area, ⿰氵㴢
    '\ue0f2', // Private use area, ⿰氵㶙
    '\ue0f3', // Private use area, ⿰氵㵉
    '\ue0f4', // Private use area, ⿰氵㴣
    '\ue0f5', // Private use area, ⿰氵㵜
    '\ue0f6', // Private use area, ⿰氵㶃
    '\ue0f7', // Private use area, ⿰氵㶝
  ],
] as const
const OCTAVE = ['삼하배', '하배', '배', '', '청', '중청', '삼중청'] as const
const HANGEUL = [
  '황종',
  '대려',
  '태주',
  '협종',
  '고선',
  '중려',
  '유빈',
  '임종',
  '이칙',
  '남려',
  '무역',
  '응종',
] as const

const YUL_OBJ = OCTAVE.map(function (oct_label, oct_idx) {
  return YULLYEO[oct_idx].map(function (yul_label, yul): MainEntry {
    return {
      text: yul_label,
      label: oct_label + HANGEUL[yul],
      octave: oct_idx - 3,
      yul,
      pitch: oct_idx * 12 + yul + 27, // MIDI note number
    }
  })
})
const REST_OBJ: MainEntry = { text: '△', label: '쉼표', pitches: [] } as const

export { RHYTHM_OBJ, YUL_OBJ, REST_OBJ }
