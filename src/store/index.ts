import chalk from 'chalk'
import { createStore, combineReducers, applyMiddleware } from 'redux'
import readline from 'readline'
import * as reducers from 'app/store/reducers'
import thunk from 'redux-thunk'
import logger from 'redux-logger'

const middlewares: any = [thunk]

if (true && false && process.env.NODE_ENV !== 'production') {
  middlewares.push(logger)
}

const store = createStore(combineReducers({ ...reducers }), applyMiddleware(...middlewares))

process.stdout.write(chalk.greenBright.bold(`In [1]: `))

store.subscribe(() => {
  const { completions, cursorPosition, command, replCount } = store.getState()
  const countIndicator = `In [${replCount}]: `
  readline.cursorTo(process.stdout, 0)
  readline.clearLine(process.stdout, 0)
  process.stdout.write(chalk.greenBright.bold(countIndicator))
  process.stdout.write(command)
  process.stdout.write(completions.join(', '))
  readline.cursorTo(process.stdout, countIndicator.length + cursorPosition)

  // console.log(store.getState())
})

export default store
