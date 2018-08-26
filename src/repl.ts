import readline from 'readline'
import vm, { Context } from 'vm'
import Tty from './tty'
import chalk from 'chalk'
import stripAnsi from 'strip-ansi'

const sandbox = {
  console: {
    ...console,
  },
}

const ctx = vm.createContext(sandbox) // Contextify the sandbox.

const char = chalk.greenBright.bold('In [2]: ')
console.log(stripAnsi(char).length)

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

  onKeyPress = async (str: string, key: KeyInfo) => {
    // console.log(this.tty.cursorPosition)

    if (key.name === 'backspace') {
      if (this.tty.cursorPosition === 0) {
        return
      }
      const command =
        this.tty.command.substr(0, this.tty.cursorPosition - 1) +
        this.tty.command.substr(this.tty.cursorPosition, this.tty.command.length)
      const position = this.tty.cursorPosition
      this.tty.setCommand(command)
      this.tty.cursorPosition = position - 1
      this.tty.setPosition(position - 1)
      return
    }

    if (key.ctrl && key.name === 'd') {
      if (this.tty.command === '') {
        process.exit(0)
        return
      }
      const command =
        this.tty.command.substr(0, this.tty.cursorPosition) +
        this.tty.command.substr(this.tty.cursorPosition + 1, this.tty.command.length)
      const position = this.tty.cursorPosition
      this.tty.setCommand(command)
      this.tty.setPosition(position)
      return
    }

    if (key.name === 'return') {
      if (this.history.slice(-1)[0] !== this.tty.command) {
        this.history.push(this.tty.command)
      }
      this.historyIndex = this.history.length
      this.tty.cursorPosition = 0
      console.log()
      try {
        const res = await vm.runInContext(this.tty.command, this.ctx)
        console.log(res)
      } catch (e) {
        console.error(e)
      } finally {
        console.log()
        this.tty.setCommand('')
        this.replCount++
        this.tty.setPrompt(this.prompt)
      }
      return
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

    const position = this.tty.cursorPosition
    const command =
      this.tty.command.substr(0, this.tty.cursorPosition) +
      key.sequence +
      this.tty.command.substr(this.tty.cursorPosition, this.tty.command.length)
    this.tty.setCommand(command)
    this.tty.setPosition(position + 1)
  }
}
