import Repl from './repl'
import chalk from 'chalk'
import Tty from './tty'

const normalKey = (key: string) => ({
  sequence: key,
  name: key,
  ctrl: false,
})

const ctrlKey = (key: string) => ({
  sequence: key,
  name: key,
  ctrl: true,
})

describe('Repl', () => {
  let repl: Repl
  beforeEach(() => {
    repl = new Repl()
    repl.boot()
  })

  it('can init', () => {
    expect(repl).not.toBeFalsy()
  })

  it('can set prompt number', async () => {
    expect(repl.tty.prompt).toEqual(chalk.greenBright.bold(`In [1]: `))
    await repl.onKeyPress(null, normalKey('return'))
    expect(repl.tty.prompt).toEqual(chalk.greenBright.bold(`In [1]: `))
    await repl.onKeyPress(null, normalKey('a=1'))
    await repl.onKeyPress(null, normalKey('return'))
    expect(repl.tty.prompt).toEqual(chalk.greenBright.bold(`In [2]: `))
  })

  it('can move cursors', async () => {
    expect(repl.tty.cursorPosition).toBe(0)
    await repl.onKeyPress(null, normalKey('a'))
    await repl.onKeyPress(null, normalKey('b'))
    await repl.onKeyPress(null, normalKey('c'))
    expect(repl.tty.cursorPosition).toBe(3)

    await repl.onKeyPress(null, ctrlKey('b'))
    expect(repl.tty.cursorPosition).toBe(2)
    await repl.onKeyPress(null, ctrlKey('f'))
    expect(repl.tty.cursorPosition).toBe(3)
    await repl.onKeyPress(null, ctrlKey('f'))
    expect(repl.tty.cursorPosition).toBe(3)
    await repl.onKeyPress(null, ctrlKey('a'))
    expect(repl.tty.cursorPosition).toBe(0)
    await repl.onKeyPress(null, ctrlKey('e'))
    expect(repl.tty.cursorPosition).toBe(3)
  })

  it('can insert chars', async () => {
    expect(repl.tty.cursorPosition).toBe(0)
    expect(repl.state.history).toHaveLength(0)

    await repl.onKeyPress(null, normalKey('a'))
    await repl.onKeyPress(null, normalKey('b'))
    await repl.onKeyPress(null, normalKey('c'))
    expect(repl.tty.command).toEqual('abc')

    await repl.onKeyPress(null, normalKey('backspace'))
    await repl.onKeyPress(null, normalKey('backspace'))
    await repl.onKeyPress(null, normalKey('backspace'))
    expect(repl.tty.command).toEqual('')
    expect(repl.tty.cursorPosition).toBe(0)

    await repl.onKeyPress(null, normalKey('backspace'))
    await repl.onKeyPress(null, normalKey('backspace'))
    expect(repl.tty.command).toEqual('')
    expect(repl.tty.cursorPosition).toBe(0)

    await repl.onKeyPress(null, normalKey('a'))
    await repl.onKeyPress(null, normalKey('='))
    await repl.onKeyPress(null, normalKey('1'))
    expect(repl.tty.command).toEqual('a=1')
    expect(repl.tty.cursorPosition).toBe(3)

    const res = await repl.onKeyPress(null, normalKey('return'))
    expect(repl.tty.command).toEqual('')
    expect(res).toEqual(1)
    expect((repl.ctx as any).a).toEqual(1)
    expect(repl.tty.cursorPosition).toBe(0)
    expect(repl.state.history).toHaveLength(1)

    await repl.onKeyPress(null, normalKey('a'))
    await repl.onKeyPress(null, normalKey('b'))
    await repl.onKeyPress(null, normalKey('c'))
    await repl.onKeyPress(null, ctrlKey('d'))
    expect(repl.tty.command).toEqual('abc')

    await repl.onKeyPress(null, ctrlKey('b'))
    expect(repl.tty.cursorPosition).toBe(2)
    await repl.onKeyPress(null, ctrlKey('d'))
    expect(repl.tty.cursorPosition).toBe(2)
    expect(repl.tty.command).toEqual('ab')
  })

  it('interact histories', async () => {
    await repl.onKeyPress(null, normalKey('a=1'))
    await repl.onKeyPress(null, normalKey('return'))
    expect(repl.state.history).toHaveLength(1)
    expect(repl.state.history[0]).toEqual('a=1')

    await repl.onKeyPress(null, ctrlKey('p'))
    expect(repl.tty.command).toEqual('a=1')
    expect(repl.tty.cursorPosition).toEqual(3)
  })

  it('can show completion', async () => {
    await repl.onKeyPress(null, normalKey('a=1'))
    await repl.onKeyPress(null, normalKey('return'))
    expect((repl.showCompletionCandidates().localVars as any).a).toEqual(1)
    const tabRes = await repl.onKeyPress(null, normalKey('tab'))
    expect(tabRes.localVars.a).toEqual(1)
    await repl.onKeyPress(null, normalKey('ls'))
    const lsRes = await repl.onKeyPress(null, normalKey('return'))
    expect((lsRes.localVars as any).a).toEqual(1)
    expect(repl.tty.command).toEqual('')
  })
})
