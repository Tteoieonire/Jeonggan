import { querySymbol } from './symbols'

class IME {
  grace: boolean = false
  digits: string = ''
  equals: string = ''
  special: string = ''
  trillBefore: string = ''
  trillAfter: string = ''

  reset() {
    this.digits = ''
    this.equals = ''
    this.special = ''
    this.trillBefore = ''
    this.trillAfter = ''
  }

  isComposing() {
    return (
      this.digits ||
      this.equals ||
      this.special ||
      this.trillBefore ||
      this.trillAfter
    )
  }

  compile() {
    if (!this.isComposing()) return undefined
    const where = this.grace ? 'modifier' : 'main'
    if (this.trillBefore && !this.digits && !this.equals && !this.special) {
      return querySymbol('modifier', '343') // single ~
    }
    let sequence = this.trillBefore
    sequence += this.digits + this.equals + this.special
    sequence += this.trillAfter
    return querySymbol(where, sequence)
  }

  update(code: string, shiftKey: boolean) {
    if (this.grace !== shiftKey) {
      this.grace = shiftKey
      this.reset()
    }

    if (0 <= +code && +code <= 6) {
      if (this.trillAfter || this.equals || this.special) this.reset()
      this.digits += code
    } else if (code === 'KeyH' || code === 'KeyI') {
      if (this.trillAfter || this.digits || this.equals) this.reset()
      this.special = code[3]
    } else if (code === 'Equal') {
      if (this.trillAfter || this.digits || this.special) this.reset()
      this.equals += '='
      if (this.equals === '=====') this.equals = '='
    } else if (code === 'Backquote') {
      if (!this.digits && !this.equals && !this.special) {
        this.trillBefore = '~'
      } else {
        this.trillAfter = '~'
      }
    } else {
      return undefined
    }
    return this.compile()
  }

  backspace() {
    if (this.trillAfter) {
      this.trillAfter = ''
    } else if (this.digits) {
      this.digits = this.digits.slice(0, -1)
    } else if (this.equals) {
      this.equals = this.equals.slice(0, -1)
    } else if (this.special) {
      this.special = ''
    } else if (this.trillBefore) {
      this.trillBefore = ''
    } else throw RangeError('IME is not composing.')
    return this.compile()
  }
}

export { IME }
