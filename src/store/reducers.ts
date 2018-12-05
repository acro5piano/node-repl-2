import { Action } from 'redux'
import types from 'app/store/actionTypes'

export type AppAction<T extends string, Extra extends {} = {}> = Action<T> &
  { [K in keyof Extra]: Extra[K] }

export interface AppState {
  readonly cursorPosition: number
  readonly replCount: number
  readonly command: string
  // readonly histories: string[]
  // readonly historyIndex: number
}

type CursorPositionAction =
  | AppAction<types.CURSOR_RIGHT>
  | AppAction<types.CURSOR_LEFT>
  | AppAction<types.SET_CURSOR_POSITON, { position: number }>

export const cursorPosition = (
  state: AppState['cursorPosition'] = 0,
  action: CursorPositionAction,
) => {
  switch (action.type) {
    case types.CURSOR_RIGHT:
      return state + 1
    case types.CURSOR_LEFT:
      if (state === 0) {
        return state
      }
      return state - 1
    case types.SET_CURSOR_POSITON:
      return action.position
    default:
      return state
  }
}

type ReplCountAction = AppAction<types.INCREMENT_REPL_COUNT> | AppAction<types.DECREMENT_REPL_COUNT>

export const replCount = (state: AppState['replCount'] = 1, action: ReplCountAction) => {
  switch (action.type) {
    case types.INCREMENT_REPL_COUNT:
      return state + 1
    case types.DECREMENT_REPL_COUNT:
      return state - 1
    default:
      return state
  }
}

type CommandAction =
  | AppAction<types.SET_COMMAND, { command: string }>
  | AppAction<types.APPEND_COMMAND, { command: string }>

export const command = (state: AppState['command'] = '', action: CommandAction) => {
  switch (action.type) {
    case types.SET_COMMAND:
      return action.command
    case types.APPEND_COMMAND:
      return `${state}${action.command}`
    default:
      return state
  }
}
