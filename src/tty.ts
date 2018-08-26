import readline from 'readline'
import tty from 'tty'
import vm from 'vm'

interface KeyInfo {
  sequence: string
  name: string
  ctrl: boolean
}

export default class Tty {
  replCount: number = 1
  cursorPosition: number = 0
  prompt: string = ''
  command: string = ''
  history: string[] = []
  historyIndex: number = 0

  public setPromptAndCommand(prompt: string, command: string) {
    this.cursorTo(0)
    this.clearLine()
    this.prompt = prompt
    this.command = command
    process.stdout.write(prompt + command)
    this.cursorTo((prompt + command).length)
  }

  public setPrompt(prompt: string) {
    this.cursorTo(0)
    this.clearLine()
    this.prompt = prompt
    process.stdout.write(prompt)
    process.stdout.write(this.command)
  }

  public setCommand(command: string) {
    this.cursorTo(0)
    this.clearLine()
    this.command = command
    process.stdout.write(this.prompt)
    process.stdout.write(command)
  }

  public cursorTo(to: number) {
    readline.cursorTo(process.stdout, to)
  }

  public moveCursor(dx: number) {
    readline.moveCursor(process.stdout, dx, 0)
    this.cursorPosition += dx
  }

  public clearLine() {
    readline.clearLine(process.stdout, 0)
  }

  public newLine() {
    process.stdout.write(`\n`)
  }

  public setPosition(position: number) {
    // console.log(position)
    this.cursorPosition = position
    readline.cursorTo(process.stdout, this.prompt.length + position)
  }

  public incrementPosition() {
    this.cursorPosition++
  }
}
