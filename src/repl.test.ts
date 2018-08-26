import Repl from './repl'
import Tty from './tty'

describe('Repl', () => {
  let repl
  beforeEach(() => {
    repl = new Repl()
  })
  it('can init', () => {
    expect(repl).not.toBeFalsy()
  })
})
