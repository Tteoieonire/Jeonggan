import { querySymbol } from './symbols'

describe('querySymbol', () => {
  describe('main', () => {
    it('can query with key', () => {
      expect(querySymbol('main', '1')).toMatchObject({
        pitches: [1],
        text: '뒷시김새로표',
        label: '1. 제 음의 두 음 아래.',
      })
      expect(querySymbol('main', '454')).toMatchObject({
        pitches: [4, 5, 4],
        text: '뒷시김새느니르표',
        label: '4, 5, 4. 제 음의 한 음 위, 제 음의 두 음 위, 제 음의 한 음 위.',
      })
    })

    it('may or may not query with unknown key', () => {
      expect(querySymbol('main', '123')).toMatchObject({
        pitches: [1, 2, 3],
        text: '123',
        label: '1, 2, 3. 제 음의 두 음 아래, 제 음의 한 음 아래, 제 음.',
      })

      expect(() => querySymbol('main', '')).toThrow()
      expect(() => querySymbol('main', '7')).toThrow()
    })

    it('can query with text', () => {
      expect(querySymbol('main', '뒷시김새니표', 'text')).toMatchObject({
        pitches: [4],
        text: '뒷시김새니표',
        label: '4. 제 음의 한 음 위.',
      })
      expect(querySymbol('main', '뒷시김새느나니나표', 'text')).toMatchObject({
        pitches: [2, 3, 4, 3],
        text: '뒷시김새느나니나표',
        label:
          '2, 3, 4, 3. 제 음의 한 음 아래, 제 음, 제 음의 한 음 위, 제 음.',
      })
    })

    it('cannot query with unknown text', () => {
      expect(() => querySymbol('main', '', 'text')).toThrow()
      expect(() => querySymbol('main', '야옹', 'text')).toThrow()
    })
  })

  describe('modifier', () => {
    it('can query with key', () => {
      expect(querySymbol('modifier', '~13')).toMatchObject({
        pitches: [[1, 2, 1], [3], []],
        text: '앞시김새더여녜표',
        trill: { before: true },
        label:
          '앞에 1, 2, 1, 본음 3. 앞시김새로 제 음의 두 음 아래, 제 음의 한 음 아래, 제 음의 두 음 아래. 본음으로 제 음.',
      })
      expect(querySymbol('modifier', '=')).toMatchObject({
        pitches: [[], [3, 4, 3], []],
        text: '나니나표',
        trill: { after: false },
        label: '본음 3, 4, 3. 본음으로 제 음, 제 음의 한 음 위, 제 음.',
      })
    })

    it('returns undefined with unknown key', () => {
      expect(querySymbol('modifier', '123')).toMatchObject({
        pitches: [[1, 2], [3], []],
        text: '123',
        label:
          '앞에 1, 2, 본음 3. 앞시김새로 제 음의 두 음 아래, 제 음의 한 음 아래. 본음으로 제 음.',
      })
      expect(querySymbol('modifier', '~123')).toMatchObject({
        pitches: [[1, 2, 1, 2], [3], []],
        text: '~123',
        label:
          '앞에 1, 2, 1, 2, 본음 3. 앞시김새로 제 음의 두 음 아래, 제 음의 한 음 아래, 제 음의 두 음 아래, 제 음의 한 음 아래. 본음으로 제 음.',
      })
      expect(querySymbol('modifier', '123~')).toMatchObject({
        pitches: [[1, 2, 3, 4], [3], []],
        text: '123~',
        label:
          '앞에 1, 2, 3, 4, 본음 3. 앞시김새로 제 음의 두 음 아래, 제 음의 한 음 아래, 제 음, 제 음의 한 음 위. 본음으로 제 음.',
      })

      expect(() => querySymbol('modifier', '')).toThrow()
      expect(() => querySymbol('modifier', '!!!')).toThrow()
    })

    it('can query with text', () => {
      expect(querySymbol('modifier', '앞시김새니레표', 'text')).toMatchObject({
        pitches: [[4], [3], []],
        text: '앞시김새니레표',
        trill: { after: false },
        label: '앞에 4, 본음 3. 앞시김새로 제 음의 한 음 위. 본음으로 제 음.',
      })
      expect(
        querySymbol('modifier', '앞시김새다야니더여표', 'text')
      ).toMatchObject({
        pitches: [[2, 3, 2, 4, 3, 4], [3], []],
        text: '앞시김새다야니더여표',
        trill: { before: true, after: true },
        label:
          '앞에 2, 3, 2, 4, 3, 4, 본음 3. 앞시김새로 제 음의 한 음 아래, 제 음, 제 음의 한 음 아래, 제 음의 한 음 위, 제 음, 제 음의 한 음 위. 본음으로 제 음.',
      })
    })

    it('cannot query with unknown text', () => {
      expect(() => querySymbol('modifier', '', 'text')).toThrow()
      expect(() => querySymbol('modifier', '어흥', 'text')).toThrow()
    })
  })
})
