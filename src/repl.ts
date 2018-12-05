import chalk from 'chalk'
import readline from 'readline'
import vm, { Context } from 'vm'
import Tty from './tty'
import { complete } from './completion-engine'
import types from 'app/store/actionTypes'

import store from 'app/store'

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

interface KeyInfo {
  sequence: string
  name: string
  ctrl: boolean
}

const ctx: Context = vm.createContext(sandbox)

export const start = () => {
  if (!process.stdin.setRawMode) {
    throw new Error('setRawMode is not supported')
  }
  process.stdin.setRawMode(true)
  readline.emitKeypressEvents(process.stdin)
  process.stdin.setEncoding('utf8')

  process.stdin.on('keypress', onKeyPress)
}

const onKeyPress = async (_str: any, key: KeyInfo) => {
  if (key.ctrl && key.name === 'f') {
    const { command, cursorPosition } = store.getState()
    if (command.length === cursorPosition) {
      return
    }
    store.dispatch({
      type: types.CURSOR_RIGHT,
    })
    return
  }

  if (key.ctrl && key.name === 'c') {
    process.exit(0)
    return
  }

  if (key.ctrl && key.name === 'b') {
    store.dispatch({
      type: types.CURSOR_LEFT,
    })
    return
  }

  // if (key.ctrl && key.name === 'd') {
  //   const [before, after] = this.tty.splitCommandAtCursor()
  //   const position = this.tty.cursorPosition
  //   this.tty.setCommand(before + after.slice(1))
  //   this.tty.setPosition(position)
  //   return
  // }

  if (key.name === 'return') {
    const { command } = store.getState()
    if (command === '') {
      return
    }

    try {
      const res = await vm.runInContext(command, ctx)
      console.log()
      console.log(res)
      console.log()
    } catch (e) {
      console.error(e)
    } finally {
      store.dispatch({
        type: types.INCREMENT_REPL_COUNT,
      })
      store.dispatch({
        type: types.SET_COMMAND,
        command: '',
      })
      store.dispatch({
        type: types.SET_CURSOR_POSITON,
        position: 0,
      })
      return
    }
  }

  store.dispatch({ type: types.APPEND_COMMAND, command: _str })
  store.dispatch({ type: types.CURSOR_RIGHT })
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
    const repl = new Repl()
    return repl
  }

  get prompt() {
    return chalk.greenBright.bold(`In [${this.replCount}]: `)
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

  //
  // onKeyPress = async (_str: any, key: KeyInfo) => {
  //   if (key.name === 'tab') {
  //     return this.showCompletionCandidates()
  //   }
  //
  //   if (key.name === 'backspace') {
  //     if (this.tty.cursorPosition === 0) {
  //       return
  //     }
  //     const [before, after] = this.tty.splitCommandAtCursor()
  //     const position = this.tty.cursorPosition
  //     this.tty.setCommand(before.slice(0, -1) + after)
  //     this.tty.cursorPosition = position - 1
  //     this.tty.setPosition(position - 1)
  //     return
  //   }
  //
  //   if (key.ctrl && key.name === 'd') {
  //     if (this.tty.command === '') {
  //       process.exit(0)
  //       return
  //     }
  //     const [before, after] = this.tty.splitCommandAtCursor()
  //     const position = this.tty.cursorPosition
  //     this.tty.setCommand(before + after.slice(1))
  //     this.tty.setPosition(position)
  //     return
  //   }
  //
  //   if (key.name === 'return') {
  //     if (this.tty.command === '') {
  //       console.log()
  //       console.log()
  //       this.tty.setPrompt(this.prompt)
  //       return
  //     }
  //
  //     if (this.tty.command === 'ls') {
  //       const res = this.showCompletionCandidates()
  //       this.tty.setCommand('')
  //       this.replCount++
  //       this.tty.setPrompt(this.prompt)
  //       this.tty.cursorPosition = 0
  //       return res
  //     }
  //
  //     if (this.history.slice(-1)[0] !== this.tty.command) {
  //       this.history.push(this.tty.command)
  //     }
  //     this.historyIndex = this.history.length
  //     this.tty.cursorPosition = 0
  //     console.log()
  //     let res: any
  //     try {
  //       res = await vm.runInContext(this.tty.command, this.ctx)
  //       console.log(res)
  //       console.log()
  //     } catch (e) {
  //       console.error(e)
  //     } finally {
  //       this.tty.setCommand('')
  //       this.replCount++
  //       this.tty.setPrompt(this.prompt)
  //     }
  //     return res
  //   }
  //
  //   if (key.ctrl && key.name === 'c') {
  //     process.exit(0)
  //     return
  //   }
  //
  //   if (key.ctrl && key.name === 'a') {
  //     this.tty.setPosition(0)
  //     return
  //   }
  //
  //   if (key.ctrl && key.name === 'e') {
  //     this.tty.setPosition(this.tty.command.length)
  //     return
  //   }
  //
  //   if (key.ctrl && key.name === 'b') {
  //     if (this.tty.cursorPosition === 0) {
  //       return
  //     }
  //     this.tty.moveCursor(-1)
  //     return
  //   }
  //
  //   if (key.ctrl && key.name === 'f') {
  //     store.dispatch({
  //       type: types.CURSOR_RIGHT,
  //     })
  //     if (this.tty.cursorPosition >= this.tty.command.length) {
  //       return
  //     }
  //     this.tty.moveCursor(1)
  //     return
  //   }
  //
  //   if (key.ctrl && key.name === 'p') {
  //     if (this.historyIndex === 0 || this.history.length === 0) {
  //       return
  //     }
  //     this.historyIndex--
  //     const command = this.history[this.historyIndex]
  //     if (!command) {
  //       return
  //     }
  //     this.tty.setPosition(command.length)
  //     this.tty.setCommand(command)
  //     return
  //   }
  //
  //   if (key.ctrl && key.name === 'n') {
  //     if (this.historyIndex === this.history.length) {
  //       return
  //     }
  //     this.historyIndex++
  //     const command = this.history[this.historyIndex]
  //     if (command) {
  //       this.tty.setCommand(command)
  //     } else {
  //       this.tty.setCommand('')
  //     }
  //     return
  //   }
  //
  //   this.tty.insert(key.sequence)
  // }
}
