import { describe, expect, it } from 'vitest'
import { querySymbol, type ModifierEntry } from '../domain/symbols'
import { applyModifierTrill, formatTrillQuery } from './trill'

describe('trill helpers', () => {
  describe('formatTrillQuery', () => {
    it('adds before and after trill markers', () => {
      expect(formatTrillQuery('243', { before: true, after: true })).toBe(
        '~243~'
      )
    })

    it('replaces existing trill markers', () => {
      expect(formatTrillQuery('~243~', { before: false, after: true })).toBe(
        '243~'
      )
      expect(formatTrillQuery('243~', { before: true, after: false })).toBe(
        '~243'
      )
    })
  })

  describe('applyModifierTrill', () => {
    it('returns a modifier for the requested trill state', () => {
      const modifier = querySymbol('modifier', '243', 'key')

      expect(
        applyModifierTrill(modifier, { before: true, after: true })
      ).toMatchObject({
        query: '~243~',
        text: '앞시김새다야니더여표',
        trill: { before: true, after: true },
      })
    })

    it('removes trills from an existing trill modifier', () => {
      const modifier = querySymbol('modifier', '~243~', 'key')

      expect(applyModifierTrill(modifier, {})).toMatchObject({
        query: '243',
        text: '앞시김새나니로표',
        trill: { before: false, after: false },
      })
    })

    it('returns undefined for modifiers without a source query', () => {
      const modifier: ModifierEntry = {
        pitches: [[2], [3], []],
        text: 'custom',
        label: 'custom',
      }

      expect(applyModifierTrill(modifier, { before: true })).toBe(undefined)
      expect(applyModifierTrill(undefined, { before: true })).toBe(undefined)
    })
  })
})
