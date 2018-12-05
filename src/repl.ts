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

export const onKeyPress = async (_str: any, key: KeyInfo) => {
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
      return actions.input(key.sequence)
  }
}

// export default class Repl {
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
//   }
// }
