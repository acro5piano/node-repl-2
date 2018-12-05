import store from 'app/store'
import { AppState } from 'app/store/reducers'

const getter = <T extends {}>(fn: (state: AppState) => T) => () => fn(store.getState())

export const splitCommandAtCursor = getter(({ command, cursorPosition }) => {
  return [command.substr(0, cursorPosition), command.substr(cursorPosition, command.length)]
})
