import chalk from 'chalk'
import stripAnsi from 'strip-ansi'
import readline from 'readline'
import vm, { Context } from 'vm'
import Tty from './tty'
import { complete } from './completion-engine'
import * as React from 'react'

class DummyClass {
  dummyProperty = 1
  dummyMethod() {
    return 1
  }
}

const sandbox = {
  console,
  require,
  DummyClass,
  ...global,
}

const ctx = vm.createContext(sandbox) // Contextify the sandbox.

interface KeyInfo {
  sequence: string
  name: string
  ctrl: boolean
}

interface Props {
  tty?: Tty
  ctx?: Context
}

interface State {
  replCount: number
  history: string[]
  historyIndex: number
}

export default class Repl extends React.Component<Props, State> {
  tty: Tty
  ctx: Context
  state = {
    replCount: 1,
    history: [],
    historyIndex: 0,
  }

  constructor(
    { tty = new Tty(), ctx = vm.createContext(sandbox) }: Props = {},
    _context: any = {},
    renderer: any = () => {},
  ) {
    super({ tty, ctx }, renderer)
    this.tty = tty
    this.ctx = ctx
    this.state = {
      replCount: 1,
      history: [],
      historyIndex: 0,
    }
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
    return chalk.greenBright.bold(`In [${this.state.replCount}]: `)
  }

  boot() {
    process.stdin.on('keypress', this.onKeyPress)
    this.tty.setPrompt(this.prompt)
  }

  showCompletionCandidates() {
    const { localVars, omniCompletions, search } = complete(
      this.ctx,
      this.tty.command,
      this.tty.cursorPosition,
    )
    console.log()
    console.log(chalk.bgBlue.white.bold('local vars'))
    console.log(localVars)
    console.log()
    console.log(chalk.bgBlue.white.bold('omni completions'))
    console.log(omniCompletions.join(' '))
    console.log()

    if (omniCompletions.length === 1 && search) {
      this.tty.insert(omniCompletions[0].replace(search.method, ''))
    }
    this.tty.refresh()
    return { localVars }
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
        this.setState({ replCount: this.state.replCount + 1 })
        this.tty.setPrompt(this.prompt)
        this.tty.cursorPosition = 0
        return res
      }

      if (this.state.history.slice(-1)[0] !== this.tty.command) {
        this.setState({
          history: [...this.state.history, this.tty.command],
        })
      }
      this.setState({
        historyIndex: this.state.history.length,
      })
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
        this.setState({ replCount: this.state.replCount + 1 })
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

    // if (key.ctrl && key.name === 'p') {
    //   if (this.historyIndex === 0 || this.history.length === 0) {
    //     return
    //   }
    //   this.historyIndex--
    //   const command = this.history[this.historyIndex]
    //   if (!command) {
    //     return
    //   }
    //   this.tty.setPosition(command.length)
    //   this.tty.setCommand(command)
    //   return
    // }
    //
    // if (key.ctrl && key.name === 'n') {
    //   if (this.historyIndex === this.history.length) {
    //     return
    //   }
    //   this.historyIndex++
    //   const command = this.history[this.historyIndex]
    //   if (command) {
    //     this.tty.setCommand(command)
    //   } else {
    //     this.tty.setCommand('')
    //   }
    //   return
    // }

    this.tty.insert(key.sequence)
  }
}
