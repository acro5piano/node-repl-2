import vm from 'vm'
import { complete, getCursorWord } from './completion-engine'

// class DummyClass { dummyMethod() { return 1 } }

class DummyClass {
  dummyProperty = 1
  dummyMethod() {
    return 1
  }
}

const sandbox = {
  console,
  require,
  a: 1,
  DummyClass,
}

const ctx = vm.createContext(sandbox) // Contextify the sandbox.

describe('complete', () => {
  it('can parse line', () => {
    expect(getCursorWord('a = DummyClass.d &&', 15)).toEqual('DummyClass.d')
    expect(getCursorWord('a = DummyClass.d &&', 14)).toEqual('DummyClass.')
    expect(getCursorWord('a = DummyClass.d &&', 16)).toEqual('DummyClass.d')
    expect(getCursorWord('a = HogeClass.d &&', 15)).toEqual('HogeClass.d')
    expect(getCursorWord('a = HogeClass.d ', 15)).toEqual('HogeClass.d')
  })
  it('can complete', () => {
    const expected = {
      localVars: {
        a: 1,
        DummyClass,
      },
      omniCompletions: ['dummyMethod', 'dummyProperty'],
      search: {
        method: 'd',
        class: 'DummyClass',
      },
    }
    const actual = complete(ctx, 'a = DummyClass.d &&', 15)
    expect(actual).toEqual(expected)
    expect(complete(ctx, 'a = DummyClass.d &&', 16)).toEqual(expected)
  })
})
