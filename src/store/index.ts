import chalk from 'chalk'
import { createStore, combineReducers, applyMiddleware } from 'redux'
import readline from 'readline'
import types from 'app/store/actionTypes'
import * as reducers from 'app/store/reducers'
import thunk from 'redux-thunk'
import logger from 'redux-logger'
import fs from 'fs'
import { replHistoryPath } from 'app/constant'

const middlewares: any = [thunk]

if (true && false && process.env.NODE_ENV !== 'production') {
  middlewares.push(logger)
}

const store = createStore(combineReducers({ ...reducers }), applyMiddleware(...middlewares))

process.stdout.write(chalk.greenBright.bold(`In [1]: `))

fs.readFile(replHistoryPath, 'utf8', (err, data) => {
  if (err) {
    console.error(err)
    return
  }

  store.dispatch({
    type: types.SET_HISTORIES,
    histories: data.split('\n'),
  })
})

store.subscribe(() => {
  const { completions, cursorPosition, command, replCount, completionIndex } = store.getState()
  const countIndicator = `In [${replCount}]: `

  readline.cursorTo(process.stdout, 0)
  readline.clearLine(process.stdout, 0)
  readline.clearScreenDown(process.stdout)

  process.stdout.write(chalk.greenBright.bold(countIndicator))
  process.stdout.write(command)

  if (completions.length > 0) {
    process.stdout.write('\n' + '\n')

    const completed = completions[completionIndex]
    process.stdout.write(completions.slice(0, completionIndex).join(' '))
    process.stdout.write(' ' + chalk.bgMagentaBright.bold(completed) + ' ')
    process.stdout.write(completions.slice(completionIndex + 1, -1).join(' '))

    readline.cursorTo(
      process.stdout,
      countIndicator.length + cursorPosition,
      (process.stdout.rows || 0) - 15,
    )

    // if (completed !== command) {
    //   setImmediate(() =>
    //     store.dispatch({
    //       type: types.SET_COMMAND,
    //       command: command + completed,
    //     }),
    //   )
    // }
  } else {
    readline.cursorTo(process.stdout, countIndicator.length + cursorPosition)
  }

  // console.log(store.getState())
})

export default store
