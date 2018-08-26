import readline from 'readline'
import vm, { Context } from 'vm'
import Tty from './tty'
import chalk from 'chalk'
import stripAnsi from 'strip-ansi'

const sandbox = {
  console,
}

const ctx = vm.createContext(sandbox) // Contextify the sandbox.

interface KeyInfo {
  sequence: string
  name: string
  ctrl: boolean
}

export default class Repl {
  replCount: number = 1
  history: string[] = []
  historyIndex: number = 0
  tty: Tty
  ctx: Context

  constructor(tty: Tty = new Tty(), ctx: Context = vm.createContext(sandbox)) {
    this.tty = tty
    this.ctx = ctx
  }

  static start() {
    if (!process.stdin.setRawMode) {
      throw new Error('setRawMode is not supported')
    }
    process.stdin.setRawMode(true)
    readline.emitKeypressEvents(process.stdin)
    process.stdin.setEncoding('utf8')

    const repl = new Repl()
    repl.boot()
    return repl
  }

  get prompt() {
    return chalk.greenBright.bold(`In [${this.replCount}]: `)
  }

  boot() {
    process.stdin.on('keypress', this.onKeyPress)
    this.tty.setPrompt(this.prompt)
  }

  showCompletionCandidates() {
    const ctx = Object.keys(this.ctx)
      .filter(x => x !== 'console')
      .reduce((car, cur) => ({ ...car, [cur]: (this.ctx as any)[cur] }), {})
    console.log()
    console.log(ctx)
    console.log()
    this.tty.refresh()
    return ctx
  }

  onKeyPress = async (_str: any, key: KeyInfo) => {
    if (key.name === 'tab') {
      return this.showCompletionCandidates()
    }

    if (key.name === 'backspace') {
      if (this.tty.cursorPosition === 0) {
        return
      }
      const [before, after] = this.tty.splitCommandAtCursor()
      const position = this.tty.cursorPosition
      this.tty.setCommand(before.slice(0, -1) + after)
      this.tty.cursorPosition = position - 1
      this.tty.setPosition(position - 1)
      return
    }

    if (key.ctrl && key.name === 'd') {
      if (this.tty.command === '') {
        process.exit(0)
        return
      }
      const [before, after] = this.tty.splitCommandAtCursor()
      const position = this.tty.cursorPosition
      this.tty.setCommand(before + after.slice(1))
      this.tty.setPosition(position)
      return
    }

    if (key.name === 'return') {
      if (this.tty.command === '') {
        console.log()
        console.log()
        this.tty.setPrompt(this.prompt)
        return
      }

      if (this.tty.command === 'ls') {
        const res = this.showCompletionCandidates()
        this.tty.setCommand('')
        this.replCount++
        this.tty.setPrompt(this.prompt)
        this.tty.cursorPosition = 0
        return res
      }

      if (this.history.slice(-1)[0] !== this.tty.command) {
        this.history.push(this.tty.command)
      }
      this.historyIndex = this.history.length
      this.tty.cursorPosition = 0
      console.log()
      let res: any
      try {
        res = await vm.runInContext(this.tty.command, this.ctx)
        console.log(res)
        console.log()
      } catch (e) {
        console.error(e)
      } finally {
        this.tty.setCommand('')
        this.replCount++
        this.tty.setPrompt(this.prompt)
      }
      return res
    }

    if (key.ctrl && key.name === 'c') {
      process.exit(0)
      return
    }

    if (key.ctrl && key.name === 'a') {
      this.tty.setPosition(0)
      return
    }

    if (key.ctrl && key.name === 'e') {
      this.tty.setPosition(this.tty.command.length)
      return
    }

    if (key.ctrl && key.name === 'b') {
      if (this.tty.cursorPosition === 0) {
        return
      }
      this.tty.moveCursor(-1)
      return
    }

    if (key.ctrl && key.name === 'f') {
      if (this.tty.cursorPosition >= this.tty.command.length) {
        return
      }
      this.tty.moveCursor(1)
      return
    }

    if (key.ctrl && key.name === 'p') {
      if (this.historyIndex === 0 || this.history.length === 0) {
        return
      }
      this.historyIndex--
      const command = this.history[this.historyIndex]
      if (!command) {
        return
      }
      this.tty.setCommand(command)
      return
    }

    if (key.ctrl && key.name === 'n') {
      if (this.historyIndex === this.history.length) {
        return
      }
      this.historyIndex++
      const command = this.history[this.historyIndex]
      if (command) {
        this.tty.setCommand(command)
      } else {
        this.tty.setCommand('')
      }
      return
    }

    this.tty.insert(key.sequence)
  }
}
