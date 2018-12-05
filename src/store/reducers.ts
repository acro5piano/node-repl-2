import { Action } from 'redux'
import types from 'app/store/actionTypes'

export type AppAction<T extends string, Extra extends {} = {}> = Action<T> &
  { [K in keyof Extra]: Extra[K] }

export interface AppState {
  readonly cursorPosition: number
  readonly replCount: number
  readonly command: string
  readonly histories: string[]
  readonly historyIndex: number
  readonly completions: string[]
  readonly completionIndex: number
  readonly clipboard: string
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

type HistoryAction =
  | AppAction<types.ADD_HISTORY, { command: string }>
  | AppAction<types.SET_HISTORIES, { histories: string[] }>

export const histories = (state: AppState['histories'] = [], action: HistoryAction) => {
  switch (action.type) {
    case types.SET_HISTORIES:
      return action.histories
    case types.ADD_HISTORY:
      if (state.slice(-1)[0] === action.command) {
        return state
      }
      return [...state, action.command]
    default:
      return state
  }
}

type HistoryIndexAction =
  | AppAction<types.SET_HISTORY_INDEX, { index: number }>
  | AppAction<types.SET_HISTORIES, { histories: string[] }>
  | AppAction<types.INCREMENT_HISTORY_INDEX>
  | AppAction<types.DECREMENT_HISTORY_INDEX>

export const historyIndex = (state: AppState['historyIndex'] = 0, action: HistoryIndexAction) => {
  switch (action.type) {
    case types.SET_HISTORIES:
      return action.histories.length
    case types.SET_HISTORY_INDEX:
      return action.index
    case types.INCREMENT_HISTORY_INDEX:
      return state + 1
    case types.DECREMENT_HISTORY_INDEX:
      if (state === 0) {
        return state
      }
      return state - 1
    default:
      return state
  }
}

type CompletionAction =
  | AppAction<types.SET_COMPLETIONS, { items: string }>
  | AppAction<types.RUN_COMMAND>
  | AppAction<types.CURSOR_LEFT>
  | AppAction<types.CURSOR_RIGHT>
  | AppAction<types.SET_CURSOR_POSITON>
  | AppAction<types.SET_CLIPBOARD>

// TODO: なぜか state: AppState['completions'] とするとバグる
export const completions = (state: /*string[]*/ any = [], action: CompletionAction) => {
  switch (action.type) {
    case types.SET_COMPLETIONS:
      return action.items
    case types.RUN_COMMAND:
    case types.CURSOR_LEFT:
    case types.CURSOR_RIGHT:
    case types.SET_CURSOR_POSITON:
    case types.SET_CLIPBOARD:
      return []
    default:
      return state
  }
}

type CompletionIndexAction =
  | AppAction<types.INCREMENT_COMPLETION_INDEX>
  | AppAction<types.DECREMENT_COMPLETION_INDEX>
  | AppAction<types.SET_COMPLETIONS>
  | AppAction<types.SET_COMMAND>

export const completionIndex = (
  state: AppState['completionIndex'] = 0,
  action: CompletionIndexAction,
) => {
  switch (action.type) {
    case types.INCREMENT_COMPLETION_INDEX:
      return state + 1
    case types.DECREMENT_COMPLETION_INDEX:
      return state - 1
    case types.SET_COMMAND:
    case types.SET_COMPLETIONS:
      return state
    default:
      return 0
  }
}

type ClipboardAction = AppAction<types.SET_CLIPBOARD, { content: string }>

export const clipboard = (state: AppState['clipboard'] = '', action: ClipboardAction) => {
  switch (action.type) {
    case types.SET_CLIPBOARD:
      return action.content
    default:
      return state
  }
}
