import readline from 'readline'
import vm from 'vm'
import * as actions from 'app/store/actionCreators'
// import { complete } from './completion-engine'

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

const ctx = vm.createContext(sandbox)

export const start = () => {
  if (!process.stdin.setRawMode) {
    throw new Error('setRawMode is not supported')
  }
  process.stdin.setRawMode(true)
  readline.emitKeypressEvents(process.stdin)
  process.stdin.setEncoding('utf8')

  process.stdin.on('keypress', onKeyPress)
}

const onKeyPress = async (str: any, key: KeyInfo) => {
  if (key.ctrl) {
    switch (key.name) {
      case 'a':
        return actions.toStart()
      case 'b':
        return actions.backward()
      case 'c':
        return process.exit(0)
      case 'd':
        return actions.del()
      case 'e':
        return actions.toEnd()
      case 'f':
        return actions.forward()
      case 'n':
        return actions.historyForward()
      case 'p':
        return actions.historyBack()
    }
    return
  }

  switch (key.name) {
    case 'backspace':
      return actions.backspace()
    case 'return':
      await actions.runCommand(ctx)
      return
    default:
      return actions.input(str)
  }
}

// export default class Repl {
//   replCount: number = 1
//   history: string[] = []
//   historyIndex: number = 0
//   tty: Tty
//   ctx: Context
//
//   showCompletionCandidates() {
//     const { localVars, omniCompletions, search } = complete(
//       this.ctx,
//       this.tty.command,
//       this.tty.cursorPosition,
//     )
//     console.log()
//     console.log(chalk.bgBlue.white.bold('local vars'))
//     console.log(localVars)
//     console.log()
//     console.log(chalk.bgBlue.white.bold('omni completions'))
//     console.log(omniCompletions.join(' '))
//     console.log()
//
//     if (omniCompletions.length === 1 && search) {
//       this.tty.insert(omniCompletions[0].replace(search.method, ''))
//     }
//     this.tty.refresh()
//     return { localVars }
//   }
//
//
//   onKeyPress = async (_str: any, key: KeyInfo) => {
//     if (key.name === 'tab') {
//       return this.showCompletionCandidates()
//     }
//
//     if (key.name === 'backspace') {
//       if (this.tty.cursorPosition === 0) {
//         return
//       }
//       const [before, after] = this.tty.splitCommandAtCursor()
//       const position = this.tty.cursorPosition
//       this.tty.setCommand(before.slice(0, -1) + after)
//       this.tty.cursorPosition = position - 1
//       this.tty.setPosition(position - 1)
//       return
//     }
//
//     if (key.name === 'return') {
//
//       if (this.tty.command === 'ls') {
//         const res = this.showCompletionCandidates()
//         this.tty.setCommand('')
//         this.replCount++
//         this.tty.setPrompt(this.prompt)
//         this.tty.cursorPosition = 0
//         return res
//       }
//
//       if (this.history.slice(-1)[0] !== this.tty.command) {
//         this.history.push(this.tty.command)
//       }
//       this.historyIndex = this.history.length
//       this.tty.cursorPosition = 0
//       console.log()
//       let res: any
//     }
//
//     if (key.ctrl && key.name === 'a') {
//       this.tty.setPosition(0)
//       return
//     }
//
//     if (key.ctrl && key.name === 'e') {
//       this.tty.setPosition(this.tty.command.length)
//       return
//     }
//
//     if (key.ctrl && key.name === 'b') {
//       if (this.tty.cursorPosition === 0) {
//         return
//       }
//       this.tty.moveCursor(-1)
//       return
//     }
//
//     if (key.ctrl && key.name === 'f') {
//       store.dispatch({
//         type: types.CURSOR_RIGHT,
//       })
//       if (this.tty.cursorPosition >= this.tty.command.length) {
//         return
//       }
//       this.tty.moveCursor(1)
//       return
//     }
//
//     if (key.ctrl && key.name === 'p') {
//       if (this.historyIndex === 0 || this.history.length === 0) {
//         return
//       }
//       this.historyIndex--
//       const command = this.history[this.historyIndex]
//       if (!command) {
//         return
//       }
//       this.tty.setPosition(command.length)
//       this.tty.setCommand(command)
//       return
//     }
//
//     if (key.ctrl && key.name === 'n') {
//       if (this.historyIndex === this.history.length) {
//         return
//       }
//       this.historyIndex++
//       const command = this.history[this.historyIndex]
//       if (command) {
//         this.tty.setCommand(command)
//       } else {
//         this.tty.setCommand('')
//       }
//       return
//     }
//
//     this.tty.insert(key.sequence)
//   }
// }
