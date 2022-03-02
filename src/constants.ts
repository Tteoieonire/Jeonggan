const RHYTHM_OBJ = ['떵', '쿵', '덕', '따닥', '더러러러', '따']

const YULLYEO = [
  ["㣴","㣕","㣖","㣣","㣨","㣡","㣸","㣩","\ud849\udce1","㣮","㣳","㣹"],
  ["僙","㐲","㑀","俠","㑬","㑖","\ud841\udc2d","㑣","侇","㑲","㒇","㒣"],
  ["黃","大","太","夾","姑","仲","蕤","林","夷","南","無","應"],
  ["潢","汏","汰","浹","㴌","㳞","㶋","淋","洟","湳","潕","㶐"],
  ["㶂","\ud84f\udd18","㳲","㴺","㵈","㴢","㶙","㵉","㴣","㵜","㶃","㶝"]
]
const OCTAVE = ['하배', '배', '', '청', '중청']
const HANGEUL = ['황종', '대려', '태주', '협종', '고선', '중려',
  '유빈', '임종', '이칙', '남려', '무역', '응종']

const YUL_OBJ = OCTAVE.map(function (oct_label, oct_idx) {
  return YULLYEO[oct_idx].map(function (yul_label, yul_idx) {
    return {
      text: yul_label,
      label: oct_label + HANGEUL[yul_idx],
      pitch: oct_idx * 12 + yul_idx
    }
  })
})
const REST_OBJ = { text: '△', label: '쉼표', pitch: undefined }

export { RHYTHM_OBJ, YUL_OBJ, REST_OBJ }
