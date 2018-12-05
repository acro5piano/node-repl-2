import store from 'app/store'
import types from 'app/store/actionTypes'
import vm, { Context } from 'vm'
import { splitCommandAtCursor } from 'app/store/getters'
import fs from 'fs'
import { replHistoryPath } from 'app/constant'

export const runCommand = async (ctx: Context) => {
  const { command } = store.getState()
  if (command === '') {
    console.log('\n')
    // HACK: to re-render
    store.dispatch({
      type: types.SET_COMMAND,
      command: '',
    })
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
      type: types.ADD_HISTORY,
      command,
    })
    store.dispatch({
      type: types.SET_COMMAND,
      command: '',
    })
    store.dispatch({
      type: types.SET_CURSOR_POSITON,
      position: 0,
    })
    store.dispatch({
      type: types.SET_COMPLETIONS,
      items: [],
    })
    const { histories } = store.getState()
    store.dispatch({
      type: types.SET_HISTORY_INDEX,
      index: histories.length,
    })
    fs.writeFile(replHistoryPath, histories.join('\n'), err => {
      if (err) {
        console.log(err)
      }
    })
    return
  }
}

export const forward = () => {
  const { command, cursorPosition } = store.getState()
  if (command.length === cursorPosition) {
    return
  }
  store.dispatch({
    type: types.CURSOR_RIGHT,
  })
}

export const backward = () => {
  const { command } = store.getState()
  if (command.length === 0) {
    return
  }
  store.dispatch({
    type: types.CURSOR_LEFT,
  })
}

export const del = () => {
  const { cursorPosition } = store.getState()
  const [before, after] = splitCommandAtCursor()
  store.dispatch({
    type: types.SET_COMMAND,
    command: before + after.slice(1),
  })
  store.dispatch({
    type: types.SET_CURSOR_POSITON,
    position: cursorPosition,
  })
}

export const backspace = () => {
  const { cursorPosition } = store.getState()
  if (cursorPosition === 0) {
    return
  }
  const [before, after] = splitCommandAtCursor()
  store.dispatch({
    type: types.SET_COMMAND,
    command: before.slice(0, -1) + after,
  })
  store.dispatch({
    type: types.CURSOR_LEFT,
  })
}

export const input = (str: string) => {
  const { command, cursorPosition } = store.getState()
  const newCommand =
    command.substr(0, cursorPosition) + str + command.substr(cursorPosition, command.length)
  store.dispatch({ type: types.SET_COMMAND, command: newCommand })
  store.dispatch({ type: types.SET_CURSOR_POSITON, position: cursorPosition + 1 })
}

export const toStart = () => {
  store.dispatch({ type: types.SET_CURSOR_POSITON, position: 0 })
}

export const toEnd = () => {
  const { command } = store.getState()
  store.dispatch({ type: types.SET_CURSOR_POSITON, position: command.length })
}

export const historyBack = () => {
  store.dispatch({ type: types.DECREMENT_HISTORY_INDEX })
  const { historyIndex, histories } = store.getState()
  const command = histories[historyIndex] === undefined ? '' : histories[historyIndex]
  store.dispatch({ type: types.SET_COMMAND, command })
  toEnd()
}

export const historyForward = () => {
  const { historyIndex, histories } = store.getState()
  if (historyIndex === histories.length) {
    return
  }
  store.dispatch({ type: types.INCREMENT_HISTORY_INDEX })
  const newHistoryIndex = store.getState().historyIndex
  const command = histories[newHistoryIndex] === undefined ? '' : histories[newHistoryIndex]
  store.dispatch({ type: types.SET_COMMAND, command })
  toEnd()
}

export const killLine = () => {
  const { command, cursorPosition } = store.getState()
  store.dispatch({ type: types.SET_COMMAND, command: command.slice(0, cursorPosition) })
  store.dispatch({ type: types.SET_CLIPBOARD, content: command.slice(cursorPosition) })
}

export const paste = () => {
  const { command, cursorPosition, clipboard } = store.getState()
  const newCommand =
    command.substr(0, cursorPosition) + clipboard + command.substr(cursorPosition, command.length)
  store.dispatch({ type: types.SET_COMMAND, command: newCommand })
  store.dispatch({ type: types.SET_CURSOR_POSITON, position: cursorPosition + clipboard.length })
}

export const complete = (_ctx: Context) => {
  const { command, cursorPosition } = store.getState()
  const target = command
    .slice(0, cursorPosition)
    .split(/[ =]/)
    .slice(-1)[0]
    .split('.')

  const query = target.slice(-1)[0]
  const targetString = target.slice(0, -1).join('.')

  console.log(targetString)

  const obj = (_ctx as any)[targetString]
  try {
    const items = Object.getOwnPropertyNames(obj)
    if (query) {
      store.dispatch({ type: types.SET_COMPLETIONS, items: items.filter(p => p.includes(query)) })
    } else {
      store.dispatch({ type: types.SET_COMPLETIONS, items })
    }

    store.dispatch({ type: types.INCREMENT_COMPLETION_INDEX })

    const { completionIndex, completions } = store.getState()
    const completed = completions[completionIndex]
    if (completed !== query) {
      const newCommand = query ? command.replace(query, completed) : command + completed
      store.dispatch({
        type: types.SET_COMMAND,
        command: newCommand,
      })
    }
  } catch (e) {
    console.log(e)
    // pass
  }
}
