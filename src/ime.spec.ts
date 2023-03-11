import { IME } from './ime'

describe('IME', () => {
  describe('compile', () => {
    it('can compile digits', () => {
      const ime = new IME()
      ime.update('3', true)
      ime.update('1', true)
      ime.update('3', true)
      expect(ime.compile()).toMatchObject({
        pitches: [[3, 1], [3], []],
        text: '앞시김새느네느표',
      })

      ime.update('5', false)
      ime.update('3', false)
      expect(ime.compile()).toMatchObject({
        pitches: [5, 3],
        text: '뒷시김새너나표',
      })
    })

    it('can compile equals', () => {
      const ime = new IME()
      ime.update('Equal', true)
      expect(ime.compile()).toMatchObject({
        pitches: [[], [3, 4, 3], []],
        text: '나니나표',
        trill: { after: false },
      })
      ime.update('Equal', true)
      expect(ime.compile()).toMatchObject({
        pitches: [[], [3, 2, 3], []],
        text: '나느나표',
        trill: { after: false },
      })
      ime.update('Equal', true)
      expect(ime.compile()).toMatchObject({
        pitches: [[], [3, 5, 3], []],
        text: '나리나표',
        trill: { after: false },
      })
      ime.update('Equal', true)
      expect(ime.compile()).toMatchObject({
        pitches: [[], [3, 1, 3], []],
        text: '나노나표',
        trill: { after: false },
      })
    })

    it('can compile specials', () => {
      const ime = new IME()
      ime.update('KeyI', true)
      expect(ime.compile()).toMatchObject({
        pitches: [[2], [3], [2]],
        text: '느니르표',
        trill: { before: false, after: false },
      })
      ime.update('Backquote', true)
      expect(ime.compile()).toMatchObject({
        pitches: [[2], [3], [2, 3, 2]],
        text: '느니더여표',
        trill: { before: false, after: true },
      })
      ime.update('KeyH', true)
      expect(ime.compile()).toMatchObject({
        pitches: [[4], [3], [4]],
        text: '니루니표',
      })
    })

    it('can compile trills', () => {
      const ime = new IME()
      ime.update('Backquote', true)
      ime.update('2', true)
      ime.update('4', true)
      ime.update('3', true)
      expect(ime.compile()).toMatchObject({
        pitches: [[2, 3, 2, 4], [3], []],
        text: '앞시김새다야니로표',
        trill: { before: true, after: false },
      })
      ime.update('2', true)
      ime.update('4', true)
      ime.update('3', true)
      expect(ime.compile()).toMatchObject({
        pitches: [[2, 3, 2, 4, 3, 2, 4], [3], []],
        text: '앞시김새다야니르노니르표',
        trill: { before: true, after: false },
      })
      ime.update('Backquote', true)
      expect(ime.compile()).toMatchObject({
        pitches: [[2, 3, 2, 4, 3, 2, 4, 3, 4], [3], []],
        text: '앞시김새다야니르노니더여표',
        trill: { before: true, after: true },
      })
    })
  })

  describe('backspace', () => {
    it('can delete digits', () => {
      const ime = new IME()
      expect(ime.update('2', false)).toMatchObject({
        pitches: [2],
        text: '뒷시김새노표',
      })
      expect(ime.update('1', false)).toMatchObject({
        pitches: [2, 1],
        text: '뒷시김새노라표',
      })
      expect(ime.update('0', false)).toMatchObject({
        pitches: [2, 1, 0],
        text: '뒷시김새네로나표',
      })
      expect(ime.backspace()).toMatchObject({
        pitches: [2, 1],
        text: '뒷시김새노라표',
      })
      expect(ime.backspace()).toMatchObject({
        pitches: [2],
        text: '뒷시김새노표',
      })
      expect(ime.backspace()).toBe(undefined)

      ime.update('2', true)
      ime.update('4', true)
      ime.update('3', true)
      ime.update('2', true)
      ime.update('4', true)
      ime.update('3', true)
      expect(ime.update('Backquote', true)).toMatchObject({
        pitches: [[2, 4, 3, 2, 4, 3, 4], [3], []],
        text: '앞시김새나니르노니더여표',
        trill: { before: false, after: true },
      })
      expect(ime.backspace()).toMatchObject({
        pitches: [[2, 4, 3, 2, 4], [3], []],
        text: '앞시김새나니르노니르표',
        trill: { before: false, after: false },
      })
      ime.backspace()
      ime.backspace()
      ime.backspace()
      expect(ime.update('Backquote', true)).toMatchObject({
        pitches: [[2, 4, 3, 4], [3], []],
        text: '앞시김새나니더여표',
        trill: { before: false, after: true },
      })
      expect(ime.backspace()).toMatchObject({
        pitches: [[2, 4], [3], []],
        text: '앞시김새나니로표',
        trill: { before: false, after: false },
      })
      ime.backspace()
      ime.backspace()
      ime.backspace()
      expect(ime.compile()).toBe(undefined)
    })

    it('can delete equals', () => {
      const ime = new IME()
      ime.update('Equal', true)
      ime.update('Equal', true)
      ime.update('Equal', true)
      ime.update('Equal', true)
      expect(ime.update('Backquote', true)).toMatchObject({
        pitches: [[], [3, 1, 3], [4, 3]],
        text: '나노다야표',
        trill: { after: true },
      })
      expect(ime.backspace()).toMatchObject({
        pitches: [[], [3, 1, 3], []],
        text: '나노나표',
        trill: { after: false },
      })
      expect(ime.backspace()).toMatchObject({
        pitches: [[], [3, 5, 3], []],
        text: '나리나표',
        trill: { after: false },
      })
      expect(ime.update('Backquote', true)).toMatchObject({
        pitches: [[], [3, 5, 3], [4, 3]],
        text: '나리다야표',
        trill: { after: true },
      })
      expect(ime.backspace()).toMatchObject({
        pitches: [[], [3, 5, 3], []],
        text: '나리나표',
        trill: { after: false },
      })
      expect(ime.backspace()).toMatchObject({
        pitches: [[], [3, 2, 3], []],
        text: '나느나표',
        trill: { after: false },
      })
      expect(ime.update('Backquote', true)).toMatchObject({
        pitches: [[], [3, 2, 3], [4, 3]],
        text: '나느다야표',
        trill: { after: true },
      })
      expect(ime.backspace()).toMatchObject({
        pitches: [[], [3, 2, 3], []],
        text: '나느나표',
        trill: { after: false },
      })
      expect(ime.backspace()).toMatchObject({
        pitches: [[], [3, 4, 3], []],
        text: '나니나표',
        trill: { after: false },
      })
      expect(ime.update('Backquote', true)).toMatchObject({
        pitches: [[], [3, 4, 3], [4, 3]],
        text: '나니다야표',
        trill: { after: true },
      })
      expect(ime.backspace()).toMatchObject({
        pitches: [[], [3, 4, 3], []],
        text: '나니나표',
        trill: { after: false },
      })
      expect(ime.backspace()).toBe(undefined)
    })

    it('can delete specials', () => {
      const ime = new IME()
      ime.update('Backquote', true)
      ime.update('KeyI', true)
      expect(ime.update('Backquote', true)).toMatchObject({
        pitches: [[2, 3, 2], [3], [2, 3, 2]],
        text: '더여니더여표',
        trill: { before: true, after: true },
      })
      expect(ime.backspace()).toMatchObject({
        pitches: [[2, 3, 2], [3], [2]],
        text: '더여니르표',
        trill: { before: true, after: false },
      })
      ime.backspace()
      expect(ime.backspace()).toBe(undefined)
    })
  })
})
